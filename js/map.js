let map_dest	= "#map-wrapper";
let map_id		= "map-viz";

let path;
const states	= ['prov', 'kabs', 'kecs', 'vils'];
let curr_state	= 0;

let mappedGeo	= {};
let centered	= {};

let base_font	= 10;
let base_stroke	= .5;
let base_opac	= .75;

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

	d3.json('json/0.json', (err, raw) => {
		let prov		= topojson.feature(raw, raw.objects.map);
		mappedGeo.prov	= _.chain(prov).get('features', []).keyBy('properties.id').mapValues((o) => ({ centroid: path.centroid(o), bounds: path.bounds(o) })).value();

		let grouped	= svg.append('g').attr('id', 'prov-wrapper')
			.selectAll('path.prov').data(prov.features).enter().append('g')
				.attr('id', (o) => (o.properties.id))
				.attr('class', 'grouped-prov cursor-pointer');

		grouped.append('path')
			.attr('d', path)
			.attr('class', 'prov')
			.attr('vector-effect', 'non-scaling-stroke')
			.style('stroke-opacity', base_opac)
			.style('stroke-width', base_stroke + 'px');

		grouped.append('text')
			.attr('x', (o) => (mappedGeo.prov[o.properties.id].centroid[0]))
			.attr('y', (o) => (mappedGeo.prov[o.properties.id].centroid[1]))
			.style('font-size', base_font + 'px')
			.text((o) => (o.properties.name));

		grouped.on('click', (o) => zoom(o.properties.id));
	});
}

function zoom(id) {
	let svg	= d3.select("svg#" + map_id + '> g');

	if (path && svg.node()) {
		let x, y, k;
		let node	= svg.node().getBBox();

		console.log(curr_state);

		if (id && centered[states[curr_state - 1]] !== id) {
			x = mappedGeo[states[curr_state]][id].centroid[0];
			y = mappedGeo[states[curr_state]][id].centroid[1];

			dx = mappedGeo[states[curr_state]][id].bounds[1][0] - mappedGeo[states[curr_state]][id].bounds[0][0],
      		dy = mappedGeo[states[curr_state]][id].bounds[1][1] - mappedGeo[states[curr_state]][id].bounds[0][1],

			k = Math.max(node.width * .35 / dx, node.height * .35 / dy);

			centered[states[curr_state]]	= id;
			curr_state++;
		} else {
			x = node.width / 2;
			y = node.height / 2;
			k = 1;

			centered[states[curr_state]]	= null;
			curr_state--;
		}

		let duration	= 750;

		svg.transition()
			.duration(duration)
			.attr('transform', 'translate(' + node.width / 2 + ',' + node.height / 2 + ')scale(' + k + ')translate(' + -x + ',' + -y + ')');

		d3.selectAll('svg#' + map_id + ' path').transition()
			.duration(duration)
			.style('stroke-opacity', base_opac)
			.style('stroke-width', (base_stroke - (curr_state * .1)) + 'px');

		d3.selectAll('svg#' + map_id + ' text').transition()
			.duration(duration)
			.style('font-size', (base_font / k) + 'px');


	}
};
