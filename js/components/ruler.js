function moveRuler(distance) {
	let svg		= d3.select("svg#" + map_id + '> g#canvas');
	let ruler	= d3.select("svg#" + map_id + '> g#ruler');

	let inStr	= Math.round(distance / 10).toString();
	let length	= inStr.length - 1;
	let rounded	= Math.round(parseInt(inStr) / Math.pow(10, length)) * Math.pow(10, length);

	let width	= rounded / distance * svg.node().getBBox().width;

	_.set(coalesce, ((curr_state + 1) ? states[curr_state] : 'national') + '.distance', distance);

	ruler.select('text')
		.transition().duration(duration)
		.attr('transform', 'translate(-' + (width + 5) + ',0)')
		.text(rounded >= 1000 ? (rounded / 1000) + ' km' : rounded + ' m');

	ruler.select('path#left-vertical')
		.transition().duration(duration)
		.attr('transform', 'translate(-' + width + ',0)');

	let horipath	= d3.path();
	horipath.moveTo(0,0);
	horipath.lineTo(-width, 0);

	ruler.select('path#horizontal')
		.transition().duration(duration)
		.attr('d', horipath.toString())
}
