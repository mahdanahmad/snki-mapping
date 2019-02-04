require('dotenv').config();

const _				= require('lodash');
const fs			= require('fs');
const csv 			= require('fast-csv');
const path			= require('path');
const async			= require('async');
const MongoDB		= require('mongodb');

const DB_COLL		= 'location';

const MongoClient	= MongoDB.MongoClient;
const ObjectID		= MongoDB.ObjectID;

const auth			= (process.env.DB_USERNAME !== '' || process.env.DB_PASSWORD !== '') ? process.env.DB_USERNAME + ':' + process.env.DB_PASSWORD + '@' : '';
const db_url		= 'mongodb://' + auth + process.env.DB_HOST + ':' + process.env.DB_PORT;

if (!process.argv[2]) { throw 'please submit file to be inserted'; }

let target			= path.join(process.cwd(), process.argv[2]);
if (!fs.existsSync(target)) { throw 'file not found'; }
MongoClient.connect(db_url, { }, (err, client) => {
	if (err) throw err;
	let db	= client.db(process.env.DB_DATABASE);

	async.waterfall([
		(flowCallback) => {
			csv
				.fromPath(target, { headers: true, delimiter: ';' })
				.on('data', (row) => {
					db.collection(DB_COLL).update({ id: row.id }, { '$set': {
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
