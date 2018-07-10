const MongoDB		= require('mongodb');

const MongoClient	= MongoDB.MongoClient;
const ObjectID		= MongoDB.ObjectID;

const state 	= { db: null };

exports.connect = (url, database, callback) => {
	if (state.db) return callback();

	MongoClient.connect(url, (err, client) => {
		if (err) return callback(err);
		state.db    = client.db(database);

		callback();
	});
};

exports.close = (callback) => {
	if (state.db) {
		state.db.close((err, result) => {
			state.db = null;
			state.mode = null;
			callback(err);
		});
	}
};

exports.get 			= () => (state.db);
exports.isObjectID      = (stringID) => (ObjectID.isValid(stringID));
exports.toObjectID      = (stringID) => (ObjectID.isValid(stringID) ? new ObjectID(stringID) : null);
exports.getCollection   = (table) => (state.db.collection(table));
