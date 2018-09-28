const _				= require('lodash');
const async			= require('async');
const moment		= require('moment');

const types			= require('../models/types');
const agents		= require('../models/agents');
const location		= require('../models/location');

const filt_field	= 'access_point_type';

module.exports.distribution	= (input, callback) => {
	let response        = 'OK';
	let status_code     = 200;
	let message         = 'Get distribution data success.';
	let result          = null;

	const type_state	= ['group', 'types'];

	const province_id	= (input.prov	|| null);
	const kabupaten_id	= (input.kab	|| null);
	const kecamatan_id	= (input.kec	|| null);
	const desa_id		= (input.desa	|| null);
	const layer			= (input.layer	|| _.first(layers));

	const filter		= input.filter ? JSON.parse(input.filter) : null;

	const type			= _.includes(type_state, input.type) ? _.indexOf(type_state, input.type) : 0;

	const states		= ['province_id', 'kabupaten_id', 'kecamatan_id', 'desa_id'];
	const keys			= ['national', 'prov', 'kab', 'kec', 'desa'];

	async.waterfall([
		(flowCallback) => {
			if (type) {
				flowCallback(null, null);
			} else {
				types.findAll({}, {}, (err, result) => flowCallback(err, _.chain(result).groupBy('group').mapValues((o) => (_.map(o, 'type'))).value()));
			}
		},
		(mappedTypes, flowCallback) => {
			let match	= _.omitBy({ province_id, kabupaten_id, kecamatan_id, desa_id }, _.isNil);
			if (filter) { match[filt_field] = { '$in': filter }; }

			let group	= type ? { _id: '$' + filt_field, sum: { $sum: 1 } } : { _id: { $cond: [{ '$in' : [ '$' + filt_field, mappedTypes.FAP ] }, 'FAP', 'PAP'] }, sum: { $sum: 1 } };

			agents.rawAggregate([
				{ '$match': match },
				{ '$group': group }
			], {}, (err, data) => {
				flowCallback(err, data);
			});
		},
		(data, flowCallback) => {
			let total	= _.sumBy(data, 'sum');
			if (type) {
				flowCallback(null, { data, total });
			} else {
				let match	= _.omitBy({ province_id, kabupaten_id, kecamatan_id, desa_id }, _.isNil);

				async.mapValues(_.chain(_.size(match)).times((o) => ([keys[o], _.pick(match, states.slice(0, o))])).fromPairs().value(), (query, key, mapCallback) => {
					if (filter) { query[filt_field] = { '$in': filter }; }

					agents.count(query, (err, result) => mapCallback(err, result));
				}, (err, results) => {
					flowCallback(null, { data, total, represent: _.mapValues(results, (o) => (_.round(total / o * 100, 2)) + '%') });
				})
				// flowCallback(null, { data: temp });
			}
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
};;
