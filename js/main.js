moment.locale('id');

$( document ).ready(function() {
	jQuery( '#drops-wrapper img, #sidebar-wrapper img' ).each(function() {
		let $img = jQuery(this);
		let imgID = $img.attr('id');
		let imgClass = $img.attr('class');
		let imgURL = $img.attr('src');

		jQuery.get(imgURL, (data) => {
			// Get the SVG tag, ignore the rest
			let $svg = jQuery(data).find('svg');

			// Add replaced image's ID to the new SVG
			if(typeof imgID !== 'undefined') { $svg = $svg.attr('id', imgID); }

			// Add replaced image's classes to the new SVG
			if(typeof imgClass !== 'undefined') { $svg = $svg.attr('class', imgClass.replace('hidden', '') + ' replaced-svg'); }

			// Remove any invalid XML tags as per http://validator.w3.org
			$svg = $svg.removeAttr('xmlns:a');

			// Replace image with new SVG
			$img.replaceWith($svg);

		}, 'xml');
	});

	createBaseHead();
	changeRegionHead();
	createNetworkDrop();

	changeFilterHead(() => {});

	initTabs();

	setTimeout(() => initMap(), 100);
});
