let map_dest	= "#map-wrapper";
let map_id		= "map-viz";

let path;
const states	= ['prov', 'kabs', 'kecs', 'vils'];
let curr_state	= -1;

let mappedGeo	= {};
let centered	= {};

let base_font	= 10;
let base_stroke	= .5;
let base_opac	= .75;
let scale		= 1;

function initMap() {
	d3.select(map_dest).selectAll("svg").remove();

	let canvasWidth		= $(map_dest).outerWidth(true);
	let canvasHeight	= $(map_dest).outerHeight(true);

	let margin 			= { top: 0, right: 0, bottom: 0, left: 0 };
	let width			= canvasWidth - margin.right - margin.left;
	let height			= canvasHeight - margin.top - margin.bottom;

	let projection		= d3.geoMercator()
		.scale(width * 1.15)
		.center([118, -1.85])
		.translate([width / 2, height / 2]);

	path	= d3.geoPath().projection(projection);

	let svg = d3.select(map_dest).append("svg")
		.attr("id", map_id)
		.attr("width", canvasWidth)
		.attr("height", canvasHeight)
		.append('g')
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	svg.append('rect')
		.attr('id', 'background')
		.attr('width', width)
		.attr('height', height)
		.on('click', () => zoom(null));

	drawMap(0, 'prov');
}

function zoom(id, state) {
	let svg	= d3.select("svg#" + map_id + '> g');

	if (path && svg.node() && (state !== _.last(states))) {
		let x, y;
		let node	= svg.node().getBBox();

		curr_state	= states.indexOf(state);

		if (id && centered[state] !== id) {
			x = mappedGeo[state][id].centroid[0];
			y = mappedGeo[state][id].centroid[1];

			dx = mappedGeo[state][id].bounds[1][0] - mappedGeo[state][id].bounds[0][0],
      		dy = mappedGeo[state][id].bounds[1][1] - mappedGeo[state][id].bounds[0][1],

			scale = Math.max(node.width * .35 / dx, node.height * .35 / dy);

			if (centered[state]) {
				// svg.select('g#' + 'wrapped-' + centered[state]).remove();
				svg.select('g#' + state + '-' + centered[state]).classed('hidden', false);

				svg.selectAll(states.slice(curr_state + 1).map((o) => ('g.' + o + '-wrapper')).join(', ')).remove();
			}
			svg.select('g#' + state + '-' + id).classed('hidden', true);
			centered[state]	= id;

			drawMap(id, states[curr_state + 1]);
		} else if (_.isNil(state)) {
			x = node.width / 2;
			y = node.height / 2;
			scale = 1;

			svg.selectAll('g#' + _.head(states) + '-' + centered[_.head(states)]).classed('hidden', false);
			svg.selectAll(_.tail(states).map((o) => ('g.' + o + '-wrapper')).join(', ')).remove();
			centered	= {};
		} else {
			x = node.width / 2;
			y = node.height / 2;
			scale = 1;

			svg.select('g#' + states[curr_state + 1] + '-' + centered[states[curr_state + 1]]).classed('hidden', false);
			svg.selectAll('g.' + states[curr_state + 2] + '-wrapper').remove();
			centered[states[curr_state + 1]]	= null;
		}

		let duration	= 750;

		svg.transition()
			.duration(duration)
			.attr('transform', 'translate(' + node.width / 2 + ',' + node.height / 2 + ')scale(' + scale + ')translate(' + -x + ',' + -y + ')');

		d3.selectAll('svg#' + map_id + ' path').transition()
			.duration(duration)
			.style('stroke-opacity', base_opac)
			.style('stroke-width', (base_stroke - ((curr_state + 1) * .1)) + 'px');

		d3.selectAll('svg#' + map_id + ' text').transition()
			.duration(duration)
			.style('font-size', (base_font / scale) + 'px');


	}
};

function drawMap(id, state) {
	let svg	= d3.select("svg#" + map_id + '> g');

	d3.json('json/' + id + '.json', (err, raw) => {
		let topo		= topojson.feature(raw, raw.objects.map);
		mappedGeo[state]	= _.chain(topo).get('features', []).keyBy('properties.id').mapValues((o) => ({ centroid: path.centroid(o), bounds: path.bounds(o) })).value();

		let grouped	= svg.append('g').attr('id', 'wrapped-' + id).attr('class', state + '-wrapper')
			.selectAll('path.' + state).data(topo.features).enter().append('g')
				.attr('id', (o) => (state + '-' + o.properties.id))
				.attr('class', 'grouped-' + state + ' cursor-pointer');

		grouped.append('path')
			.attr('d', path)
			.attr('class', state)
			.attr('vector-effect', 'non-scaling-stroke')
			.style('stroke-opacity', base_opac)
			.style('stroke-width', (base_stroke - ((curr_state + 1) * .1)) + 'px');

		grouped.append('text')
			.attr('x', (o) => (mappedGeo[state][o.properties.id].centroid[0]))
			.attr('y', (o) => (mappedGeo[state][o.properties.id].centroid[1]))
			.style('font-size', (base_font / scale) + 'px')
			.text((o) => (o.properties.name));

		grouped.on('click', (o) => zoom(o.properties.id, state));
	});
}
