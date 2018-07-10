const _			= require('lodash');
const fs		= require('fs');
const csv 		= require('fast-csv');
const path		= require('path');
const shapefile	= require('shapefile');

const find_ext	= 'shp';
const find_root	= './data/shp/gadm_data/';

const head_pref	= 'CC_';

function recFindByExt(base, ext, files, result) {
    files	= files || fs.readdirSync(base);
    result	= result || [];

    files.forEach(
		function (file) {
			var newbase = path.join(base,file);
            if ( fs.statSync(newbase).isDirectory() ) {
                result = recFindByExt(newbase,ext,fs.readdirSync(newbase),result)
            } else {
                if ( file.substr(-1*(ext.length+1)) == '.' + ext ) {
                    result.push(newbase)
                }
            }
        }
    )
    return result
}

function subs(column) {
	let level	= _.chain(column).last().toInteger().value();

	switch (level) {
		case 1: return 0;
		case 4: return 3;
		default: return level;
	}
}

function shpToJson(path) {
	shapefile.read(path, path.slice(0, -3) + 'dbf').then(result => {
		let filename	= _.chain(path).split('/').last().slice(0, -4).join('').value();
		// let keys		= _.chain(result).get('features[0].properties', {}).keys().value();
		// let suspected	= _.chain(keys).filter((o) => (_.includes(o, head_pref))).sortBy().reverse().head().value();
		// let outname		= suspected ? _.get(result, 'features[0].properties.' + suspected, '').slice(0, -(subs(suspected))) : filename;
		//
		// if (suspected) {
		// 	result.features.map((o) => (_.assign(o, { properties: { id: o.properties[suspected], name: o.properties['NAME_' + _.last(suspected)] } })))
		// }
		//
		// console.log(filename);
		// console.log(outname);

		csv
			.writeToPath('./results/' + filename + '.csv', _.map(result.features, 'properties'), { headers: true })
			.on('finish', () => {  });

	})
}

function main() {
	// let filelist = recFindByExt(find_root, find_ext);

	// shpToJson(filelist[0]);
	recFindByExt(find_root, find_ext).forEach((o) => {
		shpToJson(o);
	})
}

main();
