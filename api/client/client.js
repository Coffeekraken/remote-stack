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

var _room = require('./room');

var _room2 = _interopRequireDefault(_room);

var _merge2 = require('lodash/merge');

var _merge3 = _interopRequireDefault(_merge2);

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
		this._availableRooms = {};
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
				var socketUrl = _this._settings.host;
				if (_this._settings.port) {
					socketUrl += ':' + _this._settings.port;
				}
				_this._socket = (0, _socket4.default)(socketUrl);
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
				});
				// listen for rooms
				_this._socket.on('available-rooms', function (rooms) {

					// remove the rooms that have dissapeard
					Object.keys(_this._availableRooms).forEach(function (roomId) {
						if (!rooms[roomId]) {
							_this._availableRooms[roomId] && _this._availableRooms[roomId].destroy();
							delete _this._availableRooms[roomId];
						}
					});

					// save the rooms
					Object.keys(rooms).forEach(function (roomId) {
						if (_this._availableRooms[roomId]) {
							_this._availableRooms[roomId].updateData(rooms[roomId]);
						} else {
							_this._availableRooms[roomId] = new _room2.default(rooms[roomId], _this._socket, _this._settings);
							// listen when the room has been left
							_this._availableRooms[roomId].on('left', function (room) {
								console.log('leeeeeft', room);
								delete _this._joinedRooms[room.id];
								_this.emit('room.left', room);
							});
							_this._availableRooms[roomId].on('joined', function (room) {
								_this._joinedRooms[room.id] = _this._availableRooms[room.id];
								_this.emit('room.joined', room);
							});
							_this._availableRooms[roomId].on('picked', function (room) {
								_this.emit('room.picked', room);
							});
							_this._availableRooms[roomId].on('queued', function (room) {
								_this.emit('room.queued', room);
							});
							_this._availableRooms[roomId].on('picked-queue-timeout', function (room, remainingTime) {
								_this.emit('room.picked-queue-timeout', room, remainingTime);
							});
							_this._availableRooms[roomId].on('missed-turn', function (room) {
								_this.emit('room.missed-turn', room);
							});
						}
					});

					// emit new rooms
					_this.emit('available-rooms', _this._availableRooms);
				});
			});
		}
	}, {
		key: 'join',
		value: function join(roomId) {
			// join a room
			if (this._joinedRooms[roomId]) {
				reject('You cannot join the room "' + roomId + '" cause this client has already joined it...');
				return;
			}

			// if not annouced
			if (!this.isAnnounced()) {
				reject('You need to announce the client first with the "Client.announce" method...');
				return;
			}
			// join the room
			return this._availableRooms[roomId].join();
		}
	}, {
		key: 'leave',
		value: function leave(roomId) {
			// left the room
			return this._joinedRooms[roomId].leave();
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