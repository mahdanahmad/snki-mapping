const _				= require('lodash');
const async			= require('async');
const moment		= require('moment');

const agents		= require('../models/agents');

module.exports.index	= (input, callback) => {
	let response        = 'OK';
	let status_code     = 200;
	let message         = 'Get map data success.';
	let result          = null;

	const prov_id		= (input.prov	|| null);
	const kab_id		= (input.kab	|| null);
	const kec_id		= (input.kec	|| null);

	const states		= ['prov_id', 'kab_id', 'kec_id', 'desa_id'];

	async.waterfall([
		(flowCallback) => {
			let match	= _.omitBy({ prov_id, kab_id, kec_id }, _.isNil);
			let active	= _.chain({ prov_id, kab_id, kec_id }).omitBy(_.isNil).keys().last().value();

			agents.rawAggregate([
				{ '$match': match },
				{ '$group': { _id: '$' + states[states.indexOf(active) + 1], size: { $sum: 1 } } },
				{ '$match': { _id: { $ne: null } } }
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
