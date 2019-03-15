const _			= require('lodash');
const fs		= require('fs');
const path		= require('path');
const topojson	= require('topojson');
const shapefile	= require('shapefile');

const shp_root	= './data/shp/coverage/';
const rslt_root	= './results/';

const simply_val	= 1e-7;
const quant_val		= 1e4;

function shpToJson(filepath) {
	return new Promise(function(resolve, reject) {
		filepath = shp_root + filepath;

		shapefile.read(filepath, filepath.slice(0, -3) + 'dbf').then(result => { resolve(_.assign(result, { features: result.features.map(o => (_.assign(o, { properties: {} }))) })); });
	});
}

function toTopo(json, simplify) {
	return new Promise(function(resolve, reject) {
		let geojson			= { map: json };

		let topology		= topojson.topology(geojson);
		console.log('topology');
		topology			= topojson.presimplify(topology, topojson.sphericalTriangleArea);
		console.log('presimplify');
		topology			= topojson.simplify(topology, simplify ? simply_val : null);
		console.log('simplify');
		topology			= topojson.quantize(topology, quant_val);
		console.log('quantize');

		resolve(_.assign(topology, { bbox: topojson.bbox(topology) }));
	});
}

function writeToFile(filename, json) {
	let filepath	= rslt_root + filename + '.json';

	if (!fs.existsSync(path.dirname(filepath))) { fs.mkdirSync(path.dirname(filepath)); }
	fs.writeFile(filepath, JSON.stringify(json), 'utf8', (err) => { if (err) { throw err; } });
	// fs.writeFile(filepath, JSON.stringify(topojson.merge(json, json.objects.map.geometries)), 'utf8', (err) => { if (err) { throw err; } });
}

const base		= { type: 'FeatureCollection', bbox: [ 95.01080651990503, -11.00761508896511, 141.01925216185782, 6.0757726872597315 ] };
let filepath	= rslt_root + '3G_topo.json';
fs.readFile(filepath, 'utf8', async(err, raw) => {
	if (err) throw err;

	const topo		= JSON.parse(raw);
	// console.log(topo);
	let geometry	= topojson.merge(topo, topo.objects['3G'].geometries);
	let features	= [{ type: 'Feature', properties: {}, geometry }];

	fs.writeFileSync(rslt_root + '3G_merged_geo.json', JSON.stringify(Object.assign({ features }, base)), 'utf8');
})
