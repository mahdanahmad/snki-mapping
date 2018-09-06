let baseUrl	= 'api';

function getMapData(callback) { $.get(baseUrl + '/map', constructParams(), ( data ) => { callback(null, data.result); }) }
function getLocation(callback) { $.get(baseUrl + '/location', constructParams(), ( data ) => { callback(null, data.result); }) }
function getTypes(callback) { $.get(baseUrl + '/types', ( data ) => { callback(null, data.result); }) }

// HELPER
function constructParams() {
	let checked	= $( filter_target + ' > ul > li > input:checked' ).map(function() { return $( this ).attr('value'); }).get()
	let filter	= !_.isEmpty(checked) ? JSON.stringify(checked) : null;
	
	return _.chain({}).assign(centered, { filter }).omitBy(_.isNil).value()
};
