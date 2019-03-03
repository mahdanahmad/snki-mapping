require('dotenv').config();

const _				= require('lodash');
const fs			= require('fs');
const csv 			= require('fast-csv');
const path			= require('path');
const async			= require('async');
const MongoDB		= require('mongodb');

const csv_root		= 'data/init/';
const csv_pref		= 'bps_';

const pop_file		= 'data/init/population.csv';

const DB_COLL		= 'location';

const MongoClient	= MongoDB.MongoClient;
const ObjectID		= MongoDB.ObjectID;

const auth			= (process.env.DB_USERNAME !== '' || process.env.DB_PASSWORD !== '') ? process.env.DB_USERNAME + ':' + process.env.DB_PASSWORD + '@' : '';
const db_url		= 'mongodb://' + auth + process.env.DB_HOST + ':' + process.env.DB_PORT;

const types			= ['provinsi', 'kabupaten', 'kecamatan', 'desa']

MongoClient.connect(db_url, { }, (err, client) => {
	if (err) throw err;
	let db		= client.db(process.env.DB_DATABASE);
	let files	= fs.readdirSync(csv_root).filter(o => (path.extname(o) == '.csv' && _.startsWith(o, csv_pref)));


	async.waterfall([
		(flowCallback) => {
			db.collection(DB_COLL).deleteMany({}, (err) => flowCallback(err));
		},
		(flowCallback) => {
			let mapped	= {};
			csv
				.fromPath(pop_file, { headers: true, delimiter: ';' })
				.on('data', ({id, ...rest}) => {
					mapped[id] = _.mapValues(rest, (o) => (_.isEmpty(o) ? null : parseInt(o)));
				})
				.on('finish', () => { flowCallback(null, mapped); });
		},
		(season, flowCallback) => {
			async.map(files, (filename, mapCallback) => {
				let filepath	=  csv_root + '/' + filename;

				let data		= [];
				csv
					.fromPath(filepath)
					.on("data", (o) => {
						data.push(Object.assign({
							id: _.head(o),
							name: _.last(o),
							parent: o.length == 3 ? o[1] : null,
							type: filename.slice(4, -4)
						}, season[_.head(o)] ));
					})
					.on("end", () => { mapCallback(null, data); });
			}, (err, results) => flowCallback(err, _.flatten(results)));
		},
		(seasoned, flowCallback) => {
			db.collection(DB_COLL).insertMany(seasoned, (err) => flowCallback(err));
		}
	], (err) => {
		if (err) throw err;
		client.close();
	});
});
