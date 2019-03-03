const map_dest		= "#map-wrapper";
const map_id		= "map-viz";

const chart_dest	= '#sidebar-chart';
const radar_id		= 'radar-viz';
const pie_id		= 'pie-viz';
const bar_id		= 'bar-viz';
const tree_id		= 'treemap-viz';
const radial_id		= 'radial-viz';

const misc_ceil		= '#misc-ceil';
const misc_floor	= '#misc-floor';
const misc_adds		= '#misc-additional';

const err_chart		= 'No data.';

let centered		= {};

let duration		= 750;

let tooltip;

let length;

const layers		= [
	['Number of Access Point', 'Adult Population', 'Access Point Per 1000 Adults', 'Driving Time From Access Points'],
	['Jumlah Titik Finansial', 'Populasi Orang Dewasa', 'Titik Finansial per 1000 Dewasa', 'Waktu Tempuh dari Titik Finansial'],
];
const tab_heads		= [
	[['Type of Access Points', 'Tipe Titik Finansial'], ['FAP/PAP distribution', 'Distribusi FAP/PAP'], ['Network Coverage', 'Ketersediaan Jaringan']],
	[['Adult Population', 'Populasi Orang Dewasa']],
	[['Access Point Per 1000 Adults', 'Titik Finansial per 1000 Dewasa']],
	[['Driving Time From FAPs', 'Waktu Tempuh dari Titik Finansial']],
];
const net_color		= {
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

const lang_enum		= ['en', 'id'];
const lang_id		= '#lang-wrapper';
let lang			= 0;

const lang_targets	= {
	'#region-dropdown'	: ['Select', 'Pilih'],
	'#base-dropdown'	: ['Basemap layer', 'Peta dasar'],
	'#filter-dropdown'	: ['Filter', 'Filter'],
}
const lang_lists	= {
	access: ['Total Access Point', 'Total Titik Finansial'],
	adult: ['Total Adult Population', 'Total Populasi Orang Dewasa'],
	potential: ['Total Potential Population', 'Total Populasi yang Berpotensi'],
	type: ['Type of Access Point', 'Tipe Titik Finansial']
}
