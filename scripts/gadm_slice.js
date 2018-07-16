const _			= require('lodash');
const fs		= require('fs');
const csv 		= require('fast-csv');
const path		= require('path');
const topojson	= require('topojson');
const shapefile	= require('shapefile');

const gadm_root	= './data/shp/gadm_data/';
const rslt_root	= './public/json/';

const simply_val	= 1e-8;
const quant_val		= 1e4;

function shpToJson(filepath, level, callback) {
	filepath = gadm_root + filepath;
	shapefile.read(filepath, filepath.slice(0, -3) + 'dbf').then(result => {
		callback(_.assign(result, { features: result.features.filter((o) => (!_.isNil(o.properties['CC_' + level]))).map((o) => _.assign(o, { properties: { id: o.properties['CC_' + level], name: o.properties['NAME_' + level], prev: ((level - 1) ? o.properties['NAME_' + (level - 1)] : undefined) }})) }));
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

function subs(level) {
	switch (level) {
		case 1: return 0;
		case 4: return 3;
		default: return level;
	}
}

fs.readdirSync(gadm_root).filter(o => (path.extname(o) == '.shp')).forEach(file => {
	let level		= parseInt(file.slice(-5, -4));
	let filename	= file.slice(0, -4);

	if (level == 1) {
		shpToJson(file, level, geo => { toTopo(level, filename, geo, topo => { writeToFile('0', topo); }); })
	} else {
		shpToJson(file, level, geo => {
			_.chain(geo)
				.get('features', []).map((o) => _.assign(o, { properties: { ...o.properties, prev_id: o.properties.id.slice(0, -subs(level)) } }))
				.groupBy('properties.prev_id')
				.mapValues((o) => ({ type: geo.type, features: o, bbox: geo.bbox }))
				.forEach((o, key) => {
					toTopo(level, filename + '-' + key, o, topo => { writeToFile(key, topo); })
				}).value();
		})
	}
});
