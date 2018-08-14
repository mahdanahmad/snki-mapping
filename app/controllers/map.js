const _				= require('lodash');
const async			= require('async');
const moment		= require('moment');

const types			= require('../models/types');
const agents		= require('../models/agents');

module.exports.index	= (input, callback) => {
	let response        = 'OK';
	let status_code     = 200;
	let message         = 'Get map data success.';
	let result          = null;

	const province_id	= (input.prov	|| null);
	const kabupaten_id	= (input.kab	|| null);
	const kecamatan_id	= (input.kec	|| null);
	const desa_id		= (input.desa	|| null);

	const states		= ['province_id', 'kabupaten_id', 'kecamatan_id', 'desa_id'];

	async.waterfall([
		(flowCallback) => {
			let match	= _.omitBy({ province_id, kabupaten_id, kecamatan_id, desa_id }, _.isNil);
			let active	= _.chain({ province_id, kabupaten_id, kecamatan_id, desa_id }).omitBy(_.isNil).keys().last().value();

			if (_.last(states) !== active) {
				agents.rawAggregate([
					{ '$match': match },
					{ '$group': { _id: '$' + states[states.indexOf(active) + 1], size: { $sum: 1 } } },
					{ '$match': { _id: { $ne: null } } }
				], {}, (err, result) => flowCallback(err, result));
			} else {
				agents.rawAggregate([
					{ '$match': match },
					{ '$project': { _id: 1, long: '$longitude', lat: '$latitude' } }
				], {}, (err, result) => flowCallback(err, result.map((o) => _.assign(o, { color: '#fa5c18' }))));
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
