const _			= require('lodash');
const fs		= require('fs');
const csv 		= require('fast-csv');
const path		= require('path');
const async		= require('async');
const topojson	= require('topojson');
const shapefile	= require('shapefile');

const root		= './data/shp/kaltara/';
const rslt_root	= './public/json/';

const simply_val	= 1e-8;
const quant_val		= 1e4;

const old_kaltim	= 64;
const kaltara_id	= 65;
const kaltara_kabs	= {
	'6406': '6501',
	'6407': '6502',
	'6410': '6503',
	'6408': '6504',
	'6473': '6571',
};

const bps_path	= './results/fromBPS.csv';
const gadm_path	= './results/fromGADM.csv';

function shpToJson(filename, level, callback) {
	filepath = root + filename;
	shapefile.read(filepath, filepath.slice(0, -3) + 'dbf').then(result => {
		callback(_.assign(result, { features: result.features.filter((o) => (!_.isNil(o.properties['CC_' + level]))).map((o) => _.assign(o, { properties: { id: o.properties['CC_' + level], name: o.properties['NAME_' + level], prev: ((level - 1) ? o.properties['NAME_' + (level - 1)] : undefined) }})) }));
		// callback(result);
	});
}

function toTopo(level, filename, json, callback) {
	let geojson			= { map: json };
	// geojson[filename]	= json;
	let topology		= topojson.topology(geojson);
	topology			= topojson.presimplify(topology, topojson.sphericalTriangleArea);
	topology			= topojson.simplify(topology, (level - 1) ? null : simply_val);
	topology			= topojson.quantize(topology, quant_val);

	callback(_.assign(topology, { bbox: topojson.bbox(topology) }));
}

function writeToFile(filename, json) {
	let filepath	= rslt_root + filename + '.json';

	if (!fs.existsSync(path.dirname(filepath))) { fs.mkdirSync(path.dirname(filepath)); }
	fs.writeFile(filepath, JSON.stringify(json), 'utf8', (err) => { if (err) { throw err; } });
}

// CREATE NATIONAL TOPOJSON
// fs.readdirSync(root).filter(o => (path.extname(o) == '.shp')).forEach(file => {
// 	let filename	= file.slice(0, -4);
// 	let level		= 1;
//
// 	shpToJson(file, level, geo => { toTopo(level, filename, geo, topo => { writeToFile('0', topo); }); });
// });

// CREATE PROVINSI (64, 65) TOPOJSON
// fs.readFile(rslt_root + old_kaltim + '.json', 'utf8', (err, raw) => {
// 	if (err) { throw err; }
// 	raw			= JSON.parse(raw);
//
// 	let level	= 2;
//
// 	let topo	= topojson.feature(raw, raw.objects.map);
// 	let kaltim	= _.assign({}, topo, { features: topo.features.filter((o) => (!_.chain(kaltara_kabs).keys().includes(o.properties.id).value())) });
// 	toTopo(level, old_kaltim, kaltim, topo => { writeToFile(old_kaltim, topo); })
//
// 	let kaltara	= _.assign({}, topo, { features: topo.features.filter((o) => (_.chain(kaltara_kabs).keys().includes(o.properties.id).value())).map((o) => {
// 		let properties	= _.assign(o.properties, { id: kaltara_kabs[o.properties.id], prev: 'Kalimantan Utara', prev_id: kaltara_id });
//
// 		return _.assign(o, { properties });
// 	}) });
// 	toTopo(level, kaltara_id, kaltara, topo => { writeToFile(kaltara_id, topo); })
// });

// CREATE REST TOPOJSON
// const old_keys	= _.keys(kaltara_kabs);
// fs.readdirSync(rslt_root).filter((o) => (_.includes(old_keys, o.slice(0, 4)))).forEach(file => {
// 	fs.readFile(rslt_root + file, 'utf8', (err, raw) => {
// 		if (err) { throw err; }
//
// 		raw			= JSON.parse(raw);
// 		let topo	= topojson.feature(raw, raw.objects.map);
// 		topo.features.map(o => ([o.properties.id, o.properties.name])).forEach((o) => { console.log(o); csvStream.write(o); });
// 	})
// });

// CHECK TOPOJSON
// fs.readFile(rslt_root + '6406.json', 'utf8', (err, raw) => {
// 	if (err) { throw err; }
// 	raw			= JSON.parse(raw);
// 	let topo	= topojson.feature(raw, raw.objects.map);
// 	console.log(topo.features.map(o => (o.properties)));
// });

// CHECK KALTARA
// const csv_root	= './data/csv/';
// const kab_keys	= _.map(kaltara_kabs);
//
// let kecamatan	= [];
// let desa		= [];
//
// csv
// 	.fromPath(csv_root + 'bps_districts.csv')
// 	.on("data", (row) => { if (_.includes(kab_keys, row[1])) { kecamatan.push(row); } })
// 	.on("end", () => {
// 		let desa_keys	= _.map(kecamatan, (o) => (o[0]));
// 		csv
// 			.fromPath(csv_root + 'bps_villages.csv')
// 			.on("data", (row) => { if (_.includes(desa_keys, row[1])) { desa.push(row); } })
// 			.on("end", () => {
// 				csv
// 					.writeToPath(bps_path, kecamatan.concat(desa))
// 					.on('finish', () => {  });
// 			})
// 	});

// TAKE GADM KALTARA'S (KECAMATAN AND DESA) VALUE
// const old_keys	= _.keys(kaltara_kabs);
// let data	= fs.readdirSync(rslt_root).filter((o) => (_.includes(old_keys, o.slice(0, 4)))).map(file => {
// 	let raw = JSON.parse(fs.readFileSync(rslt_root + file, 'utf8'));
//
// 	let topo	= topojson.feature(raw, raw.objects.map);
// 	return topo.features.map(o => ([o.properties.id, o.properties.name, o.properties.prev_id, o.properties.prev]));
// });
// csv
// 	.writeToPath(gadm_path, _.flatten(data))
// 	.on('finish', () => {  });

// COMPARE GADM AND BPS
// async.map([bps_path, gadm_path], (path, mapCallback) => {
// 	let data	= [];
// 	csv
// 		.fromPath(path)
// 		.on('data', row => { data.push(row); })
// 		.on('finish', () => { mapCallback(null, data); })
// }, (err, results) => {
// 	let bps_area	= results[0].map(o => _.toLower(o[2]));
// 	let gadm_area	= results[1].map(o => _.toLower(o[1]));
//
// 	console.log(_.difference(bps_area, gadm_area));
// 	console.log(_.difference(gadm_area, bps_area));
// })
