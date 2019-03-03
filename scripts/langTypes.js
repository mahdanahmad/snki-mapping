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

const translate		= {
	'ATM'					: 'ATM',
	'State Bank'			: 'Bank BUMN',
	'BPD'					: 'BPD',
	'Private National Bank'	: 'Bank Swasta',
	'Joint Venture Bank'	: 'Bank Gabungan',
	'BPR Syariah'			: 'BPR Syariah',
	'Banking Agents'		: 'Agen Perbankan',
	'Post Office'			: 'Kantor Post',
	'Cooperative'			: 'Koperasi',
	'AirTime'				: 'AirTime',
}

MongoClient.connect(db_url, { }, (err, client) => {
	if (err) throw err;
	let db		= client.db(process.env.DB_DATABASE);

	async.waterfall([
		(flowCallback) => {
			db.collection(DB_COLL).find().project({ type: 1 }).toArray(flowCallback);
		},
		(types, flowCallback) => {
			async.each(types, (o, next) => {
				db.collection(DB_COLL).update({ type: o.type }, { '$set': { en: o.type, id: translate[o.type] } }, next)
			}, flowCallback)
		},
	], (err) => {
		if (err) throw err;
		client.close();
	});
});
