let path, projection;
const states	= ['prov', 'kab', 'kec'];
// const states	= ['prov', 'kab', 'kec', 'desa'];
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
		.defer(d3.json, 'proximity/proximity.json')
		.await((err, two, three, four, proximity) => {
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

			drawMap(0, 'national');
			drawProximity(canvas, proximity);
			setTimeout(() => toggleLoading(true), 1000);
		});
}

function zoom(id, state) {
	let svg	= d3.select("svg#" + map_id + '> g#canvas');

	if (path && svg.node()) {
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

				svg.selectAll(states.slice(curr_state).map((o) => ('g.' + o + '-wrapper')).join(', ')).remove();
				centered = _.omit(centered, states.slice(curr_state + 1));
			}
			svg.select('g#' + state + '-' + id).classed('hidden', true);
			centered[state]	= id;

			drawMap(id, states[curr_state]);
			svg.selectAll('path.' + state).classed('unintended', true);
		} else if (_.isNil(state)) {
			x = node.width / 2;
			y = node.height / 2;
			scale = 1;

			svg.selectAll('g#' + _.head(states) + '-' + centered[_.head(states)]).classed('hidden', false);
			svg.selectAll(states.map((o) => ('g.' + o + '-wrapper')).join(', ')).remove();
			centered	= {};

			svg.selectAll('path.unintended').classed('unintended', false);
			moveRuler(coalesce.national.distance);
			refreshLegend();
			changeRegionHead();
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

function drawPoint(id, holdLegend=false) {
	let svg	= d3.select("svg#" + map_id + '> g#canvas');
	svg.select('g.pin-wrapper').remove();

	// centered[state]	= id;

	if ($( base_target + ' > ul > li > input:checked' ).attr('value') !== layers[1]) {
		$(states.map((o) => ('.' + o + '-wrapper path')).join(', ')).addClass('unintended');
		$( '#wrapped-' + id + ' path' ).addClass('seethrough');

		getMapData((err, result) => {
			// curr_state++;
			// moveSlider();

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

			if (!holdLegend) { createLegend(result.legend, 'Type of Access Point'); }
		});
	}
}

function drawMap(id, state) {
	let svg			= d3.select("svg#" + map_id + '> g#canvas');
	let next_state	= states[curr_state + 1];

	let promise	= new Promise((resolve, reject) => {
		d3.json('json/' + id + '.json', (err, raw) => {
			let topo				= topojson.feature(raw, raw.objects.map);
			mappedGeo[next_state]	= _.chain(topo).get('features', []).keyBy('properties.id').mapValues((o) => ({ centroid: path.centroid(o), bounds: path.bounds(o) })).value();

			let bbox = topojson.bbox(raw);

			// haversine([bbox[0], bbox[1]], [bbox[2], bbox[1]], (distance) => { moveRuler(distance); });
			if ( !_.includes(states, state) ) {
				countLenght(topo, (distance) => { length = distance; moveRuler(distance); });
			} else {
				moveRuler(length / scale);
			}

			let grouped	= svg.append('g').attr('id', 'wrapped-' + id).attr('class', state + '-wrapper')
				.selectAll('path.' + state).data(topo.features).enter().append('g')
				.attr('id', (o) => (next_state + '-' + o.properties.id))
				.attr('class', 'grouped-' + state + ' cursor-pointer');

			grouped.append('path')
				.attr('d', path)
				.attr('class', next_state + ' color-6')
				.attr('vector-effect', 'non-scaling-stroke')
				.style('stroke-width', (base_stroke - ((curr_state + 1) * .1)) + 'px');

			grouped.append('text')
				.attr('x', (o) => (mappedGeo[next_state][o.properties.id].centroid[0]))
				.attr('y', (o) => (mappedGeo[next_state][o.properties.id].centroid[1]))
				.style('font-size', (base_font / scale > 0.013 ? (base_font / scale) : 0.013) + 'px')
				.text((o) => (o.properties.name));

			grouped.on('click', (o) => {
				_.set(coalesce, next_state + '.name', state_head[curr_state + 1] + ' ' + o.properties.name);
				return !_.isNil(next_state) ? zoom(o.properties.id, next_state) : null;
			});

			changeRegionHead();
			setTimeout(() => { resolve() }, 300);
		});
	});

	promise.then(() => {
		let active	= $( base_target + ' > ul > li > input:checked' ).attr('value');
		switch (active) {
			case layers[0]:
				let willShowPoint	= curr_state >= (states.length - 1);
				toggleNetwork(!willShowPoint);
				if (willShowPoint) {
					drawPoint(id);
				} else {
					getMapData((err, data) => { colorMap(data.data, next_state); createLegend(data.legend, active); });
				}
				break;
			case layers[1]:
				getMapData((err, data) => { colorMap(data.data, next_state); createLegend(data.legend, active); });
				break;
			case layers[2]:
				if ( curr_state >= (states.length - 1) ) { drawPoint(id, true); }
				break;
			default:

		}
	})
}

function colorMap(data, state) {
	$('.' + state).removeClass('unintended seethrough').css('fill', '').addClass('color-6');

	data.forEach((o) => { $( '#' + state + '-' + o._id + ' > path' ).removeClass((idx, className) => ((className.match (/(^|\s)color-\S+/g) || []).join(' ')) ).css('fill', o.color); });
}

function drawProximity(canvas, raw) {
	let topo	= topojson.feature(raw, raw.objects.map);

	let grouped	= canvas.append('g')
		.attr('id', 'wrapped-proximity')
		.attr('class', 'hidden')
		.selectAll('path').data(topo.features).enter()
			.append('g')
			.attr('id', (o) => (prx_pref + _.snakeCase(o.properties.Name)));

	grouped.append('path')
		.attr('d', path)
		.attr('vector-effect', 'non-scaling-stroke')
		.attr('fill', (o) => (prx_color[_.snakeCase(o.properties.Name)]));
}
