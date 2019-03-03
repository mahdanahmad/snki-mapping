const PI	= Math.PI;

const arcMinRadius	= 10;
const arcPadding	= 10;
const labelPadding	= -5;

function createRadial() {
	let canvasWidth		= $(chart_dest).width();
	let canvasHeight	= $(chart_dest).height();

	let margin 			= { top: 0, right: 0, bottom: 0, left: 0 };
	let width			= canvasWidth - margin.right - margin.left;
	let height			= canvasHeight - margin.top - margin.bottom;
	let size			= Math.min(width, height);

	let chartRadius		= size / 2 - 40;

	let canvas 			= d3.select(chart_dest).append('svg')
		.attr('id', radial_id)
		.attr('width', canvasWidth)
		.attr('height', canvasHeight)
		.append('g')
			.attr('id', 'canvas');

	let tooltip;

	getNetwork((err, result) => {
		if (!_.isEmpty(result.data)) {
			let scale	= d3.scaleLinear().domain([0, result.total]).range([0, 2 * PI]);

			let ticks	= scale.ticks(10).slice(0, -1);
			let keys	= result.data.map((d, i) => d.name);

			const numArcs	= keys.length + 1;
			const arcWidth	= (chartRadius - arcMinRadius - numArcs * arcPadding) / numArcs;

			let arc = d3.arc()
				.innerRadius((d, i) => getInnerRadius(i))
				.outerRadius((d, i) => getOuterRadius(i))
				.startAngle(0)
				.endAngle((d, i) => scale(d));

			let axialAxis	= canvas.append('g')
				.attr('class', 'a axis')
				.selectAll('g').data(ticks).enter().append('g')
					.attr('transform', d => 'rotate(' + (rad2deg(scale(d)) - 90) + ')');

			axialAxis.append('line').attr('x2', chartRadius);

			axialAxis.append('text')
				.attr('x', chartRadius + 10)
				.style('text-anchor', d => (scale(d) >= PI && scale(d) < 2 * PI ? 'end' : null))
				.attr('transform', d => 'rotate(' + (90 - rad2deg(scale(d))) + ',' + (chartRadius + 10) + ',0)')
				.text(d => d);

			let invertedMap	= _.invert(net_map);
			let arcs = canvas.append('g')
				.attr('class', 'data')
				.selectAll('path').data(result.data).enter().append('path')
					.attr('class', 'arc')
					.style('fill', (d, i) => net_color[invertedMap[d.id]])

			arcs.transition()
				.delay((d, i) => i * 200)
				.duration(1000)
				.attrTween('d', arcTween);

			arcs.on('mousemove', function(o) {
				tooltip.select('text').text(o.size + ' / ' + result.total + ' (' + _.round(o.size / result.total * 100, 2) + '%)');

				tooltip.select('rect')
					.attr('width', tooltip.select('text').node().getBBox().width + 15)
					.attr('height', tooltip.select('text').node().getBBox().height + 10);

				tooltip.select('text')
					.attr('x', tooltip.select('rect').node().getBBox().width / 2)
					.attr('y', tooltip.select('rect').node().getBBox().height / 2);

				let current	= d3.mouse(this);
				let xPos	= current[0] - (tooltip.node().getBBox().width / 2);
				let yPos	= current[1] - (tooltip.node().getBBox().height + 5);

				tooltip
					.attr('transform', 'translate(' + xPos + ',' + yPos + ')')
					.style('opacity', 1);
			});
			arcs.on('mouseout', () => { tooltip.style('opacity', 0).attr('transform', 'translate(' + -width + ',' + -height + ')'); })

			let radialAxis	= canvas.append('g')
				.attr('class', 'r axis')
				.selectAll('g').data(result.data).enter().append('g');

			radialAxis.append('circle')
				.attr('r', (d, i) => getOuterRadius(i) + arcPadding);

			radialAxis.append('text')
				.attr('x', labelPadding)
				.attr('y', (d, i) => -getOuterRadius(i) + arcPadding)
				.attr('text-anchor', 'end')
				.text(d => d.id);

			canvas.attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');

			d3.select(misc_floor).text(lang_lists.access[lang] + ': ' + result.total);

			tooltip	= canvas.append('g').attr('id', 'tooltip-wrapper').style('opacity', 0);

			tooltip.append('rect').attr('x', 0).attr('y', 0).attr('rx', 5).attr('ry', 5);
			tooltip.append('text').attr('text-anchor', 'middle').attr('alignment-baseline', 'middle');

			function arcTween(d, i) {
				let interpolate = d3.interpolate(0, d.size);
				return t => arc(interpolate(t), i);
			}
			function rad2deg(angle) { return angle * 180 / PI; }
			function getInnerRadius(index) { return arcMinRadius + (numArcs - (index + 1)) * (arcWidth + arcPadding); }
			function getOuterRadius(index) { return getInnerRadius(index) + arcWidth; }
		} else {
			canvas.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
			canvas.append('text').attr('id', 'error').text(err_chart)
				.attr('text-anchor', 'middle').attr('alignment-baseline', 'middle')
				.attr('x', width / 2).attr('y', height / 2);
		}
	});
}
