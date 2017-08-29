const __express = require('express');
const __expressHandlebars = require('express-handlebars');
const __path = require('path');
const __fs = require('fs');
const __cors = require('cors');
const __bodyParser = require('body-parser');
const __extend = require('lodash/extend');
const __exec = require('child_process').spawnSync;
const __jsdom = require('jsdom');
const __semver = require('semver');
const __urldecode = require('urldecode');
const __socketIo = require('socket.io');


module.exports = function(config) {

	// creating the app
	const app = __express();

	// handlebars
	app.engine('handlebars', __expressHandlebars({
		layoutsDir : __dirname + '/views/layouts',
		defaultLayout : 'main'
	}));
	app.set('views',__dirname + '/views');
	app.set('view engine', 'handlebars');

	// static files
	app.use('/assets', __express.static(__dirname + '/assets'));

	// parser body
	app.use(__bodyParser.json());
	app.use(__bodyParser.urlencoded({ extended: true }));

	// cors
	app.use(__cors());

	// attach config to request
	app.use((req, res, next) => {
		req.config = Object.assign({}, config);
		next();
	});

	// JS
	app.get('/connect', function (req, res) {

		// options
		const options = __extend({
		}, req.body.options || {});
		res.render('connect', {
			remotes : config.remotes
		});

	});

	app.get('/', function (req, res) {

		// options
		const options = __extend({
		}, req.body.options || {});
		res.render('remote');

	});

	app.get('/connect/:id', function (req, res) {

		// options
		const options = __extend({
		}, req.body.options || {});

		res.render('connect', {
			remotes : config.remotes
		});

	});

	// start demo server
	const io = __socketIo.listen(app.listen(config.port, function () {
		console.log('Remote queue server : ✓ running on port ' + config.port + '!');
	}));


	const socket = io.on('connection', function (socket) {
		console.log('connection');
		socket.on('load', function(data){
			socket.emit('access', {
				access: (true ? 'granted' : 'denied')
			});
		});
	});
}
