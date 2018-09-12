const state_head	= ['Provinsi', 'Kabupaten', 'Kelurahan', 'Desa'];
const title_target	= '#region-dropdown > div > span';

const region_target	= '#dropdown-region';
const filter_target	= '#dropdown-filter';

let filter_time;
const awaitTime		= 750;

const filt_toggle	= ['Select All', 'Unselect All'];

function changeRegionHead() {
	d3.select(title_target).text(state_head[curr_state + 1]);
	getLocation((err, data) => {
		$( region_target + ' > ul' ).html(data.map((o) => ("<li id='region-" + o.id + "' value='" + o.id + "'>" + o.name + "</li>")).join(''));
		$( region_target + ' > ul > li' ).click(function(e) {
			$( region_target ).jqDropdown('hide');

			if (curr_state < states.length - 2) {
				zoom($( this ).val(), states[curr_state + 1]);
			} else {
				drawPoint($( this ).attr('value'));
			}
		});
	});
}

function changeFilterHead() {
	getTypes((err, data) => {
		$( filter_target + ' > ul' ).html("<li class='toggler'>" + filt_toggle[1] + "</li>" + data.map((o, i) => (
			"<li id='filter-" + i + "'>" +
				"<input type='checkbox' value='" + o + "' checked>" +
				"<label>" +
					"<svg width='18px' height='18px' viewBox='0 0 18 18'>" +
						"<path d='M1,9 L1,3.5 C1,2 2,1 3.5,1 L14.5,1 C16,1 17,2 17,3.5 L17,14.5 C17,16 16,17 14.5,17 L3.5,17 C2,17 1,16 1,14.5 L1,9 Z'></path>" +
						"<polyline points='1 9 7 14 15 4'></polyline>" +
					"</svg>" +
				"</label>" +
				"<span>" + o + "</span>" +
			"</li>"
		)).join(''));
		$( filter_target + ' > ul > li:not(.toggler)' ).click(function(e) {
			$( this ).find('input').prop('checked', !$( this ).find('input').prop('checked'));

			clearTimeout(filter_time);
			filter_time	= setTimeout(() => { refreshView(); }, awaitTime);

			$(filter_target + ' > ul > li.toggler').html(filt_toggle[($( filter_target + ' > ul > li > input:checked' ).length <= $( filter_target + ' > ul > li:not(.toggler)' ).length) ? 0 : 1]);
		});
		$( filter_target + ' > ul > li.toggler' ).click(function(e) {
			$( filter_target + ' > ul > li > input' ).prop('checked', !filt_toggle.indexOf($(this).html()));
			$(this).html(filt_toggle[(filt_toggle.indexOf($(this).html()) + 1) % 2])
			refreshView();
		});

	});
}
