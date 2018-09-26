let map_dest	= "#map-wrapper";
let map_id		= "map-viz";

let centered	= {};

let duration	= 750;

let tooltip;

let length;

const layers	= ['Number of FAP', 'Access Point Per 1000 Adults', 'Driving Time From FAPs'];
const tab_heads	= [
	['Type of Access Points', 'FAP/PAP distribution', 'Network Coverage'],
	['Access Point Per 1000 Adults'],
	['Driving Time From FAPs'],
];
const net_color	= {
	// two		: '#c8d7ea',
	// three	: '#f4b2da',
	// four	: '#cd9ed9'
	two		: '#8bbdbe',
	three	: '#75cccd',
	four	: '#447f8b'
}
const net_map	= {
	two		: '2G',
	three	: '3G',
	four	: '4G'
}
const prx_color	= {
	'0_5'	: '#efedf5',
	'5_15'	: '#bcbddc',
	'15_30'	: '#756bb1',
}
const prx_pref	= 'prx-';
