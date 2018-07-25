const _				= require('lodash');
const async			= require('async');
const moment		= require('moment');

const agents		= require('../models/agents');

const palette		= {
	"ATM" : '#fa5c18',
	"Kantor Cabang" : '#ffd881',
	"Kantor Cabang Pembantu" : '#edd5cd',
	"Kantor Kas" : '#d97b7a',
	"Kantor Pusat Operasional" : '#7189bf',
	"Kantor Pusat Non Operasional" : '#72eaf5',
}

module.exports.index	= (input, callback) => {
	let response        = 'OK';
	let status_code     = 200;
	let message         = 'Get map data success.';
	let result          = null;

	const prov_id		= (input.prov	|| null);
	const kab_id		= (input.kab	|| null);
	const kec_id		= (input.kec	|| null);
	const desa_id		= (input.desa	|| null);

	const states		= ['prov_id', 'kab_id', 'kec_id', 'desa_id'];

	async.waterfall([
		(flowCallback) => {
			let match	= _.omitBy({ prov_id, kab_id, kec_id, desa_id }, _.isNil);
			let active	= _.chain({ prov_id, kab_id, kec_id, desa_id }).omitBy(_.isNil).keys().last().value();

			if (_.last(states) !== active) {
				agents.rawAggregate([
					{ '$match': match },
					{ '$group': { _id: '$' + states[states.indexOf(active) + 1], size: { $sum: 1 } } },
					{ '$match': { _id: { $ne: null } } }
				], {}, (err, result) => flowCallback(err, result));
			} else {
				agents.rawAggregate([
					{ '$match': match },
					{ '$project': { type: '$FAP Type', long: '$xcoord', lat: '$ycoord' } }
				], {}, (err, result) => flowCallback(err, result.map((o) => _.assign(o, { color: palette[o.type] || null }))));
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
