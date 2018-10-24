const _				= require('lodash');
const async			= require('async');

const types			= require('../models/types');
const agents		= require('../models/agents');
const location		= require('../models/location');

const filt_field	= 'access_point_type';
const pop_field		= 'potential_population';
const head_count	= 1000;

const layers		= ['Number of Access Point', 'Adult Population', 'Access Point Per 1000 Adults', 'Driving Time From Access Points'];

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
				types.rawAggregate([
					{ '$match': { 'type': { '$in': data.map((o) => o._id) } } },
					{ '$project': { _id: 0, 'type': 1, 'color': 1, 'shape': 1 } }
				], {}, (err, result) => {
					if (err) { flowCallback(err); } else {
						let mapped	= _.chain(result).map((o) => ([o.type, _.omit(o, 'type')])).fromPairs().value();
						flowCallback(null, { data: data.map((o) => (_.assign(o, mapped[o._id]))), total })
					}
				});
			} else {
				let match	= _.omitBy({ province_id, kabupaten_id, kecamatan_id, desa_id }, _.isNil);

				async.mapValues(_.chain(_.size(match)).times((o) => ([keys[o], _.pick(match, states.slice(0, o))])).fromPairs().value(), (query, key, mapCallback) => {
					if (filter) { query[filt_field] = { '$in': filter }; }

					agents.count(query, (err, result) => mapCallback(err, result));
				}, (err, results) => {
					flowCallback(null, { data, total, represent: _.mapValues(results, (o) => (_.round(total / o * 100, 2)) + '%') });
				})
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
};

module.exports.network	= (input, callback) => {
	let response        = 'OK';
	let status_code     = 200;
	let message         = 'Get network data success.';
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

	async.waterfall([
		(flowCallback) => {
			let match	= _.omitBy({ province_id, kabupaten_id, kecamatan_id, desa_id }, _.isNil);
			if (filter) { match[filt_field] = { '$in': filter }; }

			agents.rawAggregate([
				{ '$match': match },
				{ '$group': { '_id': null, '2G' : { '$sum': '$2_g' }, '3G' : { '$sum': '$3_g' }, '4G' : { '$sum' : '$4_g' }, 'total' : { '$sum' : 1 } } },
			], {}, (err, result) => {
				flowCallback(err, { data: _.chain(result[0]).omit(['_id', 'total']).map((size, id) => ({ id, size })).sortBy('id').value(), total: (result[0] ? result[0].total : 0) });
			});
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

module.exports.pupulation	= (input, callback) => {
	let response        = 'OK';
	let status_code     = 200;
	let message         = 'Get pupulation data success.';
	let result          = null;

	const province_id	= (input.prov	|| null);
	const kabupaten_id	= (input.kab	|| null);
	const kecamatan_id	= (input.kec	|| null);
	const desa_id		= (input.desa	|| null);
	const layer			= (input.layer	|| _.first(layers));

	const filter		= input.filter ? JSON.parse(input.filter) : null;

	const states		= ['province_id', 'kabupaten_id', 'kecamatan_id', 'desa_id'];

	let parent			= _.chain({ province_id, kabupaten_id, kecamatan_id, desa_id }).omitBy(_.isNil).map().last().value() || null;

	async.waterfall([
		(flowCallback) => {
			location.rawAggregate([
				{ '$match': { parent, id: { '$ne': '' } } },
				{ '$project': { potential_population: 1, name: 1, id: 1, _id: 0 } }
			], {}, (err, result) => flowCallback(err, result));
		},
		(loc_below, flowCallback) => {
			if (layer == layers[1]) {
				flowCallback(null, _.chain(loc_below).map((o) => ({ id: o.id, name: o.name, size: o.potential_population })).orderBy(['size'], ['asc']).value());
			} else {
				let match	= _.omitBy({ province_id, kabupaten_id, kecamatan_id, desa_id }, _.isNil);
				if (filter) { match[filt_field] = { '$in': filter }; }

				let active	= _.chain({ province_id, kabupaten_id, kecamatan_id, desa_id }).omitBy(_.isNil).keys().last().value();

				agents.rawAggregate([
					{ '$match': match },
					{ '$group': { _id: '$' + states[states.indexOf(active) + 1], size: { $sum: 1 } } },
					{ '$match': { _id: { $ne: null } } }
				], {}, (err, ap_count) => {
					const mapped_ap	= _.chain(ap_count).map((o) => ([o._id, o.size])).fromPairs().value();

					flowCallback(err, _.chain(loc_below).map((o) => {
						let ap_count	= (mapped_ap[o.id] || 0);
						let size		= (ap_count ? _.round(ap_count / (o[pop_field] / head_count), 2) : 0);

						return (_.assign(o, { ap_count, size }));
					}).orderBy(['size', 'ap_count'], ['asc', 'asc']).value());
				});
			}
		},
		(data, flowCallback) => {
			location.findOne({id: parent}, (err, result) => flowCallback(null, { data, details: _.chain(result).omit(['_id', 'parent']).assign({ total: _.sumBy(data, 'ap_count') }).value() }));
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

module.exports.proximity	= (input, callback) => {
	let response        = 'OK';
	let status_code     = 200;
	let message         = 'Get proximity data success.';
	let result          = null;

	const province_id	= (input.prov	|| null);
	const kabupaten_id	= (input.kab	|| null);
	const kecamatan_id	= (input.kec	|| null);
	const desa_id		= (input.desa	|| null);

	const filter		= input.filter ? JSON.parse(input.filter) : null;

	const states		= ['province_id', 'kabupaten_id', 'kecamatan_id', 'desa_id'];

	let id				= _.chain({ province_id, kabupaten_id, kecamatan_id, desa_id }).omitBy(_.isNil).map().last().value() || null;
	// let id				= '5206071';

	async.waterfall([
		(flowCallback) => {
			location.rawAggregate([
				{ '$match': { id } },
				{ '$project': { '0_5': 1, '5_15': 1, '15_30': 1, '>30': 1, _id: 0 } }
			], {}, (err, result) => flowCallback(err, {
				'name': 'treemap',
				'children': _.map(result[0], (size, key) => ({ name: _.chain(key).split('_').join(' - ').value() + ' minutes', size, key }))
			}));
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
