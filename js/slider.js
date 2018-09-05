String.prototype.parseTransform	= function() { return this.substr(this.indexOf('(') + 1).replace(')', '').split(',').map((o) => (parseInt(o))); }

function moveSlider() {
	let wrapper		= d3.select("svg#" + map_id + '> g#slider-wrapper');
	let container	= wrapper.select('g#slider-container');

	let count		= container.selectAll('circle').size();
	if ((curr_state + 1) >= count && count < states.length + 1) {
		let start_point	= (curr_state + 1) * (base_crcl * 2) + (curr_state) * pad_crcl + (curr_state * (curr_state + 1) * incr_crcl) - (base_crcl)

		let added_pad	= d3.path();
		added_pad.rect(start_point, -1, pad_crcl, 2);
		container.append('path')
			.attr('d', added_pad.toString())
			.attr('class', states[curr_state]);

		let next_rad	= base_crcl + (curr_state + 1) * incr_crcl;
		container.append('circle')
			.attr('r', next_rad)
			.attr('cx', start_point + pad_crcl + next_rad)
			.attr('class', states[curr_state] + ' cursor-pointer')
			.on('mouseover', onSliderHover)
			.on('mouseout', onSliderOut)
			.on('click', onSliderClick);

	} else if ((curr_state + 1) < count) {
		container.selectAll(states.slice(curr_state + 1).map((o) => ('.' + o)).join(', ')).remove();
	}

	container.transition().duration(duration)
		.attr('transform', 'translate(-' + container.node().getBBox().width / 2 + ', 0)')
}

function onSliderHover() {
	let radius		= parseInt(d3.select(this).attr('r'));
	let circle		= [parseInt(d3.select(this).attr('cx') || 0), parseInt(d3.select(this).attr('cy') || 0)];
	let container	= d3.select(this.parentNode).attr('transform').parseTransform();
	let wrapper		= d3.select(this.parentNode.parentNode).attr('transform').parseTransform();

	let classed		= d3.select(this).attr('class').split(' ')[0];
	tooltip.text((curr_state == -1 && classed == 'national') || classed == states[curr_state] ? coalesce[classed].name + ' (current)' : 'Back to ' + coalesce[classed].name);
	tooltip.classed('hidden', false);

	let bounds		= tooltip.node().getBoundingClientRect();
	let posX		= wrapper[0] + container[0] + circle[0] - bounds.width / 2 - radius / 15;
	let posY		= wrapper[1] + container[1] + circle[1] - bounds.height - 25;

	tooltip.style('top', posY + 'px').style('left', posX + 'px');
}

function onSliderOut() {
	tooltip.classed('hidden', true);
}

function onSliderClick() {
	let classed		= d3.select(this).attr('class').split(' ')[0];
	if (!(curr_state == -1 && classed == 'national') && classed !== states[curr_state]) {
		curr_state	= states.indexOf(classed);
		moveSlider();

		d3.select("svg#" + map_id + '> g#canvas')
			.transition()
			.duration(duration)
			.attr('transform', coalesce[classed].transform);

		d3.selectAll('svg#' + map_id + ' g#canvas path').transition()
			.duration(duration)
			.style('stroke-width', (base_stroke - ((curr_state + 1) * .1)) + 'px');

		d3.selectAll('svg#' + map_id + ' g#canvas text').transition()
			.duration(duration)
			.style('font-size', (base_font / coalesce[classed].scale) + 'px');

		moveRuler(coalesce[classed].distance);
		if (curr_state < (states.length - 2)) { d3.select("svg#" + map_id + '> g#canvas').selectAll(states.slice(curr_state + 2).map((o) => ('g.' + o + '-wrapper')).join(', ')).remove(); }
		d3.select("svg#" + map_id + '> g#canvas').select('g#' + states[curr_state + 1] + '-' + centered[states[curr_state + 1]]).classed('hidden', false);
		d3.select("svg#" + map_id + '> g#canvas').select('g.pin-wrapper').remove();
		d3.selectAll(states.slice(curr_state + 1).map((o) => ('.' + o + '-wrapper path')).join(', ')).classed('unintended', false);

		centered = _.omit(centered, states.slice(curr_state + 1));
		coalesce = _.omit(coalesce, states.slice(curr_state + 1));

		refreshLegend();
	}
}
