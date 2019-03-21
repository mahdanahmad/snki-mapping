const _			= require('lodash');
const fs		= require('fs');
const csv 		= require('fast-csv');
const path		= require('path');

const csv_root	= './data/csv/agents/';
const rslt_root	= './results/';

let proms	= fs.readdirSync(csv_root).filter(o => (path.extname(o) == '.csv')).map(file => new Promise(function(resolve, reject) {
	let data	= [];

	csv
		.fromPath(csv_root + file, { headers : true, discardUnmappedColumns : true, delimiter : ',', quote : '"' })
		.on("data", (row) => {

			let iddesa	= !_.isNaN(parseInt(row.IDDESA)) ? row.IDDESA : row.DESA;

			if (iddesa == '' || iddesa == '060') {
				console.log(iddesa);
				console.log(file);
				console.log(row);
			}

			// data.push({
			// 	'province_id'		: iddesa.slice(0,2),
			// 	'kabupaten_id'		: iddesa.slice(0,4),
			// 	'kecamatan_id'		: iddesa.slice(0,7),
			// 	'desa_id'			: iddesa,
			// 	'longitude'			: row.LONGITUDE,
			// 	'latitude'			: row.LATITUDE,
			// 	'bank_name'			: row['BANK FULL'],
			// 	'bank_id'			: row['BANKID'],
			// 	'access_point_type'	: row['ACCESS POI'],
			// 	// 'access_point_id'	: '',
			// 	'2_g'				: row['2G'] ? (_.includes(row['2G'], 'YES') ? 1 : 0) : null,
			// 	'3_g'				: row['3G'] ? (_.includes(row['3G'], 'YES') ? 1 : 0) : null,
			// 	'4_g'				: row['4G'] ? (_.includes(row['4G'], 'YES') ? 1 : 0) : null,
			// 	'gender'			: row['Agent Gend'],
			// });
		})
		.on("end", () => {
			resolve(data);
		});
}));

Promise.all(proms).then(data => {
	// data = _.flatten(data)
	//
	// console.log(data.length);
	//
	// csv.writeToPath(rslt_root + 'full.csv', data, { headers : true });
	// csv.writeToPath(rslt_root + 'banklist.csv', _.chain(data).uniqBy('bank_id').map(o => _.pick(o, ['bank_id', 'bank_name'])).value(), { headers : true });
	// csv.writeToPath(rslt_root + 'iddesa.csv', _.chain(data).map('desa_id').uniq().value());
})
