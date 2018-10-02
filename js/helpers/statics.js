const map_dest		= "#map-wrapper";
const map_id		= "map-viz";

const chart_dest	= '#sidebar-chart';
const radar_id		= 'radar-viz';
const pie_id		= 'pie-viz';
const bar_id		= 'bar-viz';
const tree_id		= 'treemap-viz';

const misc_ceil		= '#misc-ceil';
const misc_floor	= '#misc-floor';
const misc_adds		= '#misc-additional';

const err_chart		= 'No data.';

let centered		= {};

let duration		= 750;

let tooltip;

let length;

const layers		= ['Number of FAP', 'Access Point Per 1000 Adults', 'Driving Time From FAPs'];
const tab_heads		= [
	['Type of Access Points', 'FAP/PAP distribution', 'Network Coverage'],
	['Access Point Per 1000 Adults'],
	['Driving Time From FAPs'],
];
const net_color		= {
	// two		: '#c8d7ea',
	// three	: '#f4b2da',
	// four	: '#cd9ed9'
	two		: '#8bbdbe',
	three	: '#75cccd',
	four	: '#447f8b'
}
const net_map		= {
	two		: '2G',
	three	: '3G',
	four	: '4G'
}
const prx_color		= {
	'0_5'	: '#756bb1',
	'5_15'	: '#bcbddc',
	'15_30'	: '#efedf5',
	'>30'	: '#d4dadc'
}
const prx_pref		= 'prx-';
