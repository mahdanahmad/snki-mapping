function refreshView() {
	let active	= $( base_target + ' > ul > li > input:checked' ).attr('value');
	switch (active) {
		case layers[0]:
			defaultAmountFAP();
			break;
		case layers[1]:
			defaultAmountFAP();
			break;
		default: console.log('unhandled refreshView');
	}

}

function refreshLayer() {
	toggleNetwork();
	changeFilterHead(() => {
		let active	= $( base_target + ' > ul > li > input:checked' ).attr('value');
		states.forEach((o) => colorMap([], o));
		d3.selectAll('g.network').classed('hidden', true);

		switch (active) {
			case layers[0]:
				defaultAmountFAP();
				if (curr_state == states.length - 1) { toggleNetwork(false); }
				break;
			case layers[1]:
				defaultAmountFAP();
				break;
			default: console.log('base unhandled');

		}
	});
}

function defaultAmountFAP() {
	let active	= $( base_target + ' > ul > li > input:checked' ).attr('value');
	if (curr_state < (states.length - 2) || active == layers[1]) {
		d3.select('g.pin-wrapper').remove();

		toggleLoading();
		getMapData((err, data) => {
			colorMap(data.data, states[curr_state + 1]);
			createLegend(data.legend, active);

			setTimeout(() => toggleLoading(true), 750);
		});
	} else {
		drawPoint(centered[_.last(states)]);
	}
}

function toggleLoading(state = false) { d3.select('#loading').classed('hidden', state); }
function isLoading(callback) { callback(!d3.select('#loading').classed('hidden')); }
