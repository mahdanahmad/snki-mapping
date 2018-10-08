const _			= require('lodash');
const fs		= require('fs');
const csv 		= require('fast-csv');
const path		= require('path');
const topojson	= require('topojson');
const shapefile	= require('shapefile');

const shp_root	= './data/shp/kominfo/';
const rslt_root	= './public/network/';

const simply_val	= 1e-8;
const quant_val		= 1e4;

function shpToJson(filepath, callback) {
	filepath = shp_root + filepath;
	shapefile.read(filepath, filepath.slice(0, -3) + 'dbf').then(result => { callback(_.assign(result, { features: result.features.map(o => (_.assign(o, { properties: {} }))) })); });
}

function toTopo(filename, json, callback) {
	let geojson			= { map: json };
	// geojson[filename]	= json;
	let topology		= topojson.topology(geojson);
	topology			= topojson.presimplify(topology, topojson.sphericalTriangleArea);
	topology			= topojson.simplify(topology, null);
	topology			= topojson.quantize(topology, quant_val);

	callback(_.assign(topology, { bbox: topojson.bbox(topology) }));
}

function writeToFile(filename, json) {
	let filepath	= rslt_root + filename + '.json';

	if (!fs.existsSync(path.dirname(filepath))) { fs.mkdirSync(path.dirname(filepath)); }
	fs.writeFile(filepath, JSON.stringify(json), 'utf8', (err) => { if (err) { throw err; } });
	// fs.writeFile(filepath, JSON.stringify(topojson.merge(json, json.objects.map.geometries)), 'utf8', (err) => { if (err) { throw err; } });
}

fs.readdirSync(shp_root).filter(o => (path.extname(o) == '.shp')).forEach(file => {
	let filename	= file.slice(0, -4);
	shpToJson(file, geo => { toTopo(filename, geo, topo => { writeToFile(filename, topo); }); });
});
