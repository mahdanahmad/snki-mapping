const inset_id		= 'inset-wrapper';
const inset_toggle	= '#inset-toggler';

const inset_width	= 20; // percentage
const inset_height	= 20; // percentage

const inset_padding	= 20;

let in_mapped		= {};

function initInset(data) {
	let parentBBox		= d3.select('svg#' + map_id).node().getBBox();

	let canvas			= d3.select('g#' + inset_id);

	let canvasWidth		= parentBBox.width * inset_width / 100;
	let canvasHeight	= parentBBox.height * inset_height / 100;

	let topo			= topojson.feature(data, data.objects.map).features;
	in_mapped			= _.chain(topo).map(o => ([o.properties.id, o.properties.name])).fromPairs().value();

	canvas
		.attr('transform', 'translate(' + inset_padding + ', ' + (parentBBox.height - canvasHeight - inset_padding) + ')');

	let in_projection	= d3.geoMercator()
			.scale(canvasWidth * 1.15)
			.center([118, -1.85])
			.translate([canvasWidth / 2, canvasHeight / 2]);

	let in_path			= d3.geoPath().projection(in_projection);

	canvas.append('rect')
		.attr('width', canvasWidth)
		.attr('height', canvasHeight)
		.attr('id', 'inset-background');

	canvas.append('g').attr('id', 'inset-map')
		.selectAll('path').data(topo).enter().append('path')
			.attr('id', (o) => ('inset-' + o.properties.id))
			.attr('d', in_path);

	canvas.append('g').attr('id', 'inset-text').attr('transform', 'translate(' + canvasWidth / 2 + ', 20)')
		.append('text')
		.text('');

	canvas.append('image')
		.attr('class', 'cursor-pointer')
		.attr('xlink:href', '/image/icons/icon_close.svg')
		.attr('width', 30)
		.attr('height', 30)
		.attr('transform', 'translate(' + (canvasWidth - 15) + ', -15)')
		.on('click', () => { toggleInset(true); });
}

function insetActive(id) {
	d3.select('g#' + inset_id + ' path.active').classed('active', false);
	if (id) {
		d3.select('g#' + inset_id + ' path#inset-' + id).classed('active', true);

		let text	= d3.select('g#' + inset_id + ' g#inset-text text');
		text.text(in_mapped[id]).attr('x', -(text.node().getBBox().width / 2))
	} else {
		d3.select('g#' + inset_id + ' g#inset-text text').text('');
	}
}
