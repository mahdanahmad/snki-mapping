const cors			= require('cors');
const path          = require('path');
const express		= require('express');
const bodyParser	= require('body-parser');
const cookieParser	= require('cookie-parser');

const app			= express();

app.use(bodyParser.json({ limit: '200mb' }));
app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }));
app.use(cookieParser());
// app.use(cors());

app.use(express.static(path.join(__dirname, '../js')));
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.static(path.join(__dirname, '../stylesheets')));
app.use(express.static(path.join(__dirname, '../views')));

app.use('/', require('./routes/views'));
app.use('/api', require('./routes/api'));

// catch 404 and forward to error handler
app.use((req, res) => {
	res.redirect('/');
});

// error handlers

// development error handler
// will print stacktrace
if (process.env.APP_ENV === 'development') {
	app.use((err, req, res, next) => {
		res.status(err.status || 500);
		res.json({
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to operator
app.use((err, req, res, next) => {
	res.status(err.status || 500);
	res.json({
		message: err.message,
		error: {}
	});
});

module.exports = app;
