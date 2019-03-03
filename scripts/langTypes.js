require('dotenv').config();

const _				= require('lodash');
const async			= require('async');
const MongoDB		= require('mongodb');

const DB_COLL		= 'types';
const distinct_key	= 'access_point_type';

const MongoClient	= MongoDB.MongoClient;
const ObjectID		= MongoDB.ObjectID;

const auth			= (process.env.DB_USERNAME !== '' || process.env.DB_PASSWORD !== '') ? process.env.DB_USERNAME + ':' + process.env.DB_PASSWORD + '@' : '';
const db_url		= 'mongodb://' + auth + process.env.DB_HOST + ':' + process.env.DB_PORT;

const palette		= ['#d17076', '#eb6090', '#f3a6be', '#98e2e1', '#17a5a3', '#fac999', '#e6790d', '#b24201', '#eac8b5', '#f3f0e2', '#c1ccd4', '#fbe5ad', '#e2c408', '#fdb360', '#af9b95', '#a4bfd9', '#5b92cb', '#787fa0', '#8e9fbb', '#ebf0f7'];

const PAPs			= [];
const FAPs			= [];

MongoClient.connect(db_url, { }, (err, client) => {
	if (err) throw err;
	let db		= client.db(process.env.DB_DATABASE);

	async.waterfall([
		(flowCallback) => {
			db.collection(DB_COLL).deleteMany({}, (err) => flowCallback(err));
		},
		(flowCallback) => {
			db.collection('agents').distinct(distinct_key, {}, (err, result) => {
				flowCallback(err, result.map((o, i) => ({ type: o, color: palette[i], group: _.includes(['Kantor Pos', 'Agen Pos'], o) ? 'PAP' : 'FAP' })));
			});
		},
		(data, flowCallback) => {
			db.collection(DB_COLL).insertMany(data, (err, result) => flowCallback(err));
		}
	], (err) => {
		if (err) throw err;
		client.close();
	});
});
