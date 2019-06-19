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
	['Number of Access Point', 'Population', 'Access Point Per 1000 Adults', 'Distance From Access Points', 'Percentage of Financial Inclusion', 'Poverty Line', 'Electricity', 'Literacy'],
	['Jumlah Titik Finansial', 'Populasi', 'Titik Finansial per 1000 Dewasa', 'Jarak dari Titik Finansial', 'Persentase dari Inklusi Finansial', 'Garis Kemiskinan', 'Kondisi Listrik', 'Literasi'],
];
const tab_heads		= [
	[['Type of Access Points', 'Tipe Titik Finansial'], ['FAP/PAP distribution', 'Distribusi FAP/PAP'], ['Network Coverage', 'Ketersediaan Jaringan']],
	[['Population', 'Populasi']],
	[['Access Point Per 1000 Adults', 'Titik Finansial per 1000 Dewasa']],
	[['Driving Time From FAPs', 'Waktu Tempuh dari Titik Finansial']],
	[['', '']],
	[['', '']],
	[['', '']],
	[['Literacy Percentage', 'Persentase Literasi']],
];
const net_color		= {
	two		: '#8bbdbe',
	three	: '#589A9B',
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

const buff_color	= {
	'1'	: '#756bb1',
	'5'	: '#bcbddc',
}
const prx_pref		= 'prx-';

const lang_enum		= ['en', 'id'];
const lang_id		= '#lang-wrapper';
let lang			= 0;

const lang_targets	= {
	'#region-dropdown'		: ['Select', 'Pilih'],
	'#base-dropdown'		: ['Basemap layer', 'Peta dasar'],
	'#filter-dropdown'		: ['Filter', 'Filter'],
	'#population-dropdown'	: ['Population Filter', 'Filter Populasi'],
	'#question-dropdown'	: ['Questions Analytic', 'Pertanyaan Analitis'],
}
const lang_lists	= {
	access: ['Total Access Point', 'Total Titik Finansial'],
	adult: ['Total Adult Population', 'Total Populasi Orang Dewasa'],
	potential: ['Total Potential Population', 'Total Populasi yang Berpotensi'],
	type: ['Type of Access Point', 'Tipe Titik Finansial']
}
