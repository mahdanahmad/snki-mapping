function refreshView() {
	if (curr_state < (states.length - 1)) {
		toggleLoading();
		getMapData((err, data) => {
			colorMap(data.data, states[curr_state + 1]);
			createLegend(data.legend, 'Amount of FAP');

			setTimeout(() => toggleLoading(true), 750);
		});
	} else {
		drawPoint(centered[_.last(states)]);
	}

}

function toggleLoading(state = false) { d3.select('#loading').classed('hidden', state); }
