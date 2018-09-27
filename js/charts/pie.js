const pie_colors	= ['#ca3100', '#3a99ba'];

function createPie() {
	let canvasWidth		= $(chart_dest).width();
	let canvasHeight	= $(chart_dest).height();

	let margin 			= { top: 0, right: 0, bottom: 0, left: 0 };
	let width			= canvasWidth - margin.right - margin.left;
	let height			= canvasHeight - margin.top - margin.bottom;
	let size			= Math.min(width, height);
	let radius			= size / 2;

	let canvas 			= d3.select(chart_dest).append('svg')
		.attr('id', pie_id)
		.attr('width', canvasWidth)
		.attr('height', canvasHeight)
		.append('g')
			.attr('id', 'canvas')

	let color	= d3.scaleOrdinal(pie_colors);

	let pie		= d3.pie()
		.sort(null)
		.value((o) => (o.sum));

	let path = d3.arc()
		.outerRadius(radius - 10)
		.innerRadius(0);

	let label = d3.arc()
		.outerRadius(radius - 40)
		.innerRadius(radius - 40);

	getDistribution((err, result) => {
		if (!_.isEmpty(result)) {
			result	= _.sortBy(result, '_id');
			let arc = canvas.selectAll(".arc").data(pie(result)).enter().append("g").attr("class", "arc");

			let total	= _.sumBy(result, 'sum');

			arc.append("path")
				.attr("d", path)
				.attr("fill", (o) => (color(o.data._id)) );

			arc.append("text")
				.attr("transform", (o) => ("translate(" + label.centroid(o) + ")"))
				.attr("dy", "0.35em")
				.attr('text-anchor', 'middle')
				.attr('alignment-baseline', 'middle')
				.text((o) => (o.data._id + ' ' + _.round(o.data.sum / total * 100, 1) + '%'));

			canvas.attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')');
		} else {
			canvas.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
			canvas.append('text').attr('id', 'error').text(err_chart)
				.attr('text-anchor', 'middle').attr('alignment-baseline', 'middle')
				.attr('x', width / 2).attr('y', height / 2);
		}
	}, 'group');

}
