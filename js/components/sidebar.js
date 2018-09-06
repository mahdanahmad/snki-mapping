const sidewrap	= '#sidebar-wrapper';
const sidecont	= '#sidebar-content';

function toggleSide() {
	$( sidewrap + ' > ' + sidecont ).toggleClass('expanded');
}
