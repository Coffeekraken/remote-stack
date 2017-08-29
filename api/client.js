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

var _union2 = require('lodash/union');

var _union3 = _interopRequireDefault(_union2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @name 		Client
 * Client proxy to connect and control a remote application from any device through a socket.io server
 * @example 	js
 * import __remoteStack from 'coffeekraken-remote-stack'
 * const client = new __remoteStack.api.client.Client({
 * 	username : 'Cool client'
 * });
 * client.announce().then(() => {
 * 	// do something when the client has been announced correctly
 * 	// join a room
 *  client.join('cool-room').then(() => {
 *  	// do something when the client has joined the wanted room...
 *  });
 * });
 *
 * // listen for some events
 * client.on('queued', (room) => {
 * 	// client has been queued in the passed room after client.join('cool-room') call...
 * });
 * client.on('picked', (room) => {
 *  // client has been picked in the passed room...
 *  // you can at this point be confident that the client.join('cool-room') will succeed
 *  // but you need to call it again yourself...
 * });
 * client.on('picked-timeout', (room, remainingTimeout) => {
 * 	// do something on each tick of the picked timeout...
 * });
 *
 * @author  	Olivier Bossel <olivier.bossel@gmail.com>
 */

/**
 * @event
 * @name  	announced
 * Notify that the client has been announced to the server
 *
 * @example 	js
 * myClient.on('annouced', () => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	room.joined
 * Notify that the client has successfuly joined a room
 *
 * @param 	{Room} 		room 		The joined room object
 *
 * @example 	js
 * myClient.on('room.joined', (room) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	room.left
 * Notify that the client has successfuly left a room
 *
 * @param 	{Room} 		room 		The left room object
 *
 * @example 	js
 * myClient.on('room.left', (room) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	room.closed
 * Notify that the a room that the client has joined has been closed
 *
 * @param 	{Room} 		room 		The left room object
 *
 * @example 	js
 * myClient.on('room.closed', (room) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	room.queued
 * Notify that the client has been queued in a particular room
 *
 * @param 	{Room} 		room 		The room object
 *
 * @example 	js
 * myClient.on('room.queued', (room) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	room.picked
 * Notify that the client has been picked in a particular room
 *
 * @param 	{Room} 		room 		The room object
 *
 * @example 	js
 * myClient.on('room.picked', (room) => {
 * 	// try to join the room again here...
 * 	// you can be confident that the join will be a success until the picked-remaining-timeout is not finished...
 * });
 */

/**
 * @event
 * @name  	room.missed-turn
 * Notify that the client has missed his turn after being picked
 *
 * @param 	{Room} 		room 		The room object
 *
 * @example 	js
 * myClient.on('room.missed-turn', (room) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	error
 * Notify that an error has occured with his details
 *
 * @param 	{Object} 		error 		The object that describe the error
 *
 * @example 	js
 * myClient.on('error', (error) => {
 * 	// do something here...
 * });
 */

var Client = function () {

	/**
  * @constructor
  * @param  		{Object} 		[data={}] 		The data you want to assign to the client
  * @param 		{Object} 		[settings={}] 	Configure the app socket through this settings
  */
	function Client() {
		var _this = this;

		var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
		var settings = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

		_classCallCheck(this, Client);

		this.data = {};
		this._socket = null;
		this._id = null;
		this._joinedRooms = {};
		this._knownedRooms = {};
		this._announced = false;
		this.log = {
			success: function success(message) {
				if (!_this._settings.debug) return;
				console.log('%c Remote stack client : ' + message, 'color: green');
			},
			error: function error(message) {
				if (!_this._settings.debug) return;
				console.log('%c Remote stack client : ' + message, 'color: red');
			}
		};

		// save the user data
		this.data = data;

		// extend settings
		this._settings = _extends({}, _settings2.default, settings);
	}

	/**
  * Announce the client to the socket.io server.
  * @return 		{Promise} 					A promise
  */


	_createClass(Client, [{
		key: 'announce',
		value: function announce() {
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
					_this2._socket.emit('client.announce', _this2.data);
				});
				_this2._socket.on('_error', function (errorObj) {
					if (_this2._settings.debug) console.error('Remote stack client', errorObj);
					_this2.emit('error', errorObj);
				});
				_this2._socket.on('room.joined', function (roomData) {
					_this2._joinedRooms[roomData.id] = _this2._knownedRooms[roomData.id];
					_this2.emit('room.joined', _this2._knownedRooms[roomData.id]);
				});
				_this2._socket.on('room.left', function (roomData) {
					_this2._socket.off('room.' + roomData.id + '.metas');
					_this2.emit('room.left', _this2._knownedRooms[roomData.id]);
					delete _this2._joinedRooms[roomData.id];
				});
				_this2._socket.on('room.closed', function (roomData) {
					_this2._socket.off('room.' + roomData.id + '.metas');
					_this2.emit('room.closed', _this2._knownedRooms[roomData.id]);
					delete _this2._joinedRooms[roomData.id];
				});
				_this2._socket.on('room.queued', function (roomData) {
					_this2.emit('room.queued', _this2._knownedRooms[roomData.id]);
				});
				_this2._socket.on('room.picked', function (roomData) {
					_this2.emit('room.picked', _this2._knownedRooms[roomData.id]);
				});
				_this2._socket.on('room.missed-turn', function (roomData) {
					_this2.emit('room.missed-turn', _this2._knownedRooms[roomData.id]);
				});

				_this2._socket.on('client.announced', function (data) {
					// update client state
					_this2._announced = true;
					// the client has been annouced correctly
					resolve(_this2);
					// emit an event
					_this2.emit('announced', _this2);
					// log
					_this2.log.success('Successfuly announced');
				});
			});
		}

		/**
   * Ask to join a room
   * This request can lead to a "client.queued" event if the requested room is full. You will need to
   * call this method again when you receive the "client.picked" event
   *
  	 * @param 	{String} 		roomId 		The room id you want the client to join
  	 * @return  {Promise} 					A promise that will be resolved only if the client is accepted directly in the room
   */

	}, {
		key: 'join',
		value: function join(roomId) {
			var _this3 = this;

			return new Promise(function (resolve, reject) {

				// join a room
				if (_this3._joinedRooms[roomId] && _this3._joinedRooms[roomId].hasJoined()) {
					reject('You cannot join the room "' + roomId + '" cause this client has already joined it...');
					return;
				}

				// if not annouced
				if (!_this3.isAnnounced()) {
					reject('You need to announce the client first with the "Client.announce" method...');
					return;
				}

				// listen when we get the room datas
				_this3._socket.on('room.' + roomId + '.metas', function (room) {
					console.log('room metas', room);
					if (!_this3._knownedRooms[room.id]) {
						_this3._knownedRooms[room.id] = new _room2.default(room, _this3._socket, _this3._settings);
					} else {
						_this3._knownedRooms[room.id].updateData(room);
					}
					// correctly joined the room
					resolve(_this3._knownedRooms[room.id]);
				});

				// try to join a room
				_this3._socket.emit('client.join', roomId);
			});
		}

		/**
   * Destroy the client
   */

	}, {
		key: 'destroy',
		value: function destroy() {
			this._socket.off('room.joined');
			this._socket.off('room.left');
			this._socket.off('room.queued');
			this._socket.off('room.picked');
			this._socket.off('room.missed-turn');
			this._socket.off('_error');
			this._socket.off('client.announced');
			delete this._joinedRooms;
			delete this._knownedRooms;
			this._socket.disconnect();
			delete this._socket;
		}

		/**
   * All the rooms known rooms that the client has already try to join or joined
   * @type 		{Object}
   */

	}, {
		key: 'isAnnounced',


		/**
   * Return if the client has been annouced to the server
   * @return 		{Boolean} 			true if announced, false if not
   */
		value: function isAnnounced() {
			return this._announced;
		}
	}, {
		key: 'knownedRooms',
		get: function get() {
			return this._knownedRooms;
		}

		/**
   * All the rooms in which the client is in
   * @type 		{Object}
   */

	}, {
		key: 'joinedRooms',
		get: function get() {
			return this._joinedRooms;
		}
	}]);

	return Client;
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


(0, _eventEmitter2.default)(Client.prototype);

exports.default = Client;