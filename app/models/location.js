const Model     = require('./model');

const table     = 'location';
const fillable  = ['id', 'name', 'parent', 'types'];
const required  = ['id', 'name', 'parent', 'types'];
const preserved	= [];
const hidden	= [];

class Collection extends Model {
	constructor() {
		super(table, fillable, required, preserved, hidden, []);
	}
}

module.exports = new Collection();
