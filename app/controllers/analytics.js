const _				= require('lodash');
const async			= require('async');
const moment		= require('moment');

const types			= require('../models/types');
const agents		= require('../models/agents');
const location		= require('../models/location');

module.exports.distribution	= (input, callback) => {
	let response        = 'OK';
	let status_code     = 200;
	let message         = 'Get distribution data success.';
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
			flowCallback();
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
};;
