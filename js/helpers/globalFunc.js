Number.prototype.toRadians = function() { return this * Math.PI / 180; }

const earth_rad	= 6371e3; // metres

// [lat, lon]
function haversine(first, second, callback) {
	let φ1 = first[0].toRadians();
	let φ2 = second[0].toRadians();

	let Δφ = (second[0] - first[0]).toRadians();
	let Δλ = (second[1] - first[1]).toRadians();

	let a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
			Math.cos(φ1) * Math.cos(φ2) *
			Math.sin(Δλ/2) * Math.sin(Δλ/2);

	let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

	callback(earth_rad * c);
}

function countLenght(topo, callback) {
	let bounds		= d3.geoBounds(topo);
	let radians		= d3.geoDistance(bounds[0], bounds[1]);
	let arc_length	= earth_rad * radians;

	let projected	= [projection(bounds[0]), projection(bounds[1])];
	let width		= projected[1][0] - projected[0][0];
	let height		= projected[0][1] - projected[1][1];
	let hypotenuse	= Math.sqrt((Math.pow(width, 2)) + (Math.pow(height, 2)));

	callback($(map_dest).outerWidth(true) / (hypotenuse / arc_length));
}

function nFormatter(num) {
	let digits	= 2;
	let standar = [
		{ value: 1, symbol: "" },
		{ value: 1E3, symbol: "k" },
		{ value: 1E6, symbol: "M" },
		{ value: 1E9, symbol: "G" },
		{ value: 1E12, symbol: "T" },
		{ value: 1E15, symbol: "P" },
		{ value: 1E18, symbol: "E" }
	];
	let re = /\.0+$|(\.[0-9]*[1-9])0+$/;
	let i;
	for (i = standar.length - 1; i > 0; i--) { if (num >= standar[i].value) { break; } }
	return (num / standar[i].value).toFixed(digits).replace(re, "$1") + ' ' + standar[i].symbol;
}

function addCommas(nStr) {
    nStr += '';
    var rgx = /(\d+)(\d{3})/;
    while (rgx.test(nStr)) {
        nStr = nStr.replace(rgx, '$1' + '.' + '$2');
    }
    return nStr;
}
