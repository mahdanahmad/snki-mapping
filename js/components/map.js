let path, projection;
const states	= ['prov', 'kab', 'kec', 'desa'];
let curr_state	= -1;

let mappedGeo	= {};
let coalesce	= {
	national	: { name : 'Nasional', scale: 1 }
}

let base_font	= 10;
let base_stroke	= .5;
let base_opac	= .75;
let scale		= 1;

let base_crcl	= 5;
let incr_crcl	= 1.5;
let pad_crcl	= 7.5;

function initMap() {
	d3.select(map_dest).selectAll("svg").remove();

	let canvasWidth		= $(map_dest).outerWidth(true);
	let canvasHeight	= $(map_dest).outerHeight(true);

	let margin 			= { top: 0, right: 0, bottom: 75, left: 0 };
	let width			= canvasWidth - margin.right - margin.left;
	let height			= canvasHeight - margin.top - margin.bottom;

	projection			= d3.geoMercator()
		.scale(width * 1.15)
		.center([118, -1.85])
		.translate([width / 2, height / 2]);

	path	= d3.geoPath().projection(projection);

	let svg = d3.select(map_dest).append("svg")
		.attr("id", map_id)
		.attr("width", canvasWidth)
		.attr("height", canvasHeight)

	let canvas	= svg.append('g')
		.attr("id", 'canvas')
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	canvas.append('rect')
		.attr('id', 'background')
		.attr('width', width)
		.attr('height', height)
		.on('click', () => zoom(null));

	let ruler	= svg.append('g')
		.attr("id", 'ruler');

	let vertical	= d3.path();
	vertical.moveTo(0, -10);
	vertical.lineTo(0, 10);

	ruler.append('path')
		.attr('id', 'right-vertical')
		.attr('d', vertical.toString());

	ruler.append('path')
		.attr('id', 'left-vertical')
		.attr('d', vertical.toString());

	let horizontal	= d3.path();
	horizontal.moveTo(0,0);
	horizontal.lineTo(0,0);

	ruler.append('path')
		.attr('id', 'horizontal')
		.attr('d', horizontal.toString());

	ruler.append('text')
		.attr('text-anchor', 'end')
		.attr('alignment-baseline', 'middle')
		.attr('x', -5)
		.attr('y', 0)
		.text('');

	ruler.attr('transform', 'translate(' + (width * 5.75 / 6) + ',' + (height + margin.bottom - ruler.node().getBBox().height) + ')')

	let slider	= svg.append('g')
		.attr('id', 'slider-wrapper')
		.attr('transform', 'translate(' + (width / 2) + ',' + height + ')')
			.append('g')
			.attr('id', 'slider-container')
			.attr('transform', 'translate(-' + (base_crcl) + ',0)');

	slider.append('circle')
		.attr('class', 'national cursor-pointer')
		.attr('r', base_crcl)
		.on('mouseover', onSliderHover)
		.on('mouseout', onSliderOut)
		.on('click', onSliderClick);

	tooltip	= d3.select(map_dest).append('div')
			.attr('id', 'slider-tooltip')
			.attr('class', 'hidden');

	_.set(coalesce, 'national.transform', 'translate(' + width / 2 + ',' + height / 2 + ')scale(' + 1 + ')translate(' + -width / 2 + ',' + -height / 2 + ')');

	let legend = svg.append('g')
		.attr('id', 'legend-wrapper')
		.attr('transform', 'translate(' + (width / 2) + ',' + (height + margin.bottom) + ')')
			.append('g')
			.attr('id', 'legend-container');

	d3.queue()
		.defer(d3.json, 'network/2G.json')
		.defer(d3.json, 'network/3G.json')
		.defer(d3.json, 'network/4G.json')
		.await((err, two, three, four) => {
			_.forEach({ two, three, four }, (raw, key) => {
				let topo	= topojson.feature(raw, raw.objects.map);

				let grouped	= canvas.append('g')
					.attr('id', 'wrapped-' + net_map[key])
					.attr('class', 'network hidden')
					.selectAll('path').data(topo.features).enter().append('g')

				grouped.append('path')
					.attr('d', path)
					.attr('vector-effect', 'non-scaling-stroke')
					.attr('fill', net_color[key]);
			});

			drawMap(0, 'prov');
			setTimeout(() => toggleLoading(true), 1000);
		});
}

function zoom(id, state) {
	let svg	= d3.select("svg#" + map_id + '> g#canvas');

	if (path && svg.node() && (state !== _.last(states))) {
		svg.select('g.pin-wrapper').remove();

		let x, y;
		let node	= svg.node().getBBox();

		curr_state	= states.indexOf(state);

		if (id && centered[state] !== id) {
			x = mappedGeo[state][id].centroid[0];
			y = mappedGeo[state][id].centroid[1];

			dx = mappedGeo[state][id].bounds[1][0] - mappedGeo[state][id].bounds[0][0],
      		dy = mappedGeo[state][id].bounds[1][1] - mappedGeo[state][id].bounds[0][1],

			scale = dx > dy ? node.width * .35 / dx : node.height * .8 / dy;

			if (centered[state]) {
				svg.select('g#' + state + '-' + centered[state]).classed('hidden', false);

				svg.selectAll(states.slice(curr_state + 1).map((o) => ('g.' + o + '-wrapper')).join(', ')).remove();
				centered = _.omit(centered, states.slice(curr_state + 1));
			}
			svg.select('g#' + state + '-' + id).classed('hidden', true);
			centered[state]	= id;

			drawMap(id, states[curr_state + 1]);
			svg.selectAll('path.' + state).classed('unintended', true);
		} else if (_.isNil(state)) {
			x = node.width / 2;
			y = node.height / 2;
			scale = 1;

			svg.selectAll('g#' + _.head(states) + '-' + centered[_.head(states)]).classed('hidden', false);
			svg.selectAll(_.tail(states).map((o) => ('g.' + o + '-wrapper')).join(', ')).remove();
			centered	= {};

			svg.selectAll('path.unintended').classed('unintended', false);
			moveRuler(coalesce.national.distance);
			refreshLegend();
			changeRegionHead();
			defaultAmountFAP();
		} else {
			console.error('unhandled');
		}

		moveSlider();

		let transform	= 'translate(' + node.width / 2 + ',' + node.height / 2 + ')scale(' + scale + ')translate(' + -x + ',' + -y + ')';
		_.set(coalesce, state + '.transform', transform);
		_.set(coalesce, state + '.scale', scale);
		svg.transition()
			.duration(duration)
			.attr('transform', transform);

		d3.selectAll('svg#' + map_id + ' g#canvas path').transition()
			.duration(duration)
			.style('stroke-width', (base_stroke - ((curr_state + 1) * .1)) + 'px');

		d3.selectAll('svg#' + map_id + ' g#canvas text').transition()
			.duration(duration)
			.style('font-size', (base_font / scale > 0.013 ? (base_font / scale) : 0.013) + 'px');


	}
};

function drawPoint(id) {
	let svg	= d3.select("svg#" + map_id + '> g#canvas');
	svg.select('g.pin-wrapper').remove();

	centered[_.last(states)]	= id;
	$(states.map((o) => ('.' + o + '-wrapper path')).join(', ')).addClass('unintended');

	getMapData((err, result) => {
		curr_state++;
		moveSlider();

		svg.append('g').attr('class', 'pin-wrapper')
			.selectAll('.pin')
			.data(result.data)
			.enter().append('circle')
				.attr('class', 'pin')
				.attr('r', 4 / scale)
				.attr('transform', (o) => {
					let pix	= projection([o.long, o.lat]);
					return ('translate(' + pix[0] + ',' + pix[1] + ')')
				})
				.style('fill', (o) => (o.color))

		createLegend(result.legend, 'Type of Access Point')
	});
}

function drawMap(id, state) {
	let svg	= d3.select("svg#" + map_id + '> g#canvas');

	d3.queue()
		.defer(getMapData)
		.defer(d3.json, 'json/' + id + '.json')
		.await((err, data, raw) => {
			let topo			= topojson.feature(raw, raw.objects.map);
			mappedGeo[state]	= _.chain(topo).get('features', []).keyBy('properties.id').mapValues((o) => ({ centroid: path.centroid(o), bounds: path.bounds(o) })).value();

			let bbox = topojson.bbox(raw);

			haversine([bbox[0], bbox[1]], [bbox[2], bbox[1]], (distance) => { moveRuler(distance); });

			let grouped	= svg.append('g').attr('id', 'wrapped-' + id).attr('class', state + '-wrapper')
				.selectAll('path.' + state).data(topo.features).enter().append('g')
				.attr('id', (o) => (state + '-' + o.properties.id))
				.attr('class', 'grouped-' + state + ' cursor-pointer');

			grouped.append('path')
				.attr('d', path)
				.attr('class', state + ' color-6')
				.attr('vector-effect', 'non-scaling-stroke')
				.style('stroke-width', (base_stroke - ((curr_state + 1) * .1)) + 'px');

			grouped.append('text')
				.attr('x', (o) => (mappedGeo[state][o.properties.id].centroid[0]))
				.attr('y', (o) => (mappedGeo[state][o.properties.id].centroid[1]))
				.style('font-size', (base_font / scale > 0.013 ? (base_font / scale) : 0.013) + 'px')
				.text((o) => (o.properties.name));

			grouped.on('click', (o) => {
				_.set(coalesce, state + '.name', o.properties.name);
				return _.last(states) == state ? drawPoint(o.properties.id) : zoom(o.properties.id, state) ;
			});

			changeRegionHead();

			setTimeout(() => colorMap(data.data, state), 300);
			if ($( base_target + ' > ul > li > input:checked' ).attr('value') !== layers[1]) { setTimeout(() => createLegend(data.legend, 'Amount of FAP'), 300); }
		});
}

function colorMap(data, state) {
	$('.' + state).removeClass('unintended').css('fill', '').addClass('color-6');

	data.forEach((o) => { $( '#' + state + '-' + o._id + ' > path' ).removeClass((idx, className) => ((className.match (/(^|\s)color-\S+/g) || []).join(' ')) ).css('fill', o.color); });
}
