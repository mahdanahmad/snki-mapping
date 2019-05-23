const _				= require('lodash');
const async			= require('async');

const types			= require('../models/types');
const agents		= require('../models/agents');
const location		= require('../models/location');

// const pallete		= ['#99d0ec', '#38a8e2', '#0085ce', '#00659d', '#004e79'];
const pallete		= ['#004e79', '#00659d', '#0085ce', '#38a8e2', '#99d0ec'];

const filt_field	= 'access_point_type';
const pop_field		= 'potential_population';
const lit_field		= 'literacy_level';
const povrt_field	= 'poverty_percent';
const electr_field	= 'electricty_percent';
const inclus_field	= 'financial_inclusion_total';
const head_count	= 1000;

const layers		= ['Number of Access Point', 'Adult Population', 'Access Point Per 1000 Adults', 'Driving Time From Access Points', 'Percentage of Financial Inclusion', 'Poverty Line', 'Electricity', 'Literacy'];

const nodata_clr	= '#FAFAF8';

module.exports.index	= (input, callback) => {
	let response        = 'OK';
	let status_code     = 200;
	let message         = 'Get map data success.';
	let result          = null;

	const province_id	= (input.prov	|| null);
	const kabupaten_id	= (input.kab	|| null);
	const kecamatan_id	= (input.kec	|| null);
	const desa_id		= (input.desa	|| null);
	const layer			= (input.layer	|| _.first(layers));

	const filter		= input.filter ? JSON.parse(input.filter) : null;

	const states		= ['province_id', 'kabupaten_id', 'kecamatan_id', 'desa_id'];

	async.waterfall([
		(flowCallback) => {
			let match	= _.omitBy({ province_id, kabupaten_id, kecamatan_id, desa_id }, _.isNil);
			if (filter) { match[filt_field] = { '$in': filter }; }

			let active	= _.chain({ province_id, kabupaten_id, kecamatan_id, desa_id }).omitBy(_.isNil).keys().last().value();
			let parent	= _.chain({ province_id, kabupaten_id, kecamatan_id, desa_id }).omitBy(_.isNil).map().last().value() || null;

			switch (layer) {
				// Number of Access Point
				case layers[0]:
					agents.rawAggregate([
						{ '$match': match },
						{ '$group': { _id: '$' + states[states.indexOf(active) + 1], size: { $sum: 1 } } },
						{ '$match': { _id: { $ne: null } } }
					], {}, (err, data) => {
						setColor(data, 'size', true).then((result) => {
							flowCallback(err, { data: result.data, legend: result.fracture.map((o, i) => ({ text: o + ' - ' + (o + result.range), color: pallete[i] })).concat([{ text: 'No data', color: nodata_clr }]).reverse() });
						});
					});
					break;
				// Adult Population
				case layers[1]:
					location.rawAggregate([
						{ '$match': { parent, id: { '$ne': '' } } },
						{ '$project': { _id: '$id', size: '$' + pop_field,  } }
					], {}, (err, data) => {
						if (err) { flowCallback(err); } else {
							setColor(data, 'size', true).then((result) => {
								flowCallback(err, { data: result.data, legend: result.fracture.map((o, i) => ({ text: nFormatter(o) + ' - ' + nFormatter(o + result.range), color: pallete[i] })).concat([{ text: 'No data', color: nodata_clr }]).reverse() });
							});
						}
					});
					break;
				// Access Point Per 1000 Adults
				case layers[2]:
					agents.rawAggregate([
						{ '$match': match },
						{ '$group': { _id: '$' + states[states.indexOf(active) + 1], size: { $sum: 1 } } },
						{ '$match': { _id: { $ne: null } } }
					], {}, (err, ap_count) => {
						let query	= { id: { '$in': _.map(ap_count, '_id') }};
						query[pop_field]	= { '$ne': null };

						location.rawAggregate([
							{ '$match': query },
							{ '$project': { _id: '$id', count: { '$divide': ['$' + pop_field, head_count] } } }
						], {}, (err, loc) => {
							const mapped	= _.chain(ap_count).map(o => ([o._id, o.size])).fromPairs().value();
							let data		= loc.map((o) => (_.assign(o, { size: mapped[o._id], capita: _.round(mapped[o._id] / o.count, 2) })))

							setColor(data, 'capita', false, true).then((result) => {
								flowCallback(err, { data: result.data, legend: result.fracture.map((o, i) => ({ text: o + ' - ' + _.round(o + result.range, 2), color: pallete[i] })).concat([{ text: 'No data', color: nodata_clr }]).reverse() });
							});
						});
					});
					break;
				// Driving Time From Access Points
				case layers[3]:
					match	= _.omit(match, [filt_field]);
					if (_.includes(states.slice(-2), active)) {
						types.findAll({}, {}, (err, alltypes) => {
							if (err) { flowCallback(err); } else {
								const mapped	= _.chain(alltypes).map((o) => ([o.type, { color: o.color, shape: o.shape }])).fromPairs().value();
								agents.rawAggregate([
									{ '$match': match },
									{ '$project': { _id: 1, long: '$longitude', lat: '$latitude', type: '$' + filt_field } }
								], {}, (err, result) => flowCallback(err, { data: result.map((o) => _.assign(o, mapped[o.type])), legend: alltypes.filter((o) => (_.chain(result).map('type').uniq().includes(o.type).value())).map((o) => ({ text: o.type.length > 15 ? (o.type.substring(0, 13) + '...') : o.type, color: o.color, shape: o.shape }))  }));
							}
						})
					} else {
						flowCallback();
					}
					break;
				// Percentage of Financial Inclusion
				case layers[4]:
					location.rawAggregate([
						{ '$match': { parent, id: { '$ne': '' } } },
						{ '$project': { _id: '$id', size: '$' + inclus_field,  } }
					], {}, (err, loc) => {
						if (err) { flowCallback(err); } else {
							let data = loc.map(o => ({ _id: o._id, size: o.size ? parseFloat(o.size.replace(',', '.')) : null }))
							setColor(data, 'size', true).then((result) => {
								flowCallback(err, { data: result.data, legend: result.fracture.map((o, i) => ({ text: nFormatter(o) + ' - ' + nFormatter(o + result.range), color: pallete[i] })).concat([{ text: 'No data', color: nodata_clr }]).reverse() });
							});
						}
					});
					break;
				// Poverty Line
				case layers[5]:
					location.rawAggregate([
						{ '$match': { parent, id: { '$ne': '' } } },
						{ '$project': { _id: '$id', size: '$' + povrt_field,  } }
					], {}, (err, loc) => {
						if (err) { flowCallback(err); } else {
							let data = loc.map(o => ({ _id: o._id, size: o.size ? parseFloat(o.size.replace(',', '.')) : null }))
							setColor(data, 'size', true).then((result) => {
								flowCallback(err, { data: result.data, legend: result.fracture.map((o, i) => ({ text: nFormatter(o) + ' - ' + nFormatter(o + result.range), color: pallete[i] })).concat([{ text: 'No data', color: nodata_clr }]).reverse() });
							});
						}
					});
					break;
				// Electricity
				case layers[6]:
					location.rawAggregate([
						{ '$match': { parent, id: { '$ne': '' } } },
						{ '$project': { _id: '$id', size: '$' + electr_field,  } }
					], {}, (err, loc) => {
						if (err) { flowCallback(err); } else {
							let data = loc.map(o => ({ _id: o._id, size: o.size ? parseFloat(o.size.replace(',', '.')) : null }))
							setColor(data, 'size', true).then((result) => {
								flowCallback(err, { data: result.data, legend: result.fracture.map((o, i) => ({ text: nFormatter(o) + ' - ' + nFormatter(o + result.range), color: pallete[i] })).concat([{ text: 'No data', color: nodata_clr }]).reverse() });
							});
						}
					});
					break;
				// Literacy
				case layers[7]:
					location.rawAggregate([
						{ '$match': { parent, id: { '$ne': '' } } },
						{ '$project': { _id: '$id', size: '$' + lit_field,  } }
					], {}, (err, loc) => {
						if (err) { flowCallback(err); } else {
							let data = loc.map(o => ({ _id: o._id, size: o.size ? parseFloat(o.size.replace(',', '.')) : null }))
							setColor(data, 'size', true).then((result) => {
								flowCallback(err, { data: result.data, legend: result.fracture.map((o, i) => ({ text: nFormatter(o) + ' - ' + nFormatter(o + result.range), color: pallete[i] })).concat([{ text: 'No data', color: nodata_clr }]).reverse() });
							});
						}
					});
					break;
				default:
					flowCallback('Lights on, and everybody go home.');
			}
		},
	], (err, asyncResult) => {
		if (err) {
			response    = 'FAILED';
			status_code = 400;
			message     = err;
		} else {
			result      = asyncResult;
		}
		callback({ response, status_code, message, result });
	});
};

module.exports.location	= (input, callback) => {
	let response        = 'OK';
	let status_code     = 200;
	let message         = 'Get location data success.';
	let result          = null;

	let parent			= null;
	if (input.kec) { parent = input.kec }
	else if (input.kab) { parent = input.kab }
	else if (input.prov) { parent = input.prov }

	async.waterfall([
		(flowCallback) => {
			location.rawAggregate([
				{ '$match': { parent, id: { '$ne': '' } } },
				{ '$project': { _id: 0, id: 1, name: 1 }},
				{ '$sort': { id: 1 }}
			], {}, (err, result) => flowCallback(err, result));
		},
	], (err, asyncResult) => {
		if (err) {
			response    = 'FAILED';
			status_code = 400;
			message     = err;
		} else {
			result      = asyncResult;
		}
		callback({ response, status_code, message, result });
	});
};

module.exports.types	= (callback) => {
	let response        = 'OK';
	let status_code     = 200;
	let message         = 'Get type data success.';
	let result          = null;

	async.waterfall([
		(flowCallback) => {
			// agents.distinct(filt_field, {}, (err, result) => flowCallback(err, result));
			types.findAll({}, {}, (err, result) => flowCallback(err, result.map((o) => ({ type: o.type, group: o.group, lang: [o.en, o.id] }))));
		},
	], (err, asyncResult) => {
		if (err) {
			response    = 'FAILED';
			status_code = 400;
			message     = err;
		} else {
			result      = asyncResult;
		}
		callback({ response, status_code, message, result });
	});
}

module.exports.points	= (input, callback) => {
	let response        = 'OK';
	let status_code     = 200;
	let message         = 'Get map data success.';
	let result          = null;

	const province_id	= (input.prov	|| null);
	const kabupaten_id	= (input.kab	|| null);
	const kecamatan_id	= (input.kec	|| null);
	const desa_id		= (input.desa	|| null);
	const layer			= (input.layer	|| _.last(layers));

	const filter		= input.filter	? JSON.parse(input.filter)	: null;
	const lang			= input.lang	? input.lang				: null;
	const legend		= input.legend	? input.legend				: null;

	const states		= ['province_id', 'kabupaten_id', 'kecamatan_id', 'desa_id'];

	async.waterfall([
		(flowCallback) => {
			let match	= _.omitBy({ province_id, kabupaten_id, kecamatan_id, desa_id }, _.isNil);
			if (filter && (layer !== _.last(layers))) { match[filt_field] = { '$in': filter }; }

			if (legend !== 'only') {
				agents.rawAggregate([
					{ '$match': match },
					{ '$project': { _id: 1, long: '$longitude', lat: '$latitude', type: '$' + filt_field } }
				], {}, (err, foundAgents) => flowCallback(err, foundAgents, _.chain(foundAgents).map('type').uniq().value()));
			} else {
				agents.distinct(filt_field, match, (err, result) => flowCallback(err, [], result));
			}
		},
		(data, inTypes, flowCallback) => {
			types.rawAggregate([
				{ '$match': { 'type': { '$in': inTypes } } },
				{ '$project': { _id: 0, 'type': 1, 'color': 1, 'shape': 1, 'name': '$' + lang } }
			], {}, (err, foundTypes) => {
				if (err) { flowCallback(err); } else {
					const mapped	= _.chain(foundTypes).map((o) => ([o.type, { color: o.color, shape: o.shape }])).fromPairs().value();
					flowCallback(null, { data: data.map((o) => _.assign(o, mapped[o.type])), legend: foundTypes.map(o => ({ text: (o.name || o.type).length > 15 ? ((o.name || o.type).substring(0, 13) + '...') : (o.name || o.type), color: o.color, shape: o.shape })) });
				}
			});
		}
	], (err, asyncResult) => {
		if (err) {
			response    = 'FAILED';
			status_code = 400;
			message     = err;
		} else {
			result      = asyncResult;
		}
		callback({ response, status_code, message, result });
	});
};

function nFormatter(num) {
	let digits	= 2;
	let standar = [
		{ value: 1, symbol: "" },
		{ value: 1E3, symbol: "k" },
		{ value: 1E6, symbol: "M" },
		{ value: 1E9, symbol: "G" },
		{ value: 1E12, symbol: "T" },
		{ value: 1E15, symbol: "P" },
		{ value: 1E18, symbol: "E" }
	];
	let re = /\.0+$|(\.[0-9]*[1-9])0+$/;
	let i;
	for (i = standar.length - 1; i > 0; i--) { if (num >= standar[i].value) { break; } }
	return (num / standar[i].value).toFixed(digits).replace(re, "$1") + '' + standar[i].symbol;
}

function setColor(data, maxBy, rounded, ceiling) {
	return new Promise((resolve, reject) => {
		let max		= _.chain(data).maxBy(maxBy).get(maxBy, 0).value();

		let base	= 0;
		if (rounded) {
			if (max <= 10) { base = 10; } else {
				let inStr	= Math.round(max).toString();
				let length	= inStr.length - 1;
				base		= _.ceil(max, -length);
			}
		} else {
			base = _.ceil(max);
		}

		let range		= base / 5;
		let fracture;
		if (ceiling) {
			range		= _.ceil(range);
			fracture 	= _.range(0, (range * 5), range).reverse().map((o) => (_.round(o, 2)));
		} else {
			fracture 	= _.range(0, base, range).reverse();
		}

		data.map((row) => {
			let color	= '';
			if (_.isNil(row.size)) { color = nodata_clr; } else {
				fracture.forEach((o, i) => { if (row.size >= o && _.isEmpty(color)) { color = pallete[i]; } });
			}

			_.assign(row, { color });
		});

		resolve({ data, fracture, range });
	});
}
