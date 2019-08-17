require('dotenv').config();

const _				= require('lodash');
const fs			= require('fs');
const csv 			= require('fast-csv');
const async			= require('async');
const MongoDB		= require('mongodb');

const csv_file		= 'data/nasional_40_persen_kecamatan_status_kesejahteraan.csv';

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
			let type_dict = {};

			csv
				.fromPath(csv_file, { headers: true })
				.on('data', (row) => {
					let desil_value = _.chain(row).omit(['kode']).mapValues(o => (_.indexOf(o, '-') >= 0 ? null : parseInt(o))).value()

					if (_.isNull(keys)) { keys = _.keys(desil_value) }

					data[row['kode']] = desil_value;
					data[row['kode']]['kode'] = row['kode'];
				})
				.on('finish', () => { flowCallback(null, data) })
		},
		(desil_data, flowCallback) => {
			let forall = {};

			_.chain(desil_data).groupBy(o => (o.kode.substring(0,4))).mapValues(o => {
				let returned = {};

				keys.forEach(key => {
					let count = _.chain(o).map(key).sum().value();
					returned[key] = count ? count : null;
				});

				return returned;
			}).forEach((value, id) => {
				db.collection(db_coll).updateOne({ id }, { '$set': value })
			}).value();

			let by_province = (_.chain(desil_data).groupBy(o => (o.kode.substring(0,2))).mapValues(o => {
				let returned = {};

				keys.forEach(key => {
					let count = _.chain(o).map(key).sum().value();
					returned[key] = count ? count : null;
				});

				return returned;
			}).forEach((value, id) => {
				db.collection(db_coll).updateOne({ id }, { '$set': value })
			}).value());

			let by_kabupaten = _.chain(desil_data).keyBy(o => o.kode).mapValues(o => _.omit(o, ['kode'])).forEach((value, id) => {
				db.collection(db_coll).updateOne({ id }, { '$set': value })
			}).value();


			flowCallback();
		}
	], (err) => {
		if (err) throw err;
		client.close();
	});
});
