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
