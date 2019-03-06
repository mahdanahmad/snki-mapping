const _			= require('lodash');
const fs		= require('fs');
const csv 		= require('fast-csv');
const path		= require('path');
const topojson	= require('topojson');
const shapefile	= require('shapefile');

const shp_root	= './data/shp/coverage/';
// const rslt_root	= './public/network/';

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

// let geo, topo;
const network_enum	= ['2G', '3G', '4G'];
// fs.readdirSync(shp_root).filter(o => (path.extname(o) == '.shp')).forEach(async file => {
	// console.log(file);
	// geo		= await shpToJson(file);
	// topo	= await toTopo(geo);

	// fs.writeFileSync('./result/' + file.slice(0, 2) + '_geo.json', JSON.stringify(geo), 'utf8');
	// fs.writeFileSync('./result/' + file.slice(0, 2) + '_topo.json', JSON.stringify(await toTopo(geo)), 'utf8');
	// // shpToJson(file, geo => { toTopo(filename, geo, topo => { writeToFile(filename, topo); }); });
	//
	// geo		= null;
	// topo	= null;
// });

// const index		= 1;
const src_root	= './results/networks/';
const suffix	= '_Q3_INT_DIS';

const base		= { type: 'FeatureCollection', bbox: [ 95.01080651990503, -11.00761508896511, 141.01925216185782, 6.0757726872597315 ] }

// fs.readdirSync(src_root).filter(o => (_.includes(o, 'topo.json'))).forEach(async file => {
// 	let topo 		= JSON.parse(await fs.readFileSync(src_root + file));
//
// 	let nets		= file.slice(0, 2);
//
// 	let geometry	= topojson.merge(topo, topo.objects[nets + suffix].geometries);
// 	let features	= [{ type: 'Feature', properties: {}, geometry }]
//
// 	let merged		= await toTopo(Object.assign({}, base, { features }), true);
// 	fs.writeFileSync(src_root + nets + '_merged.json', JSON.stringify(merged), 'utf8');
// });

const i	= 1;
let filepath	= src_root + network_enum[i] + '_topo_cleaned.json';

// fs.readFile(filepath, 'utf8', async(err, raw) => {
// 	if (err) throw err;
// 	console.log('read file');
// 	const topo 		= JSON.parse(raw);
//
// 	let geometry	= topojson.merge(topo, topo.objects[network_enum[i] + suffix].geometries);
// 	console.log('merged');
// 	let features	= [{ type: 'Feature', properties: {}, geometry }]
//
// 	fs.writeFileSync(src_root + network_enum[i] + '_merged_geo.json', JSON.stringify(Object.assign({}, base, { features })), 'utf8');
//
// 	// let merged		= await toTopo(Object.assign({}, base, { features }), true);
// 	// console.log('topo done');
// 	// fs.writeFileSync(src_root + network_enum[i] + '_merged.json', JSON.stringify(merged), 'utf8');
// });

fs.readFile(src_root + '3G_merged_geo.json', 'utf8', async(err, raw) => {
	if (err) throw err;

	const geo	= JSON.parse(raw);
	const topo	= await toTopo(geo);

	fs.writeFileSync(src_root + '3G_from_script.json', JSON.stringify(topo), 'utf8');
});
