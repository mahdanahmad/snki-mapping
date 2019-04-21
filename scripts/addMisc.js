require('dotenv').config();

const _				= require('lodash');
const fs			= require('fs');
const csv 			= require('fast-csv');
const async			= require('async');
const MongoDB		= require('mongodb');

const root_dir		= 'data/init/';
const csvs			= ['province', 'kabupaten', 'kecamatan'];
const ID_COLL		= 'BPS_ID#';
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
			async.map(csvs, (name, next) => {
				let filepath = root_dir + name + '.csv';

				csv
					.fromPath(filepath, { headers: true, delimiter: ';' })
					.on('data', (row) => {
						if (row['BPS_ID#'] !== "") {
							// console.log(_.chain(row).omit([ID_COLL]).omitBy((o, key) => (_.includes(key, 'NAME'))).mapValues(o => (_.includes(['NA', ''], o) ? null : o )).value());
							db.collection(DB_COLL).updateOne({ id: row[ID_COLL] }, { '$set': _.chain(row).omit([ID_COLL]).omitBy((o, key) => (_.includes(key, 'NAME'))).mapValues(o => (_.includes(['NA', ''], o) ? null : o )).value() }, {}, (err) => { if (err) { next(err) } })
						}
					})
					.on('finish', () => { next(); })
			}, flowCallback);
		},
		// (inputs, flowCallback) => {
		// 	inputs = _.flatten(inputs);
		// 	db.collection(DB_COLL).find({type: { '$ne': 'desa' }}).project({ id: 1, name: 1, _id: 0 }).toArray().then(result => {
		// 		let ids 	= _.map(result, 'id');
		// 		let nots	= _.difference(ids, inputs);
		//
		// 		csv
		// 			.writeToPath('./results/kecamatan.csv', _.chain(result).filter(o => (_.includes(nots, o.id))).value(), { headers: true })
		// 			.on('finish', () => { flowCallback(); })
		// 	});
		// }
	], (err) => {
		if (err) throw err;


		client.close();
	});
});
