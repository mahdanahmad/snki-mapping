function refreshView() {
	let active	= $( base_target + ' > ul > li > input:checked' ).attr('value');
	if ($( sidewrap ).hasClass('expanded')) { refreshAnalytic(); }
	switch (active) {
		case layers[0][0]:
			defaultAmountFAP();
			break;
		case layers[0][1]:
			defaultAmountFAP();
			break;
		case layers[0][2]:
			defaultAmountFAP();
			break;
		case layers[0][3]:
			$( filter_target + ' > ul > li:not(.toggler)' ).each(function() {
				let input	= $( this ).find('input');

				let id		= 'g#' + prx_pref + _.snakeCase(input.attr('value')).replace('_minutes', '');
				let value	= input.prop('checked');

				d3.select(id).classed('hidden', !value);
			});
			break;
		default: console.log('unhandled refreshView');
	}

	if ($( point_id + ' > input' ).prop('checked')) { freeDrawPoint(); }
}

function refreshLayer() {
	toggleNetwork();

	d3.select('g.pin-wrapper').remove();
	d3.select('g#wrapped-proximity').classed('hidden', true);
	toggleSide(false);

	let active	= $( base_target + ' > ul > li > input:checked' ).attr('value');
	states.forEach((o) => colorMap([], o));
	d3.selectAll('g.network').classed('hidden', true);

	d3.select('div#filter-dropdown').classed('hidden', active == layers[0][3]);
	d3.select('g#wrapped-background').classed('reverse', active == layers[0][3]);

	switch (active) {
		case layers[0][0]:
			defaultAmountFAP();
			break;
		case layers[0][1]:
			defaultAmountFAP();
			break;
		case layers[0][2]:
			defaultAmountFAP();
			break;
		case layers[0][3]:
			d3.select('g#wrapped-proximity, g#wrapped-proximity > g').classed('hidden', false);
			if (curr_state > -1) { d3.selectAll(_.chain(coalesce).keys().slice(0, -1).map((o) => ('.' + o + '-wrapper path')).join(', ').value()).classed('unintended', true); }
			d3.selectAll('.' + (states[curr_state] || 'national') + '-wrapper path').classed('seethrough', true);
			createLegend(_.map(prx_color, (color, key) => ({ text: key.split('_').join(' - ') + ' minutes', color })), layers[lang][layers[0].indexOf(active)]);
			if (curr_state >= (states.length - 1)) { drawPoint(centered[_.last(states)]); }
			break;
		default: console.log('base unhandled');
	}

	if ($( point_id + ' > input' ).prop('checked')) { freeDrawPoint(); }
	initTabs();
}

function refreshAnalytic() {
	d3.select(chart_dest).selectAll('svg').remove();

	let activeLayer	= $( base_target + ' > ul > li > input:checked' ).attr('value');
	let activeTab	= $( tabs_id + ' > div.active' ).text();

	$( misc_ceil ).html(( curr_state == -1 ? 'National' : coalesce[states[curr_state]].name ));
	$( misc_floor ).html('');
	$( misc_adds ).html('');

	switch (true) {
		case activeLayer == layers[0][0] && activeTab == tab_heads[0][0][lang]:
			createRadar();
			break;
		case activeLayer == layers[0][0] && activeTab == tab_heads[0][1][lang]:
			createPie();
			break;
		case activeLayer == layers[0][0] && activeTab == tab_heads[0][2][lang]:
			createRadial();
			break;
		case activeLayer == layers[0][1] && activeTab == tab_heads[1][0][lang]:
			createBar();
			break;
		case activeLayer == layers[0][2] && activeTab == tab_heads[2][0][lang]:
			createBar();
			break;
		case activeLayer == layers[0][3] && activeTab == tab_heads[3][0][lang]:
			createTreemap();
			break;
		default:
			console.error('unhandled analytics');
	}
}

function defaultAmountFAP() {
	$(states.concat(['national']).map((o) => ('.' + o + '-wrapper path')).join(', ')).addClass('unintended');
	let active	= $( base_target + ' > ul > li > input:checked' ).attr('value');
	toggleLoading();
	getMapData((err, data) => {
		colorMap(data.data, states[curr_state + 1]);
		createLegend(data.legend, layers[lang][layers[0].indexOf(active)]);

		if ((active == layers[0][0]) && $( point_id + ' > input' ).prop('checked')) { d3.selectAll('.' + (states[curr_state] || 'national') + '-wrapper path').classed('seethrough', true); }

		setTimeout(() => toggleLoading(true), 750);
	});
}

function toggleLoading(state = false) { d3.select('#loading').classed('hidden', state); }
function isLoading(callback) { callback(!d3.select('#loading').classed('hidden')); }
