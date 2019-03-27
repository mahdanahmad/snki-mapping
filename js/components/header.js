const state_head	= ['Provinsi', 'Kabupaten', 'Kecamatan'];
const title_target	= '#region-dropdown > div > span#title-target';

const region_target	= '#dropdown-region';
const base_target	= '#dropdown-base';
const filter_target	= '#dropdown-filter';

let filter_time;
const awaitTime		= 750;

const filt_toggle	= ['Select All', 'Unselect All'];

function changeRegionHead() {
	if (state_head[curr_state + 1]) {
		d3.select(title_target).text(state_head[curr_state + 1]);
		getLocation((err, data) => {
			$( region_target + ' > ul' ).html(data.map((o) => ("<li id='region-" + o.id + "' value='" + o.id + "'>" + o.name + "</li>")).join(''));
			$( region_target + ' > ul > li' ).click(function(e) {
				$( region_target ).jqDropdown('hide');

				zoom($( this ).val(), states[curr_state + (curr_state < state_head.length - 1 ? 1 : 0)]);
			});
		});
	}
}

function createFilterHead() {
	getTypes((err, data) => {
		$( filter_target + ' > ul' ).html("<li class='toggler'>" + filt_toggle[1] + "</li>" + _.chain(data).groupBy('group').flatMap((val, key) => (_.concat([{ type: key, group: 'group' }], val))).map((o, i) => (
			"<li id='filter-" + _.camelCase(o.type) + "' class='" + o.group + "'>" +
				// "<input type='checkbox' value='" + o.type + "' checked>" +
				"<input type='checkbox' value='" + o.type + "'>" +
				"<label>" +
					"<svg width='18px' height='18px' viewBox='0 0 18 18'>" +
						"<path d='M1,9 L1,3.5 C1,2 2,1 3.5,1 L14.5,1 C16,1 17,2 17,3.5 L17,14.5 C17,16 16,17 14.5,17 L3.5,17 C2,17 1,16 1,14.5 L1,9 Z'></path>" +
						"<polyline points='1 9 7 14 15 4'></polyline>" +
					"</svg>" +
				"</label>" +
				(o.lang ? o.lang.map((d, l) => ("<span class=\"langs lang-" + l + " " + (l ? 'hidden' : '') + "\">" + d + "</span>")).join('') : "<span>" + o.type + "</span>" ) +
			"</li>"
		)).join('').value());
		$( filter_target + ' > ul > li:not(.toggler):not(.group)' ).click(function(e) {
			let target_li	= filter_target + ' > ul > li';
			let classmate	= target_li + '.' + $(this).attr('class');
			$( this ).find('input').prop('checked', !$( this ).find('input').prop('checked'));

			clearTimeout(filter_time);
			filter_time	= setTimeout(() => { refreshView(); }, awaitTime);

			$(target_li + '.toggler').html(filt_toggle[($( target_li + ' > input:checked' ).length < $( target_li + ':not(.toggler)' ).length) ? 0 : 1]);
			$(target_li + '#filter-' + _.camelCase($(this).attr('class') )+ ' > input').prop('checked', ($( classmate ).length == $( classmate + ' > input:checked' ).length));
		});
		$( filter_target + ' > ul > li.group' ).click(function(e) {
			let input	= $( this ).find('input');
			let value	= !input.prop('checked')
			$( this ).find('input').prop('checked', value);

			$( filter_target + ' > ul > li.' + input.attr('value') + ' > input' ).prop('checked', value);

			clearTimeout(filter_time);
			filter_time	= setTimeout(() => { refreshView(); }, awaitTime);

			$(filter_target + ' > ul > li.toggler').html(filt_toggle[($( filter_target + ' > ul > li > input:checked' ).length < $( filter_target + ' > ul > li:not(.toggler)' ).length) ? 0 : 1]);
		});
		$( filter_target + ' > ul > li.toggler' ).click(function(e) {
			$( filter_target + ' > ul > li > input' ).prop('checked', !filt_toggle.indexOf($(this).html()));
			$(this).html(filt_toggle[(filt_toggle.indexOf($(this).html()) + 1) % 2])
			refreshView();
		});
	});
}

function createBaseHead() {
	$( base_target + ' > ul' ).html(_.zip(...layers).map((o, i) => (
		"<li id='base-" + i + "'>" +
			"<input type='checkbox' value='" + o[0] + "' " + (i == 0 ? 'checked' : '') + ">" +
			"<label>" +
				"<svg width='18px' height='18px' viewBox='0 0 18 18'>" +
					"<path d='M1,9 L1,3.5 C1,2 2,1 3.5,1 L14.5,1 C16,1 17,2 17,3.5 L17,14.5 C17,16 16,17 14.5,17 L3.5,17 C2,17 1,16 1,14.5 L1,9 Z'></path>" +
					"<polyline points='1 9 7 14 15 4'></polyline>" +
				"</svg>" +
			"</label>" +
			o.map((d, l) => ("<span class=\"langs lang-" + l + " " + (l ? 'hidden' : '') + "\">" + d + "</span>")).join('') +
		"</li>"
	)).join(''));

	$( base_target + ' > ul > li' ).click(function(e) {
		let prev	= $(base_target + ' > ul > li > input:checked');
		let current	= $(this).find('input');

		if (prev.attr('value') !== current.attr('value')) {
			current.prop('checked', true);
			prev.prop('checked', false);

			refreshLayer();
		}
	});
}

function writeHeader() {
	_.forEach(lang_targets, (o, key) => { $( key + ' .lang-target' ).html(o[lang]); });
}

function langChange() {
	$( lang_id + ' > div.active' ).removeClass('active');

	$( base_target + ' > ul > li > span.langs' ).addClass('hidden');
	$( filter_target + ' > ul > li > span.langs' ).addClass('hidden');

	lang	= (lang + 1) % lang_enum.length;

	$( lang_id + ' > div#' + lang_enum[lang] ).addClass('active');

	$( base_target + ' > ul > li > span.lang-' + lang ).removeClass('hidden');
	$( filter_target + ' > ul > li > span.lang-' + lang ).removeClass('hidden');

	writeHeader();
	initTabs();
	toggleSide(false);

	let active	= getActive();
	if ($( point_id + ' > input' ).prop('checked')) {
		getPoints((err, result) => { createLegend(result.legend, lang_lists.type[lang]); }, true)
	} else {
		createLegend(null, layers[lang][layers[0].indexOf(active)]);
	}
}
