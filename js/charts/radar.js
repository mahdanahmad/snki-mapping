const radar_lvl	= 5;
const radians	= 2 * Math.PI;

function createRadar() {
	let canvasWidth		= $(chart_dest).width();
	let canvasHeight	= $(chart_dest).height();

	let margin 			= { top: 25, right: 25, bottom: 25, left: 25 };
	let width			= canvasWidth - margin.right - margin.left;
	let height			= canvasHeight - margin.top - margin.bottom;
	let size			= Math.min(width, height);

	let canvas 			= d3.select(chart_dest).append('svg')
		.attr('id', radar_id)
		.attr('width', canvasWidth)
		.attr('height', canvasHeight)
		.append('g')
			.attr('id', 'canvas');

	let tooltip;

	getDistribution((err, result) => {
		if (!_.isEmpty(result)) {
			let maxValue	= _.chain(result).maxBy('sum').get('sum', 0).value();
			maxValue		= _.ceil(maxValue, -(maxValue.toString().length - 2));
			if (maxValue < 10) { maxValue = 10; } else if (maxValue < 100) { maxValue = 100; }
			let allAxis		= _.map(result, '_id');
			let total		= allAxis.length;
			let radius		= size / 2;

			//Circular segments
			let lines		= canvas.append('g').attr('id', 'line-wrapper');
			for (var m = 1; m < radar_lvl; m++) {
				let levelFactor	= radius * (m / radar_lvl);
				lines.selectAll('.levels').data(allAxis).enter().append('line')
				.attr('x1', (o, i) => (levelFactor * (1 - Math.sin(i * radians / total))))
				.attr('y1', (o, i) => (levelFactor * (1 - Math.cos(i * radians / total))))
				.attr('x2', (o, i) => (levelFactor * (1 - Math.sin((i+1) * radians / total))))
				.attr('y2', (o, i) => (levelFactor * (1 - Math.cos((i+1) * radians / total))))
				.attr('class', 'line')
				.attr('transform', 'translate(' + (size / 2 - levelFactor) + ', ' + (size / 2 - levelFactor) + ')');
			}

			//Text indicators
			canvas.append('g').attr('id', 'level-wrapper')
			.selectAll('text').data(_.chain(0).range(maxValue, maxValue / radar_lvl).map((o) => (o + (maxValue / radar_lvl))).value()).enter().append('text')
			.attr('x', (o, i) => ( radius * ((i + 1) / radar_lvl) * (1 * Math.cos(0)) + 5 ))
			.attr('y', (o, i) => ( radius * ((i + 1) / radar_lvl) * (1 * Math.sin(0)) - 5 ))
			.attr('class', 'cursor-default')
			.attr('text-anchor', 'start')
			.attr('alignment-baseline', 'baseline')
			.attr('transform', (o, i) => ('translate(' + (size / 2 - (radius * ((i + 1) / radar_lvl)) ) + ', ' + (size / 2 - (radius * ((i + 1) / radar_lvl))) + ')'))
			.text((o) => (o))

			let axis	= canvas.append('g').attr('id', 'axis-wrapper')
			.selectAll('.axis').data(allAxis).enter().append('g')
			.attr('class', 'axis cursor-default');

			axis.append('line')
			.attr('x1', size / 2)
			.attr('y1', size / 2)
			.attr('x2', (o, i) => (size / 2 * (1 - Math.sin(i * radians / total))))
			.attr('y2', (o, i) => (size / 2 * (1 - Math.cos(i * radians / total))));

			axis.append('text')
			.attr('text-anchor', 'middle')
			.attr('alignment-baseline', 'baseline')
			.attr('dy', '1.5em')
			.attr('transform', 'translate(0, -10)')
			.attr('x', (o, i) => (size / 2 * (1 - .65 * Math.sin(i * radians / total)) - 60 * Math.sin(i * radians / total)))
			.attr('y', (o, i) => (size / 2 * (1 - Math.cos( i * radians / total)) - 20 * Math.cos(i * radians / total)))
			.text((o) => (o))

			canvas.append('g').attr('id', 'circle-wrapper')
			.selectAll('circle').data(result).enter().append('circle')
			.attr('r', 4)
			.attr('class', 'cursor-pointer')
			.attr('data-id', (o) => (o._id))
			.attr('cx', (o) => (size / 2 * (1 - (o.sum / maxValue) * Math.sin(allAxis.indexOf(o._id) * radians / total))))
			.attr('cy', (o) => (size / 2 * (1 - (o.sum / maxValue) * Math.cos(allAxis.indexOf(o._id) * radians / total))))
			.on('mouseover', function(o) {
				tooltip.select('text')
				.text(o.sum);

				tooltip.select('rect')
				.attr('width', tooltip.select('text').node().getBBox().width + 15)
				.attr('height', tooltip.select('text').node().getBBox().height + 10);

				tooltip.select('text')
				.attr('x', tooltip.select('rect').node().getBBox().width / 2)
				.attr('y', tooltip.select('rect').node().getBBox().height / 2);

				tooltip
				.attr('transform', 'translate(' + (parseFloat(d3.select(this).attr('cx')) - (tooltip.node().getBBox().width / 2)) + ',' + (parseFloat(d3.select(this).attr('cy')) - (tooltip.node().getBBox().height + 10)) + ')')
				.transition(200)
				.style('opacity', 1);
			})
			.on('mouseout', function() {
				tooltip
				.transition(200)
				.style('opacity', 0);
			})

			tooltip	= canvas.append('g').attr('id', 'tooltip-wrapper').style('opacity', 0);

			tooltip.append('rect').attr('x', 0).attr('y', 0).attr('rx', 5).attr('ry', 5);
			tooltip.append('text').attr('text-anchor', 'middle').attr('alignment-baseline', 'middle');

			let bbox	= canvas.node().getBBox();
			canvas.attr('transform', 'translate(' + margin.left + ',' + (margin.top + (height > bbox.height ? ((height - bbox.height) / 2) : 0)) + ')');
			console.log(bbox);
		} else {
			canvas.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
			canvas.append('text').attr('id', 'error').text(err_chart)
				.attr('text-anchor', 'middle').attr('alignment-baseline', 'middle')
				.attr('x', width / 2).attr('y', height / 2);
		}
	}, 'types');

}
