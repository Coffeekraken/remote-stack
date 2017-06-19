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
 * client.on('client.queued', (room) => {
 * 	// client has been queued in the passed room after client.join('cool-room') call...
 * });
 * client.on('client.picked', (room) => {
 *  // client has been picked in the passed room...
 *  // you can at this point be confident that the client.join('cool-room') will succeed
 *  // but you need to call it again yourself...
 * });
 * client.on('client.picked-timeout', (room, remainingTimeout) => {
 * 	// do something on each tick of the picked timeout...
 * });
 *
 * @author  	Olivier Bossel <olivier.bossel@gmail.com>
 */

/**
 * @event
 * @name  	client.announced
 * Notify that the client has been announced to the server
 *
 * @example 	js
 * myClient.on('client.annouced', () => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	client.joined
 * Notify that the client has successfuly joined a room
 *
 * @param 	{Room} 		room 		The joined room object
 *
 * @example 	js
 * myClient.on('client.joined', (room) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	client.left
 * Notify that the client has successfuly left a room
 *
 * @param 	{Room} 		room 		The left room object
 *
 * @example 	js
 * myClient.on('client.left', (room) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	client.queued
 * Notify that the client has been queued in a particular room
 *
 * @param 	{Room} 		room 		The room object
 *
 * @example 	js
 * myClient.on('client.queued', (room) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	client.picked
 * Notify that the client has been picked in a particular room
 *
 * @param 	{Room} 		room 		The room object
 *
 * @example 	js
 * myClient.on('client.picked', (room) => {
 * 	// try to join the room again here...
 * 	// you can be confident that the join will be a success until the picked-timeout is not finished...
 * });
 */

/**
 * @event
 * @name  	client.picked-timeout
 * Notify each second of the remaining timeout left to join the room when the client has been picked
 *
 * @param 	{Room} 		room 					The room object
 * @param 	{Integer} 	remainingTimeout 		The timeout left before the client is being kicked of the picked queue
 *
 * @example 	js
 * myClient.on('client.picked-timeout', (room, remainingTimeout) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	client.missed-turn
 * Notify that the client has missed his turn after being picked
 *
 * @param 	{Room} 		room 		The room object
 *
 * @example 	js
 * myClient.on('client.missed-turn', (room) => {
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

	/**
  * Announce the client to the socket.io server.
  * @return 		{Promise} 					A promise
  */


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
					_this._socket.emit('client.announce', _this.data);
				});
				_this._socket.on('client.announced', function (data) {
					// update client state
					_this._announced = true;
					// the client has been annouced correctly
					resolve(_this);
					// emit an event
					_this.emit('client.announced', _this);
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
							_this._availableRooms[roomId] = new _room2.default(rooms[roomId], _this._socket);
							// listen when the room has been left
							_this._availableRooms[roomId].on('client.left', function (room) {
								console.log('leeeeeft', room);
								delete _this._joinedRooms[room.id];
								_this.emit('client.left', room);
							});
							_this._availableRooms[roomId].on('client.joined', function (room) {
								_this._joinedRooms[room.id] = _this._availableRooms[room.id];
								_this.emit('client.joined', room);
							});
							_this._availableRooms[roomId].on('client.picked', function (room) {
								_this.emit('client.picked', room);
							});
							_this._availableRooms[roomId].on('client.queued', function (room) {
								_this.emit('client.queued', room);
							});
							_this._availableRooms[roomId].on('client.picked-timeout', function (room, remainingTime) {
								_this.emit('client.picked-queue-timeout', room, remainingTime);
							});
							_this._availableRooms[roomId].on('client.missed-turn', function (room) {
								_this.emit('client.missed-turn', room);
							});
						}
					});

					// emit new rooms
					_this.emit('available-rooms', _this._availableRooms);
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

		/**
   * Leave the passed room
   * @param 	{String} 	roomId 		The room id you want the client to leave
   * @return 	{Promise} 				A promise that will be resolved when the client has successfuly left the room
   */

	}, {
		key: 'leave',
		value: function leave(roomId) {
			// left the room
			return this._joinedRooms[roomId].leave();
		}

		/**
   * All the rooms available to join
   * @type 		{Object<Room>}
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
		key: 'availableRooms',
		get: function get() {
			return this._availableRooms;
		}

		/**
   * All the rooms in which the client is in
   * @type 		{Object<Room>}
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