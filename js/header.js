const state_head	= ['Provinsi', 'Kabupaten', 'Kelurahan', 'Desa'];
const title_target	= '#region-dropdown > div > span';
const region_target	= '#dropdown-region'

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
