require('dotenv').config();

const _				= require('lodash');
const fs			= require('fs');
const csv 			= require('fast-csv');
const async			= require('async');
const MongoDB		= require('mongodb');

const csv_file		= 'data/populasi_2017.csv';

const db_coll		= 'location';

const MongoClient	= MongoDB.MongoClient;
const ObjectID		= MongoDB.ObjectID;

const auth			= (process.env.DB_USERNAME !== '' || process.env.DB_PASSWORD !== '') ? process.env.DB_USERNAME + ':' + process.env.DB_PASSWORD + '@' : '';
const db_url		= 'mongodb://' + auth + process.env.DB_HOST + ':' + process.env.DB_PORT;

MongoClient.connect(db_url, { useNewUrlParser: true }, (err, client) => {
	if (err) throw err;
	let db	= client.db(process.env.DB_DATABASE);

	let keys = null;

	async.waterfall([
		(flowCallback) => {
			let data	= {};

			csv
				.fromPath(csv_file, { headers: true })
				.on('data', (row) => { data[row.id] = _.omit(row, ['id']); })
				.on('finish', () => { flowCallback(null, data) })
		},
		(data, flowCallback) => {
			async.forEachOf(data, (input, id, next) => {
				db.collection(db_coll).updateOne({ id }, { '$set': input }, () => { next(); })
			}, (err) => flowCallback(err))
		}
	], (err) => {
		if (err) throw err;
		client.close();
	});
});
