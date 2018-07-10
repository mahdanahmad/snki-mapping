#!/usr/bin/env node

/**
  * Module dependencies.
  */

require('dotenv').config();

const db	= require('./connection');
const app	= require('./app');
const http	= require('http');

/**
 * Get port from environment and store in Express.
 */

const port	= normalizePort(process.env.PORT || '3010');
app.set('port', port);

/**
 * Create HTTP server.
 */

const server	= http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
const auth		= (process.env.DB_USERNAME !== '' || process.env.DB_PASSWORD !== '') ? process.env.DB_USERNAME + ':' + process.env.DB_PASSWORD + '@' : '';
const db_url	= 'mongodb://' + auth + process.env.DB_HOST + ':' + process.env.DB_PORT;
db.connect(db_url, process.env.DB_DATABASE, (err) => {
	if (err) {
		console.error('Unable to connect to Mongo.');
		process.exit(1);
	} else {
		server.listen(port);
		server.on('error', onError);
		server.on('listening', onListening);
	}
});

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
	const port	= parseInt(val, 10);

	if (isNaN(port)) { return val; }
	if (port >= 0) { return port; }
	return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
	if (error.syscall !== 'listen') { throw error; }

	const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

    // handle specific listen errors with friendly messages
	switch (error.code) {
	case 'EACCES':
		console.error(bind + ' requires elevated privileges');
		process.exit(1);
		break;

	case 'EADDRINUSE':
		console.error(bind + ' is already in use');
		process.exit(1);
		break;

	default: throw error;
	}
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
	const addr = server.address();
	const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
	console.info('Listening on ' + bind);
}
