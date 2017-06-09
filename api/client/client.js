'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _socket = require('socket.io-client');

var _socket2 = _interopRequireDefault(_socket);

var _settings = require('./settings');

var _settings2 = _interopRequireDefault(_settings);

var _eventEmitter = require('event-emitter');

var _eventEmitter2 = _interopRequireDefault(_eventEmitter);

var _room = require('./room');

var _room2 = _interopRequireDefault(_room);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Client = function () {
	function Client() {
		var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
		var settings = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

		_classCallCheck(this, Client);

		this.data = {};
		this._socket = null;
		this._id = null;
		this._joinedRooms = {};
		this._rooms = {};
		this._announced = false;
		this.log = {
			success: function success(message) {
				console.log('%c Remote stack client : ' + message, 'color: green');
			},
			error: function error(message) {
				console.log('%c Remote stack client : ' + message, 'color: red');
			}
		};

		// save the user data
		this.data = data;

		// extend settings
		this._settings = _extends({}, _settings2.default, settings);
	}

	_createClass(Client, [{
		key: 'announce',
		value: function announce() {
			var _this = this;

			return new Promise(function (resolve) {
				_this._socket = (0, _socket2.default)(_this._settings.host + _this._settings.port ? ':' + _this._settings.port : '');
				_this._socket.on('connect', function () {
					// save the client id
					_this._id = _this._socket.id;

					// announce the client
					_this._socket.emit('announce', _this.data);
				});
				_this._socket.on('announced', function (data) {
					// update client state
					_this._announced = true;
					// the client has been annouced correctly
					resolve(_this);
					// emit an event
					_this.emit('announced', _this);
					// log
					_this.log.success('Successfuly announced');
					console.log(_this);
				});
				// listen for rooms
				_this._socket.on('rooms', function (rooms) {

					// save the rooms
					_this._rooms = rooms;

					// emit new rooms
					_this.emit('rooms', rooms);
				});
			});
		}
	}, {
		key: 'join',
		value: function join(roomId) {
			var _this2 = this;

			return new Promise(function (resolve, reject) {

				// join a room
				if (_this2._joinedRooms[roomId]) {
					reject('You cannot join the room "' + roomId + '" cause this client has already joined it...');
					return;
				}

				// if not annouced
				if (!_this2.isAnnounced()) {
					reject('You need to announce the client first with the "Client.announce" method...');
					return;
				}
				_this2._socket.emit('join', roomId, function (data) {

					// create a new room instance
					var room = new _room2.default(data, _this2._socket);

					// save the rooms in the client
					_this2._joinedRooms[roomId] = room;

					// resolve the promise
					_this2.emit('joined', room);
					resolve(room);
				});
			});
		}
	}, {
		key: 'leave',
		value: function leave(roomId) {
			var _this3 = this;

			// left a room
			if (!this._joinedRooms[roomId]) throw 'You cannot left the room "' + roomId + '" cause this client has not joined it yet...';
			// left the room
			var promise = this._joinedRooms[roomId].leave();
			// update the rooms of the client
			promise.then(function () {
				// remove the room from the client rooms stack
				delete _this3._joinedRooms[roomId];
			});
			// return the promise
			return promise;
		}

		/**
   * All the rooms in which the client is in
   * @type 		{Object<Room>}
   */

	}, {
		key: 'isAnnounced',
		value: function isAnnounced() {
			return this._announced;
		}
	}, {
		key: 'joinedRooms',
		get: function get() {
			return this._joinedRooms;
		}
	}]);

	return Client;
}();

// make the room class an emitter capable object


(0, _eventEmitter2.default)(Client.prototype);

exports.default = Client;