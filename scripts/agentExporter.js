require('dotenv').config();

const _				= require('lodash');
const fs			= require('fs');
const csv 			= require('fast-csv');
const async			= require('async');
const MongoDB		= require('mongodb');

const bank_file		= 'data/init/banklist.csv';
const csv_file		= 'data/init/first.csv';

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

MongoClient.connect(db_url, { useNewUrlParser: true }, (err, client) => {
	if (err) throw err;
	let db	= client.db(process.env.DB_DATABASE);

	async.waterfall([
		(flowCallback) => {
			db.collection(db_coll).deleteMany({}, (err) => flowCallback(err));
		},
		(flowCallback) => {
			let bankmapped	= {};
			csv
				.fromPath(bank_file, { headers: true })
				.on('data', (row) => { bankmapped[row.bank_id] = row.bank_type; })
				.on('finish', () => { flowCallback(null, bankmapped) });

		},
		(bankmapped, flowCallback) => {
			db.collection(type_coll).find({}).toArray().then(results => flowCallback(null, bankmapped, results));
		},
		(bankmapped, types, flowCallback) => {
			let data	= [];
			let typesMapped	= _.chain(types).map(o => ([o.type, o._id])).fromPairs().value()

			csv
				.fromPath(csv_file, { headers: true })
				.on('data', (row) => {
					let access_point_type	= _.includes(['ATM'], row.access_point_type) ? row.access_point_type : bank_cate[bankmapped[row.bank_id]];

					data.push(_.chain(row).omit(['bank_name', 'bank_id']).assign({ desa_id: parseInt(row.desa_id).toString(), access_point_type, access_point_id: typesMapped[access_point_type] }).value())
				})
				.on('finish', () => { db.collection(db_coll).insertMany(data, (err) => flowCallback(err)); })
		}
	], (err) => {
		if (err) throw err;
		client.close();
	});
});
