const Model     = require('./model');

const table     = 'agents';
const fillable  = ['province_id', 'kabupaten_id', 'kecamatan_id', 'desa_id', 'longitude', 'latitude', 'access_point_type', 'access_point_id'];
const required  = ['province_id', 'kabupaten_id', 'kecamatan_id', 'desa_id', 'longitude', 'latitude', 'access_point_type', 'access_point_id'];
const preserved	= [];
const hidden	= [];

class Collection extends Model {
	constructor() {
		super(table, fillable, required, preserved, hidden, []);
	}
}

module.exports = new Collection();
