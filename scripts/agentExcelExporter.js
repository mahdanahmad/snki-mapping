require('dotenv').config();

const _				= require('lodash');
const fs			= require('fs');
const csv 			= require('fast-csv');
const async			= require('async');
const XLSX 			= require('xlsx');
const MongoDB		= require('mongodb');

const xlsx_file		= 'data/init/Access_points_Master_Update_Pilot_V02.xlsx';

const db_coll		= 'agents';
const type_coll		= 'types';

const MongoClient	= MongoDB.MongoClient;
const ObjectID		= MongoDB.ObjectID;

const auth			= (process.env.DB_USERNAME !== '' || process.env.DB_PASSWORD !== '') ? process.env.DB_USERNAME + ':' + process.env.DB_PASSWORD + '@' : '';
const db_url		= 'mongodb://' + auth + process.env.DB_HOST + ':' + process.env.DB_PORT;

const bank_cate		= {
	'BPD'	: 'BPD',
	'BPRS'	: 'BPR Syariah',
	'JV'	: 'Joint Venture Bank',
	'PNB'	: 'Private National Bank',
	'SB'	: 'State Bank',
}

const type_details	= {
	'State Bank'			: { color: '#33489e', shape: 'rect', group: 'FAP' },
	'BPD'					: { color: '#6abd45', shape: 'rect', group: 'FAP' },
	'Private National Bank'	: { color: '#0581c3', shape: 'rect', group: 'FAP' },
	'Joint Venture Bank'	: { color: '#70cbd3', shape: 'rect', group: 'FAP' },
	'BPR Syariah'			: { color: '#0d8341', shape: 'rect', group: 'FAP' },
	'ATM'					: { color: '#efd724', shape: 'circle', group: 'FAP' },
	'Banking Agents'		: { color: '#a64e9d', shape: 'circle', group: 'FAP' },
	'Cooperative'			: { color: '#9b401c', shape: 'circle', group: 'FAP' },
	'AirTime'				: { color: 'firebrick', shape: 'triangle', group: 'PAP' },
	'Post Office & Agent'	: { color: '#f38b20', shape: 'triangle', group: 'PAP' },
}

function setType(o) {
	if (o.bank == 'BANK') {
		if (_.includes(['Laku Pandai', 'Laku Pandai / LKD'], o.access_point)) { return 'Banking Agents'; }
		else if (_.includes(['ATM'], o.access_point)) { return o.access_point; }
		else { return bank_cate[o.bank_category]; }
	} else {
		if (_.includes(['Kantor Pos', 'Pos Agen'], o.access_point)) { return 'Post Office & Agent'; }
		else { return o.access_point; }
	}
}

MongoClient.connect(db_url, { }, (err, client) => {
	if (err) throw err;
	let db	= client.db(process.env.DB_DATABASE);

	async.waterfall([
		(flowCallback) => {
			db.collection(db_coll).deleteMany({}, (err) => flowCallback(err));
		},
		(flowCallback) => {
			db.collection(type_coll).deleteMany({}, (err) => flowCallback(err));
		},
		(flowCallback) => {
			let workbook	= XLSX.readFile(xlsx_file);
			let sheet		= workbook.Sheets[workbook.SheetNames[0]];

			function format_column_name(name) { return name.replace(/\s/g, "_"); }
			let headers		= [];
			let range		= XLSX.utils.decode_range(sheet['!ref']);
			for(let C = range.s.c; C <= range.e.c; ++C) {
    			let addr 	= XLSX.utils.encode_cell({ r:range.s.r, c:C });
    			let cell 	= sheet[addr];
    			if(!cell) continue;
    			headers.push( _.snakeCase(cell.v));
			}

			let data		= XLSX.utils.sheet_to_json(sheet, { header: headers, range: 1 }).map((o) => _.chain(o).mapValues((m) => (m == 'NA' ? null : m)).assign({
				'2_g'				: o['2_g'] ? (_.includes(o['2_g'], 'YES') ? 1 : 0) : null,
				'3_g'				: o['3_g'] ? (_.includes(o['3_g'], 'YES') ? 1 : 0) : null,
				'4_g'				: o['4_g'] ? (_.includes(o['4_g'], 'YES') ? 1 : 0) : null,
				'province_id'		: o.prov_bps,
				'kabupaten_id'		: o.kab_bps,
				'kecamatan_id'		: o.kec_bps,
				'desa_id'			: o.desa_bps,
				access_point_type	: setType(o),
			}).value());
			// let groupMapped	= _.chain(data).uniqBy('access_point_type').map((o) => ([o.access_point_type, o.point_type])).fromPairs().value();
			let types		= _.chain(data).map('access_point_type').uniq().map((type) => _.assign({ type }, type_details[type] )).value();

			db.collection(type_coll).insertMany(types, (err, result) => {
				let inserted	= _.chain(result.ops).map((o) => ([o.type, o._id.toString()])).fromPairs().value();

				db.collection(db_coll).insertMany(data.map((o) => (_.assign(o, { access_point_id: inserted[o.access_point_type] }))), (err) => flowCallback(err));
			})
		},
	], (err) => {
		if (err) throw err;
		client.close();
	});
});
