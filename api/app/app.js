'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _socket = require('socket.io-p2p');

var _socket2 = _interopRequireDefault(_socket);

var _socket3 = require('socket.io-client');

var _socket4 = _interopRequireDefault(_socket3);

var _settings = require('./settings');

var _settings2 = _interopRequireDefault(_settings);

var _eventEmitter = require('event-emitter');

var _eventEmitter2 = _interopRequireDefault(_eventEmitter);

var _merge2 = require('lodash/merge');

var _merge3 = _interopRequireDefault(_merge2);

var _pako = require('pako');

var _pako2 = _interopRequireDefault(_pako);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @name  		App
 * Application proxy to connect into a room and be remotely controlled from any devices through sockets
 * @example 		js
 * import __remoteStack from 'coffeekraken-remote-stack'
 * const app = new __remoteStack.App({
 *  	name : 'My cool app'
 * });
 * app.announce('my-cool-room').then(() => {
 *  	// listen for some events, etc...
 *  	app.on('')
 * });
 *
 * @author 		Olivier Bossel <olivier.bossel@gmail.com>
 */

/**
 * @event
 * @name  app.announced
 * Notify that the app has been announced inside his room
 *
 * @example 	js
 * myApp.on('app.annouced', () => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  app.joined
 * Notify that the app has joined his room
 *
 * @example 	js
 * myApp.on('app.joined', () => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  client.data
 * Notify that the app has received some data from a client
 * @param 	{Object} 	data 		The data sent by the client
 * @param 	{Object} 	from 		The client object that has sent the data
 *
 * @example 	js
 * myApp.on('client.data', (data, from) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  client.joined
 * Notify that a client has joined the app
 * @param 	{Object} 	from 		The client object that has sent the data
 *
 * @example 	js
 * myApp.on('client.joined', (client) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  client.left
 * Notify that a client has left the app
 * @param 	{Object} 	from 		The client object that has sent the data
 *
 * @example 	js
 * myApp.on('client.left', (client) => {
 * 	// do something here...
 * });
 */

var App = function () {

	/**
  * @constructor
  * @param  		{Object} 		[data={}] 		The data you want to assign to the app
  * @param 		{Object} 		[settings={}] 	Configure the app socket through this settings
  */
	function App() {
		var _this = this;

		var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
		var settings = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

		_classCallCheck(this, App);

		this.data = {};
		this._socket = null;
		this._id = null;
		this._announced = false;
		this.log = {
			success: function success(message) {
				if (!_this._settings.debug) return;
				console.log('%c Remote stack app : ' + message, 'color: green');
			},
			error: function error(message) {
				if (!_this._settings.debug) return;
				console.log('%c Remote stack app : ' + message, 'color: red');
			}
		};

		// save the app data
		this.data = data;

		// extend settings
		this._settings = _extends({}, _settings2.default, settings);
	}

	/**
  * Announce the app in a particular room available on the server side.
  * One room can contain only one app.
  * @param 		{String} 		roomId 		The id of the room to join
  * @return 		{Promise} 					A promise
  */


	_createClass(App, [{
		key: 'announce',
		value: function announce(roomId) {
			var _this2 = this;

			return new Promise(function (resolve) {
				var socketUrl = _this2._settings.host;
				if (_this2._settings.port) {
					socketUrl += ':' + _this2._settings.port;
				}
				_this2._socket = (0, _socket4.default)(socketUrl);
				_this2._socket.on('connect', function () {
					// save the client id
					_this2._id = _this2._socket.id;
					// announce the client
					_this2._socket.emit('app.announce', _this2.data, roomId);
				});
				_this2._socket.on('app.announced', function (data) {
					// update client state
					_this2._announced = true;
					// the client has been annouced correctly
					resolve(_this2);
					// emit an event
					_this2.emit('app.announced', _this2);
					// log
					_this2.log.success('App successfuly announced');
				});

				// listen for joined room
				_this2._socket.on('app.joined', function (room) {
					_this2.log.success('App successfuly added to the "' + roomId + '" room');
					_this2.emit('app.joined', _this2);
				});

				_this2._socket.on('client.data', function (data, from) {
					// decompress data if needed
					if (_this2._settings.compression) {
						data = JSON.parse(_pako2.default.inflate(data, { to: 'string' }));
					}
					_this2.log.success('received ' + data + ' from client ' + from.id);
					_this2.emit('client.data', data, from);
				});

				_this2._socket.on('client.joined', function (client) {
					_this2.log.success('new client ' + client.id);
					_this2.emit('client.joined', client);
				});

				_this2._socket.on('client.left', function (client) {
					_this2.log.success('client ' + client.id + ' has left');
					_this2.emit('client.left', client);
				});
			});
		}

		/**
   * Return if the app has been annouced in a room or not
   * @return 		{Boolean} 			true if announced, false if not
   */

	}, {
		key: 'isAnnounced',
		value: function isAnnounced() {
			return this._announced;
		}

		/**
   * Send something to all or some clients that are connected to this app through a room
   * @param 		{Object} 		data 		 			The data to send
   * @param 		{Array|String} 	[clientIds=null] 		The id's of the clients to send the data to
   */

	}, {
		key: 'sendToClients',
		value: function sendToClients(something) {
			var clientIds = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

			this._socket.emit('app.data', something, clientIds);
		}
	}]);

	return App;
}();

/**
 * @name  	on
 * Listen to a particular event
 * @param 	{String} 		name 		The event name to listen to
 * @param 	{Function} 		cb 			The callback function to to call
 */

/**
 * @name  	once
 * Listen to a particular event only once
 * @param 	{String} 		name 		The event name to listen to
 * @param 	{Function} 		cb 			The callback function to to call
 */

/**
 * @name  	off
 * Remove a particular event listener
 * @param 	{String} 		name 		The event name to listen to
 */

// make the room class an emitter capable object


(0, _eventEmitter2.default)(App.prototype);

exports.default = App;