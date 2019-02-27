const _			= require('lodash');
const fs		= require('fs');
const csv 		= require('fast-csv');
const path		= require('path');
const async		= require('async');
const topojson	= require('topojson');
const shapefile	= require('shapefile');

const desa_root	= './data/shp/bps/';
const disv_root	= './data/shp/dissolved/';
const rslt_root	= './public/bps/';

const geoFile	= './data/geo.json'

const simply_val	= 1e-8;
const quant_val		= 1e4;

const enum_ids	= ['PROVNO', 'KABKOTNO', 'KECNO', 'DESANO'];
const enum_name	= ['DESA', 'KECAMATAN', 'KABKOT', 'PROVINSI'];

function shpToJson(filepath) {
	return new Promise(function(resolve, reject) { shapefile.read(filepath, filepath.slice(0, -3) + 'dbf').then(result => { resolve(result); }); });
}

function toTopo(json, simplify) {
	return new Promise(function(resolve, reject) {
		let geojson			= { map: json };

		let topology		= topojson.topology(geojson);
		topology			= topojson.presimplify(topology, topojson.sphericalTriangleArea);
		topology			= topojson.simplify(topology, simplify ? simply_val : null);
		topology			= topojson.quantize(topology, quant_val);

		resolve(_.assign(topology, { bbox: topojson.bbox(topology) }));
	});
}

function writeToFile(filename, json) {
	return new Promise(function(resolve, reject) {
		let filepath	= rslt_root + filename + '.json';

		if (!fs.existsSync(path.dirname(filepath))) { fs.mkdirSync(path.dirname(filepath)); }
		fs.writeFileSync(filepath, JSON.stringify(json), 'utf8');

		resolve();
	});
}

function shpToJsonFile() {
	fs.readdirSync(desa_root).filter(o => (path.extname(o) == '.shp')).forEach(async file => {
		const geo	= await shpToJson(desa_root + file);

		fs.writeFileSync(geoFile, JSON.stringify(geo), 'utf8');
	});
}

/*
	DESA
*/
function createDesaFixed() {
	fs.readFile(geoFile, 'utf8', async(err, raw) => {
		if (err) throw err;

		const geo 		= JSON.parse(raw);
		let base		= _.omit(geo, ['features']);

		let state		= enum_name[0];
		let params		= enum_ids.slice(0, -1);
		let grouped		= _.groupBy(geo.features, o => (params.map(d => o.properties[d]).join('')));

		_.forEach(grouped, async (features, key) => {
			console.log(key);
			let topo	= await toTopo(Object.assign({}, base, { features: features.map(o => _.assign(o, { properties: { id: key + o.properties[enum_ids[params.length]], name: o.properties[state], prev_id: key, prev: (o.properties[enum_name[1]])  } })) }));
			await writeToFile(key, topo);
		});
	});
}

/*
	KABUPATEN
*/
function createKabupatenFixed() {
	fs.readFile(geoFile, 'utf8', async(err, raw) => {
		if (err) throw err;

		const geo 		= JSON.parse(raw);
		let base		= _.omit(geo, ['features']);

		const index		= 1;
		const state		= enum_name[index];
		let paramise	= enum_ids.slice(0, -index);

		let mergeProms	= _.chain(geo.features).groupBy(o => (paramise.map(d => o.properties[d]).join(''))).map(async (features) => {
			let topo		= await toTopo(Object.assign({}, base, { features }));

			let properties	= _.chain(features).get('[0].properties', {}).pick(_.concat(paramise, enum_name.slice(index))).value();
			let geometry	= topojson.merge(topo, topo.objects.map.geometries);

			// console.log(geometry);
			return ({ type: 'Feature', properties, geometry });
		}).value();

		Promise.all(mergeProms).then(result => {
			let params		= enum_ids.slice(0, -(index + 1));
			let grouped		= _.groupBy(result, o => (params.map(d => o.properties[d]).join('')));

			_.forEach(grouped, async (features, key) => {
				console.log(key);
				let topo	= await toTopo(Object.assign({}, base, { features: features.map(o => _.assign(o, { properties: { id: key + o.properties[enum_ids[params.length]], name: o.properties[state], prev_id: key, prev: _.get(o, ['properties', enum_name[index + 1]], null)  } })) }));
				await writeToFile(_.isEmpty(key) ? 0 : key, topo);
			});
		});
	});
}

const curr_state	= 'provinsi';
const curr_base		= disv_root + curr_state + '/';

const floor_csv	= './data/csv/bps_regencies.csv';
const ceil_csv	= './data/csv/bps_provinces.csv';

// fs.readdirSync(curr_base).filter(o => (path.extname(o) == '.shp')).forEach(async file => {
// 	const geo	= await shpToJson(curr_base + file);
//
// 	fs.writeFileSync('./data/' + curr_state + '.json', JSON.stringify(geo), 'utf8');
// });

// Promise.all([floor_csv, ceil_csv].map(o => (new Promise((resolve, reject) => {
// 	let result	= {};
//
// 	csv
// 	.fromPath(o)
// 	.on("data", data => { result[_.head(data)] = _.last(data) })
// 	.on("end", () => { resolve(result); });
//
// })))).then(mapped => {
// 	fs.readFile('./data/' + curr_state + '.json', 'utf8', async(err, raw) => {
// 		const geo 		= JSON.parse(raw);
// 		let base		= _.omit(geo, ['features']);
//
// 		const index		= 2;
// 		const state		= enum_name[index];
//
// 		let params		= enum_ids.slice(0, -(index + 1));
// 		let grouped		= _.groupBy(geo.features, o => (params.map(d => o.properties[d]).join('')));
//
// 		_.forEach(grouped, async (features, key) => {
// 			console.log(key);
// 			let topo	= await toTopo(Object.assign({}, base, { features: features.map(o => _.assign(o, { properties: { id: key + o.properties[enum_ids[params.length]], name: mapped[0][key + o.properties[enum_ids[params.length]]], prev_id: key, prev: mapped[1][key]  } })) }));
// 			await writeToFile(key, topo);
// 		});
// 	});
// });

let mapped	= {};
csv
	.fromPath(ceil_csv)
	.on('data', data => { mapped[_.head(data)] = _.last(data) })
	.on('end', () => {
		fs.readFile('./data/' + curr_state + '.json', 'utf8', async(err, raw) => {
			let geo 		= JSON.parse(raw);
			let base		= _.omit(geo, ['features']);

			let topo	= await toTopo(Object.assign({}, base, { features: geo.features.map(o => Object.assign(o, { properties: { id: o.properties.PROVNO, name: mapped[o.properties.PROVNO] } })) }));
			await writeToFile(0, topo);
		});
	})
