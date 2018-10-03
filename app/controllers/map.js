const _				= require('lodash');
const async			= require('async');
const moment		= require('moment');

const types			= require('../models/types');
const agents		= require('../models/agents');
const location		= require('../models/location');

// const pallete		= ['#99d0ec', '#38a8e2', '#0085ce', '#00659d', '#004e79'];
const pallete		= ['#004e79', '#00659d', '#0085ce', '#38a8e2', '#99d0ec'];

const filt_field	= 'access_point_type';
const pop_field		= 'potential_population';
const head_count	= 1000;

const layers		= ['Number of FAP', 'Access Point Per 1000 Adults', 'Driving Time From FAPs'];

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

			switch (layer) {
				case layers[0]:
					if (!_.includes(states.slice(-2), active)) {
						agents.rawAggregate([
							{ '$match': match },
							{ '$group': { _id: '$' + states[states.indexOf(active) + 1], size: { $sum: 1 } } },
							{ '$match': { _id: { $ne: null } } }
						], {}, (err, data) => {
							console.log(data);
							let max		= _.chain(data).maxBy('size').get('size', 0).value();

							let rounded	= 0;
							if (max <= 10) { rounded = 10; } else {
								let inStr	= Math.round(max).toString();
								let length	= inStr.length - 1;
								rounded		= Math.ceil(parseInt(inStr) / Math.pow(10, length)) * Math.pow(10, length);
							}

							const range		= rounded / 5;
							const fracture 	= _.range(0, rounded, range).reverse();

							data.map((row) => {
								let color	= '';
								fracture.forEach((o, i) => { if (row.size >= o && _.isEmpty(color)) { color = pallete[i]; } });

								_.assign(row, { color });
							});

							flowCallback(err, { data, legend: fracture.map((o, i) => ({ text: o + ' - ' + (o + range), color: pallete[i] })).concat([{ text: 'No data', color: '#FAFAF8' }]).reverse() });
						});
					} else {
						types.findAll({}, {}, (err, alltypes) => {
							if (err) { flowCallback(err); } else {
								const mapped	= _.chain(alltypes).map((o) => ([o.type, o.color])).fromPairs().value();
								agents.rawAggregate([
									{ '$match': match },
									{ '$project': { _id: 1, long: '$longitude', lat: '$latitude', type: '$' + filt_field } }
								], {}, (err, result) => flowCallback(err, { data: result.map((o) => _.assign(o, { color: mapped[o.type] })), legend: alltypes.filter((o) => (_.chain(result).map('type').uniq().includes(o.type).value())).map((o) => ({ text: o.type.length > 15 ? (o.type.substring(0, 13) + '...') : o.type, color: o.color }))  }));
							}
						})
					}
					break;
				case layers[1]:
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

							let max			= _.chain(data).maxBy('capita').get('capita', 0).ceil().value();

							const range		= _.ceil(max / 5);
							const fracture 	= _.range(0, (range * 5), range).reverse().map((o) => (_.round(o, 2)));

							data.map((row) => {
								let color	= '';
								fracture.forEach((o, i) => { if (row.capita >= o && _.isEmpty(color)) { color = pallete[i]; } });

								_.assign(row, { color });
							});

							flowCallback(err, { data, legend: fracture.map((o, i) => ({ text: o + ' - ' + _.round(o + range, 2), color: pallete[i] })).concat([{ text: 'No data', color: '#FAFAF8' }]).reverse() });
						});
					});
					break;
				case layers[2]:
					match	= _.omit(match, [filt_field]);
					if (_.includes(states.slice(-2), active)) {
						types.findAll({}, {}, (err, alltypes) => {
							if (err) { flowCallback(err); } else {
								const mapped	= _.chain(alltypes).map((o) => ([o.type, o.color])).fromPairs().value();
								agents.rawAggregate([
									{ '$match': match },
									{ '$project': { _id: 1, long: '$longitude', lat: '$latitude', type: '$' + filt_field } }
								], {}, (err, result) => flowCallback(err, { data: result.map((o) => _.assign(o, { color: mapped[o.type] })), legend: alltypes.filter((o) => (_.chain(result).map('type').uniq().includes(o.type).value())).map((o) => ({ text: o.type.length > 15 ? (o.type.substring(0, 13) + '...') : o.type, color: o.color }))  }));
							}
						})
					} else {
						flowCallback();
					}
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
	let message         = 'Get location data success.';
	let result          = null;

	async.waterfall([
		(flowCallback) => {
			agents.distinct(filt_field, {}, (err, result) => flowCallback(err, result));
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
