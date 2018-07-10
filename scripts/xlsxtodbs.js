require('dotenv').config();

const _				= require('lodash');
const fs			= require('fs');
const async			= require('async');
const XLSX 			= require('xlsx');
const MongoDB		= require('mongodb');

const xlsx_file		= 'data/xlsx/ojk.xlsx';

const DB_COLL		= 'ojk_data';

const MongoClient	= MongoDB.MongoClient;
const ObjectID		= MongoDB.ObjectID;

const auth			= (process.env.DB_USERNAME !== '' || process.env.DB_PASSWORD !== '') ? process.env.DB_USERNAME + ':' + process.env.DB_PASSWORD + '@' : '';
const db_url		= 'mongodb://' + auth + process.env.DB_HOST + ':' + process.env.DB_PORT;

MongoClient.connect(db_url, { }, (err, client) => {
	if (err) throw err;
	let db	= client.db(process.env.DB_DATABASE);

	async.waterfall([
		(flowCallback) => {
			let workbook	= XLSX.readFile(xlsx_file);
			let first_sheet	= workbook.Sheets[workbook.SheetNames[0]];

			db.collection(DB_COLL).insertMany(XLSX.utils.sheet_to_json(first_sheet), (err) => flowCallback(err));
		},
	], (err) => {
		if (err) throw err;
		client.close();
	});
});
