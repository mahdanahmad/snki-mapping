require('dotenv').config();

const _				= require('lodash');
const fs			= require('fs');
const csv 			= require('fast-csv');
const async			= require('async');
const XLSX 			= require('xlsx');
const MongoDB		= require('mongodb');

const xlsx_file		= 'data/xlsx/geocoded.xlsx';
const map_file		= 'results/gadm36_IDN_4.csv';

const DB_COLL		= 'agents';

const MongoClient	= MongoDB.MongoClient;
const ObjectID		= MongoDB.ObjectID;

const auth			= (process.env.DB_USERNAME !== '' || process.env.DB_PASSWORD !== '') ? process.env.DB_USERNAME + ':' + process.env.DB_PASSWORD + '@' : '';
const db_url		= 'mongodb://' + auth + process.env.DB_HOST + ':' + process.env.DB_PORT;

MongoClient.connect(db_url, { }, (err, client) => {
	if (err) throw err;
	let db	= client.db(process.env.DB_DATABASE);

	async.waterfall([
		(flowCallback) => {
			db.collection(DB_COLL).deleteMany({}, (err) => flowCallback(err));
		},
		(flowCallback) => {
			let mapped	= [];
			csv
				.fromPath(map_file, { headers: true })
				.on("data", (row) => {
					if (_.includes(['34', '52'], row.CC_4.slice(0, 2))) { mapped.push(row); }
				})
				.on("end", () => flowCallback(null, _.chain(mapped).keyBy('GID_4').mapValues('CC_4').value()));
		},
		(mapped, flowCallback) => {
			let workbook	= XLSX.readFile(xlsx_file);
			let sheet		= workbook.Sheets[workbook.SheetNames[0]];

			// let data		= XLSX.utils.sheet_to_json(sheet).forEach((o) => {
			// 	console.log(o.GID_4 + ' => ' + mapped[o.GID_4]);
			// });

			let data		= XLSX.utils.sheet_to_json(sheet).map((o) => (
				_.assign(o, !_.isNil(o.GID_4) ? {
					prov_id	: (mapped[o.GID_4].slice(0,2)),
					kab_id	: (mapped[o.GID_4].slice(0,4)),
					kec_id	: (mapped[o.GID_4].slice(0,7)),
					desa_id	: (mapped[o.GID_4])
				} : {})
			));

			db.collection(DB_COLL).insertMany(data, (err) => flowCallback(err));
		},
	], (err) => {
		if (err) throw err;
		client.close();
	});
});
