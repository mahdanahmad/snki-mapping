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

	svg.append('g').attr('id', inset_id);

	d3.queue()
		.defer(d3.json, 'bps/0.json')
		.defer(d3.json, 'network/2G.json')
		.defer(d3.json, 'network/3G.json')
		.defer(d3.json, 'network/4G.json')
		.defer(d3.json, 'proximity/proximity.json')
		.defer(d3.json, 'road.json')
		.await((err, national, two, three, four, proximity, road) => {
			initInset(national);

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

			let prox_cnvs	= canvas.append('g')
				.attr('id', 'wrapped-proximity')
				.attr('class', 'hidden')
			drawProximity(prox_cnvs, proximity);

			canvas.append('g').attr('id', 'maps-wrapper');
			drawMap(0, 'national');

			canvas.append('g').attr('id', 'road-wrapper').attr('class', 'cursor-pointer hidden')
				.selectAll('path').data(topojson.feature(road, road.objects.map).features).enter().append('g').append('path')
					.attr('d', path)
					.attr('vector-effect', 'non-scaling-stroke')
					.attr('fill', 'none');

			setTimeout(() => toggleLoading(true), 1000);
		});
}

function zoom(id, state) {
	let svg	= d3.select("svg#" + map_id + '> g#canvas');

	if (path && svg.node()) {
		svg.select('g.pin-wrapper').remove();
		if ($( point_id + ' > input' ).prop('checked')) { svg.select('g#' + point_wrapper).remove(); }

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

			setTimeout(() => { drawMap(id, states[curr_state]); }, 750);
			svg.selectAll('path.' + state).classed('unintended', true);

			if ( state == _.head(states) ) { insetActive(id); }
		} else if (_.isNil(state)) {
			x = node.width / 2;
			y = node.height / 2;
			scale = 1;

			svg.selectAll('g#' + _.head(states) + '-' + centered[_.head(states)]).classed('hidden', false);
			svg.selectAll(states.map((o) => ('g.' + o + '-wrapper')).join(', ')).remove();
			centered	= {};

			svg.selectAll('path.unintended').classed('unintended', false);
			moveRuler(coalesce.national.distance);
			changeRegionHead();
			insetActive();

			let active		= $( base_target + ' > ul > li > input:checked' ).attr('value');
			let pointNeeded	= (active == layers[0][3]) || (active == layers[0][0] && $( point_id + ' > input' ).prop('checked'));
			if (pointNeeded) { d3.selectAll('g.wrapper.national-wrapper path').classed('seethrough', true); } else { refreshLegend(); }
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

		if ($( sidewrap ).hasClass('expanded')) { refreshAnalytic(); }
		if ($( point_id + ' > input' ).prop('checked')) { freeDrawPoint(); }
	}
};

function drawPoint(id, holdLegend=false) {
	let svg	= d3.select("svg#" + map_id + '> g#canvas > g#maps-wrapper');
	svg.select('g.pin-wrapper').remove();

	// centered[state]	= id;

	if ($( base_target + ' > ul > li > input:checked' ).attr('value') !== layers[0][2]) {
		$( '#wrapped-' + id + ' path' ).addClass('seethrough');

		getMapData((err, result) => {
			// curr_state++;
			// moveSlider();

			let wrapper	= svg.append('g').attr('class', 'pin-wrapper');

			let pinSize		= 4 / scale;
			let triangle	= d3.path();
			triangle.moveTo(0, -pinSize);
			triangle.lineTo(pinSize, pinSize);
			triangle.lineTo(-pinSize, pinSize);
			triangle.lineTo(0, -pinSize);
			triangle.closePath();

			wrapper.selectAll('circle')
				.data(result.data.filter((o) => (o.shape == 'circle')))
				.enter().append('circle')
					.attr('class', 'pin')
					.attr('r', pinSize)
					.attr('transform', (o) => {
						let pix	= projection([o.long, o.lat]);
						return ('translate(' + pix[0] + ',' + pix[1] + ')')
					})
					.style('fill', (o) => (o.color));

			wrapper.selectAll('rect')
				.data(result.data.filter((o) => (o.shape == 'rect')))
				.enter().append('rect')
					.attr('class', 'pin')
					.attr('x', -pinSize)
					.attr('y', -pinSize)
					.attr('width', pinSize * 2)
					.attr('height', pinSize * 2)
					.attr('transform', (o) => {
						let pix	= projection([o.long, o.lat]);
						return ('translate(' + pix[0] + ',' + pix[1] + ')')
					})
					.style('fill', (o) => (o.color));

			wrapper.selectAll('path')
				.data(result.data.filter((o) => (o.shape == 'triangle')))
				.enter().append('path')
					.attr('class', 'pin')
					.attr('d', triangle.toString())
					.attr('transform', (o) => {
						let pix	= projection([o.long, o.lat]);
						return ('translate(' + pix[0] + ',' + pix[1] + ')')
					})
					.style('fill', (o) => (o.color));

			if (!holdLegend) { createLegend(result.legend, lang_lists.type[lang]); }
		});
	}
}

function freeDrawPoint() {
	toggleLoading();
	d3.select('g#' + point_wrapper).remove();
	let canvas	= d3.select("svg#" + map_id + '> g#canvas').append('g').attr('id', point_wrapper);

	getPoints((err, result) => {
		let pinSize		= (curr_state + (curr_state < 0 ? 3 : 2)) / scale;
		let triangle	= d3.path();
		triangle.moveTo(0, -pinSize);
		triangle.lineTo(pinSize, pinSize);
		triangle.lineTo(-pinSize, pinSize);
		triangle.lineTo(0, -pinSize);
		triangle.closePath();

		canvas.selectAll('circle')
			.data(result.data.filter((o) => (o.shape == 'circle')))
			.enter().append('circle')
				.attr('class', 'point')
				.attr('r', pinSize)
				.attr('transform', (o) => {
					let pix	= projection([o.long, o.lat]);
					return ('translate(' + pix[0] + ',' + pix[1] + ')')
				})
				.style('fill', (o) => (o.color));

		canvas.selectAll('rect')
			.data(result.data.filter((o) => (o.shape == 'rect')))
			.enter().append('rect')
				.attr('class', 'point')
				.attr('x', -pinSize)
				.attr('y', -pinSize)
				.attr('width', pinSize * 2)
				.attr('height', pinSize * 2)
				.attr('transform', (o) => {
					let pix	= projection([o.long, o.lat]);
					return ('translate(' + pix[0] + ',' + pix[1] + ')')
				})
				.style('fill', (o) => (o.color));

		canvas.selectAll('path')
			.data(result.data.filter((o) => (o.shape == 'triangle')))
			.enter().append('path')
				.attr('class', 'point')
				.attr('d', triangle.toString())
				.attr('transform', (o) => {
					let pix	= projection([o.long, o.lat]);
					return ('translate(' + pix[0] + ',' + pix[1] + ')')
				})
				.style('fill', (o) => (o.color));

		createLegend(result.legend, lang_lists.type[lang]);

		setTimeout(() => toggleLoading(true), 750);
	});
}

function drawMap(id, state) {
	let svg			= d3.select("svg#" + map_id + '> g#canvas > g#maps-wrapper');
	let next_state	= states[curr_state + 1];

	let active	= getActive();

	let promise	= new Promise((resolve, reject) => {
		d3.json('bps/' + id + '.json', (err, raw) => {
			let topo				= topojson.feature(raw, raw.objects.map);
			mappedGeo[next_state]	= _.chain(topo).get('features', []).keyBy('properties.id').mapValues((o) => ({ centroid: path.centroid(o), bounds: path.bounds(o) })).value();

			if ( !_.includes(states, state) ) {
				countLenght(topo, (distance) => { length = distance; moveRuler(distance); });
			} else {
				moveRuler(length / scale);
			}

			let grouped	= svg.append('g').attr('id', 'wrapped-' + id).attr('class', state + '-wrapper wrapper')
				.selectAll('path.' + state).data(topo.features).enter().append('g')
				.attr('id', (o) => (next_state + '-' + o.properties.id))
				.attr('class', 'grouped-' + state + ' cursor-pointer');

			let pointNeeded	= (active == layers[0][3]) || (active == layers[0][0] && $( point_id + ' > input' ).prop('checked'));

			if (pointNeeded) { d3.selectAll('g.wrapper path').classed('seethrough', false); }

			grouped.append('path')
				.attr('d', path)
				.attr('class', next_state + ' default-clr' + (pointNeeded ? ' seethrough': ''))
				.attr('vector-effect', 'non-scaling-stroke')
				.style('stroke-width', (base_stroke - ((curr_state + 1) * .1)) + 'px');

			grouped.append('text')
				.attr('x', (o) => (mappedGeo[next_state][o.properties.id].centroid[0]))
				.attr('y', (o) => (mappedGeo[next_state][o.properties.id].centroid[1]))
				.attr('class', ($( text_id + ' > input' ).prop('checked') ? '' : 'hidden'))
				.style('font-size', (base_font / scale > 0.013 ? (base_font / scale) : 0.013) + 'px')
				.text((o) => _.chain(o.properties.name).words().map(o => _.capitalize(o)).join(' ').value());

			grouped.on('click', (o) => {
				_.set(coalesce, next_state + '.name', state_head[states.indexOf(next_state)] + ' ' + o.properties.name);
				return !_.isNil(next_state) ? zoom(o.properties.id, next_state) : null;
			});

			// if (active == layers[0][0] && $( point_id + ' > input' ).prop('checked')) { grouped.selectAll('path').classed('seethrough', true); }

			changeRegionHead();
			setTimeout(() => { resolve() }, 300);
		});
	});

	promise.then(() => {
		switch (active) {
			case layers[0][0]:
				if (!$( point_id + ' > input' ).prop('checked')) { getMapData((err, data) => { colorMap(data.data, next_state); createLegend(data.legend, active); }); }
				break;
			case layers[0][1]:
				getMapData((err, data) => { colorMap(data.data, next_state); createLegend(data.legend, active); });
				break;
			case layers[0][2]:
				getMapData((err, data) => { colorMap(data.data, next_state); createLegend(data.legend, active); });
				break;
			case layers[0][3]:
				if ( curr_state >= (states.length - 1) ) { drawPoint(id, true); }
				break;
			default:

		}
	})
}

function colorMap(data, state) {
	$('.' + state).removeClass('unintended seethrough').css('fill', '').addClass('default-clr');

	data.forEach((o) => { $( '#' + state + '-' + o._id + ' > path' ).removeClass('default-clr').css('fill', o.color); });
}

function drawProximity(canvas, raw) {
	let topo	= topojson.feature(raw, raw.objects.map);

	let grouped	= canvas.selectAll('path').data(topo.features).enter()
		.append('g')
		.attr('id', (o) => (prx_pref + _.snakeCase(o.properties.Name)));

	grouped.append('path')
		.attr('d', path)
		.attr('vector-effect', 'non-scaling-stroke')
		.attr('fill', (o) => (prx_color[_.snakeCase(o.properties.Name)]));
}
