function refreshView() {
	let active	= $( base_target + ' > ul > li > input:checked' ).attr('value');
	if ($( sidewrap ).hasClass('expanded')) { refreshAnalytic(); }
	switch (active) {
		case layers[0]:
			defaultAmountFAP();
			break;
		case layers[1]:
			defaultAmountFAP();
			break;
		case layers[2]:
			defaultAmountFAP();
			break;
		case layers[3]:
			$( filter_target + ' > ul > li:not(.toggler)' ).each(function() {
				let input	= $( this ).find('input');

				let id		= 'g#' + prx_pref + _.snakeCase(input.attr('value')).replace('_minutes', '');
				let value	= input.prop('checked');

				d3.select(id).classed('hidden', !value);
			});
			break;
		default: console.log('unhandled refreshView');
	}

}

function refreshLayer() {
	toggleNetwork();

	d3.select('g.pin-wrapper').remove();
	d3.select('g#wrapped-proximity').classed('hidden', true);
	toggleSide(false);

	changeFilterHead(() => {
		let active	= $( base_target + ' > ul > li > input:checked' ).attr('value');
		states.forEach((o) => colorMap([], o));
		d3.selectAll('g.network').classed('hidden', true);

		d3.select('div#filter-dropdown').classed('hidden', active == layers[3]);
		d3.select('g#wrapped-background').classed('reverse', active == layers[3]);

		switch (active) {
			case layers[0]:
				defaultAmountFAP();
				if (curr_state == states.length - 1) { toggleNetwork(false); }
				break;
			case layers[1]:
				defaultAmountFAP();
				break;
			case layers[2]:
				defaultAmountFAP();
				break;
			case layers[3]:
				d3.select('g#wrapped-proximity, g#wrapped-proximity > g').classed('hidden', false);
				d3.selectAll('g.wrapper path').classed('seethrough', true);
				createLegend(_.map(prx_color, (color, key) => ({ text: key.split('_').join(' - ') + ' minutes', color })), active);
				if (curr_state >= (states.length - 1)) { drawPoint(centered[_.last(states)]); }
				break;
			default: console.log('base unhandled');
		}

		initTabs();
	});
}

function refreshAnalytic() {
	d3.select(chart_dest).selectAll('svg').remove();

	let activeLayer	= $( base_target + ' > ul > li > input:checked' ).attr('value');
	let activeTab	= $( tabs_id + ' > div.active' ).text();

	$( misc_ceil ).html(( curr_state == -1 ? 'National' : coalesce[states[curr_state]].name ));
	$( misc_floor ).html('');
	$( misc_adds ).html('');

	switch (true) {
		case activeLayer == layers[0] && activeTab == tab_heads[0][0]:
			createRadar();
			break;
		case activeLayer == layers[0] && activeTab == tab_heads[0][1]:
			createPie();
			break;
		case activeLayer == layers[0] && activeTab == tab_heads[0][2]:
			createRadial();
			break;
		case activeLayer == layers[1] && activeTab == tab_heads[1][0]:
			createBar();
			break;
		case activeLayer == layers[2] && activeTab == tab_heads[2][0]:
			createBar();
			break;
		case activeLayer == layers[3] && activeTab == tab_heads[3][0]:
			createTreemap();
			break;
		default:
			console.error('unhandled analytics');
	}
}

function defaultAmountFAP() {
	$(states.concat(['national']).map((o) => ('.' + o + '-wrapper path')).join(', ')).addClass('unintended');
	let active	= $( base_target + ' > ul > li > input:checked' ).attr('value');
	if (curr_state < (states.length - 1) || _.includes([3], layers.indexOf(active))) {
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
