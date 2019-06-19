let baseUrl	= 'api';

function getMapData(callback) { $.get(baseUrl + '/map', constructParams(), ( data ) => { callback(null, data.result); }) }
function getLocation(callback) { $.get(baseUrl + '/location', constructParams(), ( data ) => { callback(null, data.result); }) }
function getTypes(callback) { $.get(baseUrl + '/types', ( data ) => { callback(null, data.result); }) }
function getPoints(callback, legend=false) { $.get(baseUrl + '/points', _.assign({ legend: (legend ? 'only' : '') }, constructParams()), ( data ) => { callback(null, data.result); }) }

function getDistribution(callback, type='') { $.get(baseUrl + '/distribution', _.assign({ type }, constructParams()), ( data ) => { callback(null, data.result); }) }
function getNetwork(callback) { $.get(baseUrl + '/network', constructParams(), ( data ) => { callback(null, data.result); }) }
function getPopulation(callback) { $.get(baseUrl + '/population', constructParams(), ( data ) => { callback(null, data.result); }) }
function getProximity(callback) { $.get(baseUrl + '/proximity', constructParams(), ( data ) => { callback(null, data.result); }) }

// HELPER
function constructParams() {
	let checked		= $( filter_target + ' > ul > li > input:checked' ).map(function() { return $( this ).attr('value'); }).get()
	let filter		= !_.isNil(checked) ? JSON.stringify(checked) : null;
	let layer		= $( base_target + ' > ul > li > input:checked' ).map(function() { return $( this ).attr('value'); }).get()[0];
	let population	= $( pops_target + ' > ul > li > input:checked' ).map(function() { return $( this ).attr('value'); }).get()[0];

	console.log(_.chain({}).assign(centered, { filter, layer, population, lang: lang_enum[lang] }).omitBy(_.isNil).value());

	return _.chain({}).assign(centered, { filter, layer, population, lang: lang_enum[lang] }).omitBy(_.isNil).value()
};
