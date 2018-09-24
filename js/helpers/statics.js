let map_dest	= "#map-wrapper";
let map_id		= "map-viz";

let centered	= {};

let duration	= 750;

let tooltip;

const layers	= ['Amount of FAP', 'Access Point Per 1000 Adults', 'Driving Time From FAPs'];
const net_color	= {
	two		: '#c8d7ea',
	three	: '#f4b2da',
	four	: '#cd9ed9'
}
const net_map	= {
	two		: '2G',
	three	: '3G',
	four	: '4G'
}
const prx_color	= {
	'0_5'	: '#77b8ce',
	'5_15'	: '#a0cddd',
	'15_30'	: '#bbdbe7',
}
const prx_pref	= 'prx-';
