const sidewrap		= '#sidebar-wrapper';
const sidecont		= '#sidebar-content';

const net_target	= '#dropdown-network';
const net_toggle	= ['Select All', 'Unselect All'];

const text_id		= '#text-toggler';
const road_id		= '#road-toggler';
const point_id		= '#point-toggler';
const tabs_id		= '#sidebar-tabs';

function toggleSide(bool) {
	$( sidewrap ).toggleClass('expanded', bool);

	if ($( sidewrap ).hasClass('expanded')) { refreshAnalytic(); }
}

function createNetworkDrop() {
	$( net_target + ' > ul' ).html("<li class='toggler'>" + net_toggle[0] + "</li>" + _.map(net_map, (o, i) => (
		"<li id='net-" + i + "'>" +
			"<input type='checkbox' value='" + o + "'>" +
			"<label>" +
				"<svg width='18px' height='18px' viewBox='0 0 18 18' style='stroke:" + net_color[i] + ";'>" +
					"<path d='M1,9 L1,3.5 C1,2 2,1 3.5,1 L14.5,1 C16,1 17,2 17,3.5 L17,14.5 C17,16 16,17 14.5,17 L3.5,17 C2,17 1,16 1,14.5 L1,9 Z'></path>" +
					"<polyline points='1 9 7 14 15 4'></polyline>" +
				"</svg>" +
			"</label>" +
			"<span>" + o + "</span>" +
		"</li>"
	)).join(''));
	$( net_target + ' > ul > li' ).click(function(e) {
		let input	= $( this ).find('input')
		input.prop('checked', !input.prop('checked'));
		$( net_target + ' > ul > li.toggler' ).html(net_toggle[($( net_target + ' > ul > li > input:checked' ).length < $( net_target + ' > ul > li:not(.toggler)' ).length) ? 0 : 1]);

		d3.select('g.network#wrapped-' + input.attr('value')).classed('hidden', !input.prop('checked'));
	});
	$( net_target + ' > ul > li.toggler' ).click(function(e) {
		$( net_target + ' > ul > li > input' ).prop('checked', !net_toggle.indexOf($(this).html()));
		$(this).html(net_toggle[(net_toggle.indexOf($(this).html()) + 1) % 2]);
	});
}

function toggleNetwork(hidden=true) {
	d3.select('div#network-toggler').classed('hidden', hidden);
	if (hidden) {
		d3.selectAll('g.network').classed('hidden', true);
	} else {
		$( net_target + ' > ul > li > input' ).each(function() { d3.select('g.network#wrapped-' + $(this).attr('value')).classed('hidden', !$( this ).prop('checked')); })
	}
}

function toggleText() {
	let input 	= $( text_id + ' > input' );
	let value	= input.prop('checked');

	input.prop('checked', !value);
	d3.selectAll('g.wrapper text').classed('hidden', value);
	d3.select(text_id).classed('off', value);
}

function toggleRoad() {
	let input 	= $( road_id + ' > input' );
	let value	= input.prop('checked');

	input.prop('checked', !value);
	d3.selectAll('g#road-wrapper').classed('hidden', value);
	d3.select(road_id).classed('off', value);
}

const point_wrapper	= 'point-wrapper';
function togglePoint() {
	let input 	= $( point_id + ' > input' );
	let value	= !input.prop('checked');

	if (value) {
		freeDrawPoint();
		d3.selectAll('.' + (states[curr_state] || 'national') + '-wrapper path').classed('seethrough', true);
	} else {
		d3.select('g#' + point_wrapper).remove();
		d3.selectAll('g#maps-wrapper path').classed('seethrough', false);
		refreshLegend();
	}
	if ($( base_target + ' > ul > li > input:checked' ).attr('value') == layers[0][0]) { toggleNetwork(!value); }

	input.prop('checked', value);
	d3.select(point_id).classed('off', !value);
}


function toggleInset(show=false) {
	d3.select('g#' + inset_id).classed('hidden', show);
	d3.select(inset_toggle).classed('hidden', !show);
}

function initTabs() {
	let active	= $( base_target + ' > ul > li > input:checked' ).attr('value');

	$( sidecont + ' > ' + tabs_id ).html(tab_heads[layers[0].indexOf(active)].map((o, i) => (
		"<div class='tab cursor-pointer" + (!i ? ' active' : '') + "'>" +
			"<div class='tab-box'></div>" +
			"<div class='tab-text'>" + o[lang] + "</div>" +
		"</div>"
	)).join(''));

	$( sidecont + ' > ' + tabs_id + ' > div' ).click(function(e) {
		let active	= $( tabs_id + ' > div.active' );
		let target	= $( this ).find('.tab-text').text();

		if (active.find('.tab-text').text() !== target) {
			active.removeClass('active');
			$( this ).addClass('active');
			refreshAnalytic();
		}
	})
}
