let baseUrl	= 'api';

function getMapData(callback) { $.get(baseUrl + '/map', constructParams(), ( data ) => { callback(null, data.result); }) }
function getLocation(callback) { $.get(baseUrl + '/location', constructParams(), ( data ) => { callback(null, data.result); }) }
function getTypes(callback) { $.get(baseUrl + '/types', ( data ) => { callback(null, data.result); }) }

function getDistribution(callback, type='') { $.get(baseUrl + '/distribution', _.assign({ type }, constructParams()), ( data ) => { callback(null, data.result); }) }
function getPopulation(callback) { $.get(baseUrl + '/population', constructParams(), ( data ) => { callback(null, data.result); }) }
function getProximity(callback) { $.get(baseUrl + '/proximity', constructParams(), ( data ) => { callback(null, data.result); }) }

// HELPER
function constructParams() {
	let checked	= $( filter_target + ' > ul > li > input:checked' ).map(function() { return $( this ).attr('value'); }).get()
	let filter	= !_.isNil(checked) ? JSON.stringify(checked) : null;
	let layer	= $( base_target + ' > ul > li > input:checked' ).map(function() { return $( this ).attr('value'); }).get()[0];

	return _.chain({}).assign(centered, { filter, layer }).omitBy(_.isNil).value()
};
