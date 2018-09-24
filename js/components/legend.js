let lgnd_width	= 100;

function createLegend(data, title) {
	let wrapper		= d3.select('g#legend-wrapper');
	let container	= wrapper.select('g#legend-container');

	container.selectAll('*').remove();

	let text	= container.append('text')
		.attr('text-anchor', 'middle')
		.attr('alignment-baseline', 'hanging')
		.text(!_.isEmpty(data) ? title.toUpperCase() : '');

	let boxes	= container.append('g')
		.attr('transform', 'translate(0,' + (text.node().getBBox().height * 1.75) + ')')
		.attr('id', 'boxes-wrapper');

	data.forEach((o, i) => {
		let box	= boxes.append('g')
			.attr('class', 'boxes')
			.attr('transform', 'translate(' + (lgnd_width * i) + ',0)');

		box.append('rect')
			.attr('x', 0)
			.attr('y', 0)
			.attr('width', 15)
			.attr('height', 15)
			.attr('fill', o.color);

		box.append('text')
			.attr('text-anchor', 'start')
			.attr('alignment-baseline', 'middle')
			.attr('transform', 'translate(' + 20 + ',' + 9 + ')')
			.text(o.text)
	});
	boxes.append('g').attr('transform', 'translate(' + (data.length * lgnd_width) + ',0)').append('circle').attr('r', 1).attr('fill-opacity', 0);

	text.attr('transform', 'translate(' + (boxes.node().getBBox().width / 2) + ',0)');

	container.attr('transform', 'translate(-' + (container.node().getBBox().width / 2)  + ',-' + (container.node().getBBox().height + 10) + ')');
	container.append('rect')
		.attr('x', -10)
		.attr('y', -10)
		.attr('width', container.node().getBBox().width + 20)
		.attr('height', container.node().getBBox().height + 20)
		.attr('fill', '#fff')
		.attr('fill-opacity', .1);
}

function refreshLegend() {
	let active	= $( base_target + ' > ul > li > input:checked' ).attr('value');
	if (_.includes([0,1], layers.indexOf(active))) {
		getMapData((err, result) => { colorMap(result.data, states[curr_state + 1]); createLegend(result.legend, 'Amount of FAP'); })
		toggleNetwork();
	}
}
