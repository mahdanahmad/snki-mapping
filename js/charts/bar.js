const defHeight		= 15;
const textPad		= 5;

function createBar(result) {
	let canvasWidth		= $(chart_dest).width();
	let canvasHeight	= $(chart_dest).height();

	let margin 			= { top: 25, right: 25, bottom: 0, left: 125 };
	let width			= canvasWidth - margin.right - margin.left;
	let height			= canvasHeight - margin.top - margin.bottom;

	let canvas 			= d3.select(chart_dest).append('svg')
		.attr('id', bar_id)
		.attr('width', canvasWidth)
		.attr('height', canvasHeight)
		.append('g')
			.attr('id', 'canvas')
			.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

	let tooltip;
	let active	= getActive();

	if (!_.isEmpty(result.data)) {
		let total		= result.data.length;
		let chart_hgt	= (total * defHeight < height) ? total * defHeight : height;

		let x			= d3.scaleLinear().range([0, width]).domain([0, d3.max(result.data, (o) => (o.size))]);
		let y			= d3.scaleBand().range([chart_hgt, 0]).padding(0.1).domain(result.data.map((o) => (o.name)));

		let grouped		= canvas.selectAll('.bar')
			.data(result.data).enter().append('g').attr('class', (o) => (o.size ? '' : 'hidden'));

		grouped.append('rect')
			.attr('id', (o) => (_.snakeCase(o.name)))
			.attr('class', 'bar')
			// .attr('width', (o) => (x(o.size)))
			.attr('width', 0)
			.attr('y', (o) => (y(o.name)))
			.attr('height', y.bandwidth());

		grouped.append('text')
			// .attr('width', (o) => (x(o.size)))
			.attr('x', 0)
			.attr('y', (o) => (y(o.name) + (y.bandwidth() / 2) + 1))
			// .attr('text-anchor', 'middle')
			.attr('alignment-baseline', 'middle')
			.attr('class', (o) => ('cursor-default capita' + (o.size ? ' moved' : '')))
			.text((o) => (o.size ? ( _.includes([layers[0][1], layers[0][8]], active) ? nFormatter(o.size) : o.size + ( active == layers[0][2] ? '' : '%' ) ) : ''));

		grouped.on('mouseover', onMouseover)
		grouped.on('mouseout', onMouseout);

		let transition	= d3.transition()
	        .duration(duration)
	        .ease(d3.easeLinear);

		grouped.selectAll('.bar').transition(transition).attr('width', (o) => (x(o.size) || 0));
		grouped.selectAll('text.moved').transition(transition).attr('x', function(o) {
			let textwidth	= d3.select(this).node().getBBox().width + textPad;
			let boxWidth	= (x(o.size) || 0);
			d3.select(this).classed('outside', textwidth > boxWidth);
			return textwidth > boxWidth ? boxWidth + textPad : boxWidth - textwidth;
		});

		canvas.append('g').attr('id', 'axis').call(d3.axisLeft(y).tickSize(0));

		tooltip	= canvas.append('g').attr('id', 'tooltip-wrapper').style('opacity', 0);

		tooltip.append('rect').attr('x', 0).attr('y', 0).attr('rx', 5).attr('ry', 5);
		tooltip.append('text').attr('text-anchor', 'middle').attr('alignment-baseline', 'middle');

		if (active == layers[0][1]) {
			d3.select(misc_floor).text(lang_lists.adult[lang] + ': ' + (result.details.count ? addCommas(result.details.count) : 'N/A'));
		} else if (active == layers[0][2]) {
			d3.select(misc_floor).text(lang_lists.access[lang] + ': ' + (result.details.total || 'N/A'));
			d3.select(misc_adds).text(lang_lists.potential[lang] + ': ' + (result.details.adult ? addCommas(result.details.adult) : 'N/A'));
		}

		function onMouseover(o) {
			if (active == layers[0][2]) {
				tooltip.select('text').text(nFormatter(o.ap_count) + ' poin untuk ' + nFormatter(o.adult) + ' penduduk')

				tooltip.select('rect')
					.attr('width', tooltip.select('text').node().getBBox().width + 15)
					.attr('height', tooltip.select('text').node().getBBox().height + 10);

				tooltip.select('text')
					.attr('x', tooltip.select('rect').node().getBBox().width / 2)
					.attr('y', tooltip.select('rect').node().getBBox().height / 2);

				let xPos	= (width / 2) - (tooltip.node().getBBox().width / 2);
				let yPos	= y(o.name) - (tooltip.node().getBBox().height + 5);

				tooltip
					.attr('transform', 'translate(' + xPos + ',' + yPos + ')')
					.style('opacity', 1);
			}
		}
		function onMouseout() { tooltip.attr('transform', 'translate(' + -tooltip.node().getBBox().width + ',' + -tooltip.node().getBBox().height + ')').style('opacity', 0); }
	} else {
		canvas.append('text').attr('id', 'error').text(err_chart)
			.attr('text-anchor', 'middle').attr('alignment-baseline', 'middle')
			.attr('x', width / 2).attr('y', height / 2);
	}
}
