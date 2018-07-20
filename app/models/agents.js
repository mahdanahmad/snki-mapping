const Model     = require('./model');

const table     = 'agents';
const fillable  = ['prov_id', 'kab_id', 'kec_id', 'desa_id'];
const required  = ['prov_id', 'kab_id', 'kec_id', 'desa_id'];
const preserved	= [];
const hidden	= [];

class Collection extends Model {
	constructor() {
		super(table, fillable, required, preserved, hidden, []);
	}
}

module.exports = new Collection();
