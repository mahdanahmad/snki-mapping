require('dotenv').config();

const _				= require('lodash');
const fs			= require('fs');
const csv 			= require('fast-csv');
const async			= require('async');
const XLSX 			= require('xlsx');
const MongoDB		= require('mongodb');

const xlsx_file		= 'data/xlsx/Master_Access_Points_Pilot_V02.xlsx';

const db_coll		= 'agents';
const type_coll		= 'types';

const MongoClient	= MongoDB.MongoClient;
const ObjectID		= MongoDB.ObjectID;

const auth			= (process.env.DB_USERNAME !== '' || process.env.DB_PASSWORD !== '') ? process.env.DB_USERNAME + ':' + process.env.DB_PASSWORD + '@' : '';
const db_url		= 'mongodb://' + auth + process.env.DB_HOST + ':' + process.env.DB_PORT;

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

			let data		= XLSX.utils.sheet_to_json(sheet, { header: headers, range: 1 }).map((o) => _.mapValues(o, (m) => (m == 'NA' ? null : m)));
			let types		= _.chain(data).map('access_point_type').uniq().map((type) => ({ type, color: null })).value();

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
