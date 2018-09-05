let baseUrl	= 'api';

function getMapData(callback) { $.get(baseUrl + '/map', constructParams(), ( data ) => { callback(null, data.result); }) }
function getLocation(callback) { $.get(baseUrl + '/location', constructParams(), ( data ) => { callback(null, data.result); }) }

// HELPER
function constructParams() { return _.chain({}).assign(centered).omitBy(_.isNil).value() };
