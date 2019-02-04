require('dotenv').config();

const _				= require('lodash');
const fs			= require('fs');
const csv 			= require('fast-csv');
const async			= require('async');
const MongoDB		= require('mongodb');

const csv_file		= 'data/init/population.csv';
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
					db.collection(DB_COLL).update({ id: row.id }, { '$set': _.chain(row).omit('id').mapValues((o) => (_.isEmpty(o) ? null : parseInt(o))).value() })
				})
				.on('finish', () => { flowCallback(); });
		},
	], (err) => {
		if (err) throw err;
		client.close();
	});
});
