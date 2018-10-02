require('dotenv').config();

const _				= require('lodash');
const fs			= require('fs');
const csv 			= require('fast-csv');
const async			= require('async');
const MongoDB		= require('mongodb');

const csv_file		= 'data/csv/bima_proximity.csv';
const DB_COLL		= 'location';

const MongoClient	= MongoDB.MongoClient;
const ObjectID		= MongoDB.ObjectID;

const auth			= (process.env.DB_USERNAME !== '' || process.env.DB_PASSWORD !== '') ? process.env.DB_USERNAME + ':' + process.env.DB_PASSWORD + '@' : '';
const db_url		= 'mongodb://' + auth + process.env.DB_HOST + ':' + process.env.DB_PORT;

MongoClient.connect(db_url, { }, (err, client) => {
	if (err) throw err;
	let db	= client.db(process.env.DB_DATABASE);

	async.waterfall([
		(flowCallback) => {
			csv
				.fromPath(csv_file, { headers: true, delimiter: ';' })
				.on('data', (row) => {
					db.collection(DB_COLL).update({ id: row.CC_3 }, { '$set': {
						'0_5' : parseFloat(row['%Area_0to5 min'].replace(',', '.')),
						'5_15' : parseFloat(row['%Area_5to15 min'].replace(',', '.')),
						'15_30' : parseFloat(row['%Area_15to30 min'].replace(',', '.')),
						'>30' : parseFloat(row['%Area_>30 min'].replace(',', '.')),
					}})
				})
				.on('finish', () => { flowCallback(); });
		},
	], (err) => {
		if (err) throw err;
		client.close();
	});
});
