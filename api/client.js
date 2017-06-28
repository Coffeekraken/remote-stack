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
 * @name  	joined
 * Notify that the client has successfuly joined a room
 *
 * @param 	{Room} 		room 		The joined room object
 *
 * @example 	js
 * myClient.on('joined', (room) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	client.joined
 * Notify that another client has successfuly joined a room
 *
 * @param 	{Room} 		room 		The joined room object
 * @param 	{Object} 	client 		The joined client object
 *
 * @example 	js
 * myClient.on('client.joined', (room, client) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	left
 * Notify that the client has successfuly left a room
 *
 * @param 	{Room} 		room 		The left room object
 *
 * @example 	js
 * myClient.on('left', (room) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	client.left
 * Notify that another client has successfuly left a room
 *
 * @param 	{Room} 		room 		The left room object
 * @param 	{Object} 	client 		The left client object
 *
 * @example 	js
 * myClient.on('client.left', (room, client) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	queued
 * Notify that the client has been queued in a particular room
 *
 * @param 	{Room} 		room 		The room object
 *
 * @example 	js
 * myClient.on('queued', (room) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	client.queued
 * Notify that another client has been queued in a particular room
 *
 * @param 	{Room} 		room 		The room object
 * @param 	{Object} 	client 		The queued client object
 *
 * @example 	js
 * myClient.on('client.queued', (room, client) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	picked
 * Notify that the client has been picked in a particular room
 *
 * @param 	{Room} 		room 		The room object
 *
 * @example 	js
 * myClient.on('picked', (room) => {
 * 	// try to join the room again here...
 * 	// you can be confident that the join will be a success until the picked-timeout is not finished...
 * });
 */

/**
 * @event
 * @name  	client.picked
 * Notify that another client has been picked in a particular room
 *
 * @param 	{Room} 		room 		The room object
 * @param 	{Object} 	client 		The picked client object
 *
 * @example 	js
 * myClient.on('client.picked', (room) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	picked-timeout
 * Notify each second of the remaining timeout left to join the room when the client has been picked
 *
 * @param 	{Room} 		room 					The room object
 * @param 	{Integer} 	remainingTimeout 		The timeout left before the client is being kicked of the picked queue
 *
 * @example 	js
 * myClient.on('picked-timeout', (room, remainingTimeout) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	missed-turn
 * Notify that the client has missed his turn after being picked
 *
 * @param 	{Room} 		room 		The room object
 *
 * @example 	js
 * myClient.on('missed-turn', (room) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	available-rooms
 * Notify that the server has sent the available room you can join
 *
 * @param 		{Object} 		rooms 		The available rooms object
 *
 * @example 	js
 * myClient.on('available-rooms', (rooms) => {
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
    this._availableRooms = {};
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
        // listen for rooms
        _this2._socket.on('available-rooms', function (rooms) {

          // remove the rooms that have dissapeard
          Object.keys(_this2._availableRooms).forEach(function (roomId) {
            if (!rooms[roomId]) {
              _this2._availableRooms[roomId] && _this2._availableRooms[roomId].destroy();
              delete _this2._availableRooms[roomId];
            }
          });

          // save the rooms
          Object.keys(rooms).forEach(function (roomId) {
            if (_this2._availableRooms[roomId]) {
              _this2._availableRooms[roomId].updateData(rooms[roomId]);
            } else {
              _this2._availableRooms[roomId] = new _room2.default(rooms[roomId], _this2._socket, _this2._settings);
              // listen when the room has been left
              _this2._availableRooms[roomId].on('left', function (room) {
                delete _this2._joinedRooms[room.id];
                _this2.emit('left', room);
              });
              _this2._availableRooms[roomId].on('client.left', function (room, client) {
                _this2.emit('client.left', room, client);
              });
              _this2._availableRooms[roomId].on('joined', function (room) {
                _this2._joinedRooms[room.id] = _this2._availableRooms[room.id];
                _this2.emit('joined', room);
              });
              _this2._availableRooms[roomId].on('client.joined', function (room, client) {
                _this2.emit('client.joined', room, client);
              });
              _this2._availableRooms[roomId].on('picked', function (room) {
                _this2.emit('picked', room);
              });
              _this2._availableRooms[roomId].on('client.picked', function (room, client) {
                _this2.emit('client.picked', room, client);
              });
              _this2._availableRooms[roomId].on('queued', function (room) {
                _this2.emit('queued', room);
              });
              _this2._availableRooms[roomId].on('client.queued', function (room, client) {
                _this2.emit('client.queued', room, client);
              });
              _this2._availableRooms[roomId].on('picked-timeout', function (room, remainingTime) {
                _this2.emit('picked-timeout', room, remainingTime);
              });
              _this2._availableRooms[roomId].on('missed-turn', function (room) {
                _this2.emit('missed-turn', room);
              });
            }
          });

          _this2.log.success('Available rooms : ' + _this2._availableRooms);

          // emit new rooms
          _this2.emit('available-rooms', _this2._availableRooms);
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
    key: 'availableRooms',
    get: function get() {
      return this._availableRooms;
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