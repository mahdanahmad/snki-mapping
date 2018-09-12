require('dotenv').config();

const _				= require('lodash');
const fs			= require('fs');
const csv 			= require('fast-csv');
const path			= require('path');
const async			= require('async');
const MongoDB		= require('mongodb');

const csv_root		= 'results';
const csv_pref		= 'gadm36_IDN';

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
		}
		(flowCallback) => {
			async.map(files, (filename, mapCallback) => {
				let idx			= _.nth(filename, -5);
				let filepath	=  csv_root + '/' + filename;

				let data		= [];
				csv
					.fromPath(filepath, { headers: true })
					.on("data", (o) => {
						data.push({
							id		: o['CC_' + idx],
							gid		: o['GID_' + idx],
							name	: o['NAME_' + idx],
							parent	: o['GID_' + (parseInt(idx) - 1)],
							type	: types[parseInt(idx) - 1],
						});
					})
					.on("end", () => { mapCallback(null, data); });
			}, (err, results) => flowCallback(err, _.flatten(results)));
		},
		(raw, flowCallback) => {
			const mapped	= _.chain(raw).filter((o) => (o.type !== _.last(types))).keyBy('gid').mapValues('id').value();
			flowCallback(null, raw.map((o) => _.chain(o).assign({ parent : (mapped[o.parent] || null) }).omit(['gid']).value()));
		},
		(seasoned, flowCallback) => {
			db.collection(DB_COLL).insertMany(seasoned, (err) => flowCallback(err));
		}
	], (err) => {
		if (err) throw err;
		client.close();
	});
});
