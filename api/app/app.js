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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var App = function () {
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

	_createClass(App, [{
		key: 'announce',
		value: function announce(roomId) {
			var _this2 = this;

			return new Promise(function (resolve) {
				_this2._socket = (0, _socket4.default)(_this2._settings.host + _this2._settings.port ? ':' + _this2._settings.port : '');
				_this2._socket.on('connect', function () {
					// save the client id
					_this2._id = _this2._socket.id;
					// announce the client
					_this2._socket.emit('announce-app', _this2.data, roomId);
				});
				_this2._socket.on('announced-app', function (data) {
					// update client state
					_this2._announced = true;
					// the client has been annouced correctly
					resolve(_this2);
					// emit an event
					_this2.emit('announced', _this2);
					// log
					_this2.log.success('App successfuly announced');
				});

				// listen for joined room
				_this2._socket.on('joined-app', function (room) {
					_this2.log.success('App successfuly added to the "' + roomId + '" room');
				});

				_this2._socket.on('receive-from-client', function (data, from) {
					_this2.log.success('receive ' + data + ' from client ' + from.id);
					_this2.emit('receive-from-client', data, from);
				});

				_this2._socket.on('new-client', function (client) {
					_this2.log.success('new client ' + client.id);
					_this2.emit('new-client', client);
				});

				_this2._socket.on('client-left', function (client) {
					_this2.log.success('client ' + client.id + ' has left');
					_this2.emit('client-left', client);
				});
			});
		}
	}, {
		key: 'isAnnounced',
		value: function isAnnounced() {
			return this._announced;
		}
	}]);

	return App;
}();

// make the room class an emitter capable object


(0, _eventEmitter2.default)(App.prototype);

exports.default = App;