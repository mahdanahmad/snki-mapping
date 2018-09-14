function refreshView() {
	let active	= $( base_target + ' > ul > li > input:checked' ).attr('value');
	switch (active) {
		case layers[0]:
			defaultAmountFAP();
			break;
		case layers[1]:
			$( filter_target + ' > ul > li > input' ).each(function() { d3.select('g.network#wrapped-' + $(this).attr('value')).classed('hidden', !$( this ).prop('checked')); })
			break;
		default: console.log('unhandled refreshView');
	}

}

function refreshLayer() {
	changeFilterHead(() => {
		let active	= $( base_target + ' > ul > li > input:checked' ).attr('value');
		states.forEach((o) => colorMap([], o));
		d3.selectAll('g.network').classed('hidden', true);

		switch (active) {
			case layers[0]:
				defaultAmountFAP();
				break;
			case layers[1]:
				d3.selectAll('g.network').classed('hidden', false);
				createLegend(_.map(net_color, (o, key) => ({ text: net_map[key], color: o })), active);
				break;
			default: console.log('base unhandled');

		}
	});
}

function defaultAmountFAP() {
	toggleLoading();
	if (curr_state < (states.length - 1)) {
		getMapData((err, data) => {
			colorMap(data.data, states[curr_state + 1]);
			createLegend(data.legend, layers[0]);

			setTimeout(() => toggleLoading(true), 750);
		});
	} else {
		drawPoint(centered[_.last(states)]);
	}
}

function toggleLoading(state = false) { d3.select('#loading').classed('hidden', state); }
function isLoading(callback) { callback(!d3.select('#loading').classed('hidden')); }
