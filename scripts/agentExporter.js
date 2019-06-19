require('dotenv').config();

const _				= require('lodash');
const fs			= require('fs');
const csv 			= require('fast-csv');
const async			= require('async');
const MongoDB		= require('mongodb');

const bank_file		= 'data/banklist.csv';
const csv_file		= 'data/results.csv';

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
		// (flowCallback) => {
		// 	db.collection(db_coll).deleteMany({}, (err) => flowCallback(err));
		// },
		(flowCallback) => {
			db.collection(type_coll).findOne({ 'type': 'LKM' }, (err, result) => {
				if (err) { flowCallback(err); }
				else if (result) { flowCallback(); } else {
					let newType = {
						"type"	: "LKM",
						"color"	: "firebrick",
						"shape"	: "circle",
						"group"	: "PAP",
						"en"	: "LKM",
						"id"	: "LKM"
					}

					db.collection(type_coll).insertOne(newType, (err) => flowCallback(err));
				}
			});
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

			let prov	= {};

			csv
				.fromPath(csv_file, { headers: true })
				.on('data', (row) => {
					let access_point_type = '';
					if (row['Institutio'] == 'INSURANSI') { access_point_type = '' }
					else if (row['ACCESS POI'] == 'Pergadaian') { access_point_type = 'Pegadaian' }
					else if (_.includes(['ATM', 'LKM'], row['ACCESS POI'])) { access_point_type = row['ACCESS POI'] }
					else {
						if (!row['BANKID']) { console.log(row); } else { access_point_type = bank_cate[bankmapped[parseInt(row['BANKID'])]] }
					}

					if (access_point_type) {
						data.push(_.chain(row).omit(['bank_name', 'bank_id']).assign({ desa_id: parseInt(row.desa_id).toString(), access_point_type, access_point_id: typesMapped[access_point_type] }).value())
					}

					if (!_.chain(prov).keys().includes(row['province_id']).value()) { prov[row['province_id']] = 1; } else { prov[row['province_id']]++; }
				})
				.on('finish', () => { console.log(data.length); db.collection(db_coll).insertMany(data, (err) => flowCallback(err)); })
				// .on('finish', () => { console.log(prov); console.log(_.chain(prov).values().sum().value()); flowCallback() })
		}
	], (err) => {
		if (err) throw err;
		client.close();
	});
});
