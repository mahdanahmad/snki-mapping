const Model     = require('./model');

const table     = 'types';
const fillable  = ['type', 'color'];
const required  = ['type', 'color'];
const preserved	= [];
const hidden	= [];

class Collection extends Model {
	constructor() {
		super(table, fillable, required, preserved, hidden, []);
	}
}

module.exports = new Collection();
