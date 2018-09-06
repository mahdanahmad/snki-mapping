function refreshView() {
	if (curr_state < (states.length - 1)) {
		getMapData((err, data) => {
			colorMap(data.data, states[curr_state + 1]);
			createLegend(data.legend, 'Amount of FAP');
		});
	} else {
		drawPoint(centered[_.last(states)]);
	}
}
