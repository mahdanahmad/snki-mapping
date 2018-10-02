function createTreemap() {
	let canvasWidth		= $(chart_dest).width();
	let canvasHeight	= $(chart_dest).height();

	let margin 			= { top: 25, right: 15, bottom: 25, left: 15 };
	let width			= canvasWidth - margin.right - margin.left;
	let height			= canvasHeight - margin.top - margin.bottom;

	let size			= Math.min(width, height);

	let treemap			= d3.treemap().size([size, size]);

	let canvas 			= d3.select(chart_dest).append('svg')
		.attr('id', tree_id)
		.attr('width', canvasWidth)
		.attr('height', canvasHeight)
		.append('g')
			.attr('id', 'canvas')

	getProximity((err, data) => {
		if (!_.isEmpty(data.children)) {
			let root	= d3.hierarchy(data, (d) => d.children).sum((d) => d.size);
			let tree	= treemap(root);

			canvas.datum(root).selectAll(".node")
				.data(tree.leaves()).enter().append("rect")
					.attr("class", "node")
					.attr("x", (d) => d.x0)
					.attr("y", (d) => d.y0)
					.attr("width", (d) => Math.max(0, d.x1 - d.x0 - 1))
					.attr("height", (d) => Math.max(0, d.y1 - d.y0  - 1))
					.attr("fill", (d) => (prx_color[d.data.key]));

			let legend	= canvas.append('g').attr('id', 'legend-wrap').attr('transform', 'translate(0, ' + (size + 20) + ')').selectAll('.legend')
				.data(data.children).enter().append('g').attr('id', (o) => ('legend_' + o.key)).attr('class', 'legend cursor-default');

			legend.append('rect')
				.attr('x', 0)
				.attr('y', 0)
				.attr('width', 15)
				.attr('height', 15)
				.attr('fill', (o) => (prx_color[o.key]));

			legend.append('text')
				.attr('text-anchor', 'start')
				.attr('alignment-baseline', 'middle')
				.attr('transform', 'translate(' + 20 + ',' + 9 + ')')
				.text((o) => (o.name + ' (' + o.size + '%)'));

			let lgnd_width	= 0;
			let lgnd_height	= 0;
			let sum_width	= 0;
			let min_pads	= 10;
			legend.each(function() {
				let curr_width	= d3.select(this).node().getBBox().width;
				sum_width += curr_width;
				if (curr_width > lgnd_width) { lgnd_width = curr_width; }
				if (!lgnd_height) { lgnd_height = d3.select(this).node().getBBox().height; }
			});
			let needed_pads	= legend.size() - 1;
			if (sum_width + needed_pads * min_pads < width) {
				let pad	= (width - sum_width) / needed_pads;

				let iterated_width	= 0;
				legend.each(function() {
					d3.select(this).attr('transform', 'translate(' + iterated_width + ',0)');
					iterated_width += d3.select(this).node().getBBox().width + pad;
				})
			} else {
				let rows	= 2 * Math.floor((width / lgnd_width) / 2);

				let fulfilled	= width / rows;
				legend.each(function(o, i) {
					d3.select(this).attr('transform', 'translate(' + ((i % rows) * fulfilled) + ',' + (Math.floor(i / rows) * (lgnd_height + 10)) + ')');
				});
			}

			let bbox	= canvas.node().getBBox();
			canvas.attr('transform', 'translate(' + (margin.left + (width - bbox.width) / 2) + ',' + (margin.top + (height - bbox.height) / 2) + ')');
		} else {
			canvas.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
			canvas.append('text').attr('id', 'error').text(err_chart)
				.attr('text-anchor', 'middle').attr('alignment-baseline', 'middle')
				.attr('x', width / 2).attr('y', height / 2);
		}
	});
}
