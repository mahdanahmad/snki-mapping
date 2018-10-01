const defHeight		= 15;
const textPad		= 5;

function createBar() {
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

	getPopulation((err, result) => {
		if (!_.isEmpty(result.data)) {
			let total		= result.data.length;
			let chart_hgt	= (total * defHeight < height) ? total * defHeight : height;

			let x			= d3.scaleLinear().range([0, width]).domain([0, d3.max(result.data, (o) => (o.capita))]);
			let y			= d3.scaleBand().range([chart_hgt, 0]).padding(0.1).domain(result.data.map((o) => (o.name)));

			let grouped		= canvas.selectAll('.bar')
				.data(result.data).enter().append('g').attr('class', (o) => (o.capita ? '' : 'hidden'));

			grouped.append('rect')
				.attr('id', (o) => (_.snakeCase(o.name)))
				.attr('class', 'bar')
				// .attr('width', (o) => (x(o.capita)))
				.attr('width', 0)
				.attr('y', (o) => (y(o.name)))
				.attr('height', y.bandwidth());

			grouped.append('text')
				// .attr('width', (o) => (x(o.capita)))
				.attr('x', 0)
				.attr('y', (o) => (y(o.name) + (y.bandwidth() / 2) + 1))
				// .attr('text-anchor', 'middle')
				.attr('alignment-baseline', 'middle')
				.attr('class', (o) => ('cursor-default capita' + (o.capita ? ' moved' : '')))
				.text((o) => (o.capita ? o.capita : ''));

			grouped.on('mouseover', function(o) {
				if (o.capita) {
					tooltip.select('text').text(nFormatter(o.ap_count) + ' poin untuk ' + nFormatter(o.potential_population) + ' penduduk')

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
				} else {
					tooltip.attr('transform', 'translate(' + -tooltip.node().getBBox().width + ',' + -tooltip.node().getBBox().height + ')').style('opacity', 0);
				}
			})
			grouped.on('mouseout', function() { tooltip.attr('transform', 'translate(' + -tooltip.node().getBBox().width + ',' + -tooltip.node().getBBox().height + ')').style('opacity', 0); });

			let transition	= d3.transition()
		        .duration(duration)
		        .ease(d3.easeLinear);

			grouped.selectAll('.bar').transition(transition).attr('width', (o) => (x(o.capita) || 0));
			grouped.selectAll('text.moved').transition(transition).attr('x', function(o) {
				let textwidth	= d3.select(this).node().getBBox().width + textPad;
				let boxWidth	= (x(o.capita) || 0);
				d3.select(this).classed('outside', textwidth > boxWidth);
				return textwidth > boxWidth ? boxWidth + textPad : boxWidth - textwidth;
			});

			canvas.append('g').call(d3.axisLeft(y).tickSize(0));

			tooltip	= canvas.append('g').attr('id', 'tooltip-wrapper').style('opacity', 0);

			tooltip.append('rect').attr('x', 0).attr('y', 0).attr('rx', 5).attr('ry', 5);
			tooltip.append('text').attr('text-anchor', 'middle').attr('alignment-baseline', 'middle');

			d3.select(misc_floor).text('Total Access Point: ' + (result.details.total || 'N/A'));
			d3.select(misc_adds).text('Total Potential Population: ' + (result.details.potential_population ? addCommas(result.details.potential_population) : 'N/A'));
		} else {
			canvas.append('text').attr('id', 'error').text(err_chart)
				.attr('text-anchor', 'middle').attr('alignment-baseline', 'middle')
				.attr('x', width / 2).attr('y', height / 2);
		}
	});
}
