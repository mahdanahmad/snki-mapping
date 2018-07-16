let map_dest	= "#map-wrapper";
let map_id		= "#map-viz";

let path;

function initMap() {
	d3.select(map_dest).selectAll("svg").remove();

	let canvasWidth		= $(map_dest).outerWidth(true);
	let canvasHeight	= $(map_dest).outerHeight(true);

	let margin 			= { top: 0, right: 0, bottom: 0, left: 0 };
	let width			= canvasWidth - margin.right - margin.left;
	let height			= canvasHeight - margin.top - margin.bottom;

	let projection		= d3.geoMercator()
		.scale(width * 4.25)
		.center([135.25, -4.25])
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

	d3.json('json/0.json', (err, raw) => {
		console.log(raw);
		// let kabs	= topojson.feature(raw, raw.objects.PA_wilayah_kabupaten);
		//
		// svg.selectAll('path.kabupaten').data(kabs.features).enter().append('path')
		// 	.attr('id', (o) => (o.id))
		// 	.attr('d', path)
		// 	.attr('class', (o) => ('kabupaten color-4'))
		// 	.attr('vector-effect', 'non-scaling-stroke')
		//
		// let centroids	= _.chain(kabs.features).sortBy('id').map((o) => (path.centroid(o))).value();
		//
		// svg.selectAll('text.id').data(centroids).enter().append('text')
		// 	.attr('x', (o) => (o[0]))
		// 	.attr('y', (o) => (o[1]))
		// 	.style('fill', 'white')
		// 	.text((o, key) => (key + 1));

	});
}
