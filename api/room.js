'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _socket = require('socket.io-client');

var _socket2 = _interopRequireDefault(_socket);

var _socket3 = require('socket.io-stream');

var _socket4 = _interopRequireDefault(_socket3);

var _uniqid = require('uniqid');

var _uniqid2 = _interopRequireDefault(_uniqid);

var _merge2 = require('lodash/merge');

var _merge3 = _interopRequireDefault(_merge2);

var _size2 = require('lodash/size');

var _size3 = _interopRequireDefault(_size2);

var _pako = require('pako');

var _pako2 = _interopRequireDefault(_pako);

var _settings = require('./settings');

var _settings2 = _interopRequireDefault(_settings);

var _eventEmitter = require('event-emitter');

var _eventEmitter2 = _interopRequireDefault(_eventEmitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @name 		Room
 * Room class that represent a room getted from the socket.io server
 * This class is usually instanciated by the Client one
 *
 * @author  	Olivier Bossel <olivier.bossel@gmail.com>
 */

/**
 * @event
 * @name  	joined
 * Notify that the client has successfuly joined the room
 *
 * @param 	{Room} 		room 		The joined room object
 *
 * @example 	js
 * myRoom.on('joined', (room) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	client.joined
 * Notify that another client has successfuly joined the room
 *
 * @param 	{Room} 		room 		The joined room object
 * @param 	{Object} 	client 		The joined client object
 *
 * @example 	js
 * myRoom.on('client.joined', (room, client) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	left
 * Notify that the client has successfuly left the room
 *
 * @param 	{Room} 		room 		The left room object
 *
 * @example 	js
 * myRoom.on('left', (room) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	client.left
 * Notify that another client has successfuly left the room
 *
 * @param 	{Room} 		room 		The left room object
 * @param 	{Object} 	client 		The left client object
 *
 * @example 	js
 * myRoom.on('client.left', (room, client) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	closed
 * Notify that the room has been closed
 *
 * @param 	{Room} 		room 		The closed room object
 *
 * @example 	js
 * myRoom.on('closed', (room) => {
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
 * myRoom.on('queued', (room) => {
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
 * myRoom.on('client.queued', (room, client) => {
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
 * myRoom.on('picked', (room) => {
 * 	// try to join the room again here...
 * 	// you can be confident that the join will be a success until the picked-remaining-timeout is not finished...
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
 * myRoom.on('client.picked', (room) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	picked-remaining-timeout
 * Notify each second of the remaining timeout left to join the room when the client has been picked
 *
 * @param 	{Room} 		room 					The room object
 * @param 	{Integer} 	remainingTimeout 		The timeout left before the client is being kicked out of the picked queue
 *
 * @example 	js
 * myRoom.on('picked-remaining-timeout', (room, remainingTimeout) => {
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
 * myRoom.on('missed-turn', (room) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	session-remaining-timeout
 * Notify each second of the remaining session timeout left. This will be fired during the "endSessionNotificationTimeout" setting in the server configuration
 *
 * @param 	{Room} 		room 				The room object
 * @param 	{Integer} 	remainingTimeout 	The timeout left before the client is being kicked out of the room
 *
 * @example 	js
 * myRoom.on('session-remaing-timeout', (room, remainingTimeout) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name 	client.data
 * Notify that a client has send some data to the room
 *
 * @paeam 	{Object} 		client 		The client object
 * @param 	{Object} 		data 		The data sent by the client
 *
 * @example 	js
 * myRoom.on('client.data', (client, data) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name 	app.data
 * Notify that the room app has send some data
 *
 * @param 	{Object} 		data 		The data sent by the app
 *
 * @example 	js
 * myRoom.on('app.data', (data) => {
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

var Room = function () {

	/**
  * @constructor
  * @param 	{Object} 		data 		The room data object
  * @param 	{SocketIo} 		socket 		The socket instance used to communicate with the server
  */
	function Room(data, socket) {
		var _this = this;

		var settings = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

		_classCallCheck(this, Room);

		this._id = null;
		this._name = null;
		this._app = null;
		this._clients = {};
		this._activeClients = {};
		this._queue = [];
		this._pickedClients = [];
		this._pickedTimeout = null;
		this._pickedRemainingTimeout = null;
		this._sessionDuration = -1;
		this._sessionRemainingTimeout = 0;
		this._endSessionNotificationTimeout = 0;
		this._endSessionNotificationInterval = null;
		this._maxClients = 0;
		this._averageSessionDuration = 0;
		this._socket = null;
		this.log = {
			success: function success(message) {
				if (!_this._settings.debug) return;
				console.log('%c Remote stack room : ' + message, 'color: green');
			},
			error: function error(message) {
				if (!_this._settings.debug) return;
				console.log('%c Remote stack room : ' + message, 'color: red');
			}
		};


		// extend settings
		this._settings = _extends({}, _settings2.default, settings);

		// save the socket
		this._socket = socket;
		// save the room name to join
		this.updateData(data);

		// listen for new room data
		this._socket.on('room.' + data.id + '.data', function (data) {
			data = JSON.parse(_pako2.default.inflate(data, { to: 'string' }));

			_this.log.success('New room data : ' + data);

			// new room data
			_this.updateData(data);
		});

		this._socket.on('_error', function (errorObj) {
			if (_this._settings.debug) console.error('Remote stack room', errorObj);
			_this.emit('error', errorObj);
		});

		// listen to know id the room is closed
		this._socket.on('room.closed', function (room) {
			if (room.id !== _this.id) return;
			_this.log.success('Room ' + _this.id + ' has been closed');
			_this.emit('closed', _this);
		});

		this._socket.on('room.left', function (room) {
			if (!_this.id) return;
			if (room.id !== _this.id) return;

			_this.log.success('Left room "' + _this.id + '"');

			// let the app know that we have left the room
			_this.emit('left', _this);
		});

		this._socket.on('room.client.left', function (room, client) {
			if (!_this.id) return;
			if (room.id !== _this.id) return;
			_this.log.success('The client ' + client + ' has left the room ' + _this.id);
			_this.emit('client.left', _this, client);
		});

		this._socket.on('room.queued', function (room) {
			if (!_this.id) return;
			if (room.id !== _this.id) return;

			_this.log.success('Queued in ' + _this.id);

			_this.emit('queued', _this);
		});

		this._socket.on('room.client.queued', function (room, client) {
			if (!_this.id) return;
			if (room.id !== _this.id) return;
			_this.log.success('The client ' + client + ' has been queued in the room ' + _this.id);
			_this.emit('client.queued', _this, client);
		});

		this._socket.on('room.picked', function (room) {
			if (!_this.id) return;
			if (room.id !== _this.id) return;

			_this.log.success('Picked in ' + _this.id);

			_this.emit('picked', _this);

			// start timer of the picked queue
			_this._startPickedClientsTimeout();
		});

		// another client has been picked inside this room
		this._socket.on('room.client.picked', function (room, client) {
			if (!_this.id) return;
			if (room.id !== _this.id) return;
			_this.log.success('The client ' + client + ' has been picked in the room ' + _this.id);
			_this.emit('client.picked', _this, client);
		});

		// joined the room
		this._socket.on('room.joined', function (room) {
			if (!_this.id) return;
			if (room.id !== _this.id) return;

			_this.log.success('Joined ' + _this.id);

			// check if has a session duration
			if (_this.sessionDuration > 0) {
				// start the end session timeout
				_this._startEndSessionDurationTimeout();
			}

			// let the app know that we have left the room
			_this.emit('joined', _this);
		});

		// another client has joined the room
		this._socket.on('room.client.joined', function (room, client) {
			if (!_this.id) return;
			if (room.id !== _this.id) return;
			_this.log.success('The client ' + client + ' has joined the room ' + _this.id);
			_this.emit('client.joined', _this, client);
		});

		// data from the app
		this._socket.on('room.' + this.id + '.app.data', function (data) {
			_this.log.success('Received some data from the app : ' + data);

			// let the app know that we have received something from the app
			_this.emit('app.data', data);
		});

		// data from another room client
		this._socket.on('room.' + this.id + '.client.data', function (client, something) {

			_this.log.success('Received some data from the another client : ' + something + ' ' + client);

			// let the app know that we have received something from another client
			_this.emit('client.data', client, something);
		});
	}

	/**
  * Start the picked timeout
  */
	// store the setInterval if for the end session duration event fireing
	// store the setInterval id for the picked timeout event fireing


	_createClass(Room, [{
		key: '_startPickedClientsTimeout',
		value: function _startPickedClientsTimeout() {
			var _this2 = this;

			// save the initial time
			this._pickedRemainingTimeout = this._pickedTimeout;

			// emit a picked queue timeout event
			this.emit('picked-remaining-timeout', this, this._pickedRemainingTimeout);

			// create the timeout
			clearInterval(this._pickedTimeoutInterval);
			this._pickedTimeoutInterval = setInterval(function () {
				_this2._pickedRemainingTimeout = _this2._pickedRemainingTimeout - 1000;

				_this2.log.success('picked timeout', _this2._pickedRemainingTimeout);

				// emit a picked queue timeout event
				_this2.emit('picked-remaining-timeout', _this2, _this2._pickedRemainingTimeout);

				if (_this2._pickedRemainingTimeout <= 0) {
					// end of time
					clearInterval(_this2._pickedTimeoutInterval);

					_this2.log.success('end of picked queue...');

					// emit a missed-turn event
					_this2.emit('missed-turn', _this2);

					// leave the room unfortunately...
					_this2.leave();
				}
			}, 1000);
		}

		/**
   * Start the session duration timeout
   */

	}, {
		key: '_startEndSessionDurationTimeout',
		value: function _startEndSessionDurationTimeout() {
			var _this3 = this;

			// save the initial time
			this._sessionRemainingTimeout = this.sessionDuration;

			// emit a picked queue timeout event
			this.emit('end-session-timeout', this, this._sessionRemainingTimeout);

			// create the timeout
			clearInterval(this._endSessionNotificationInterval);
			this._endSessionNotificationInterval = setInterval(function () {
				_this3._sessionRemainingTimeout = _this3._sessionRemainingTimeout - 1000;

				if (_this3._sessionRemainingTimeout <= _this3.endSessionNotificationTimeout) {
					_this3.log.success('end session timeout : ' + _this3._sessionRemainingTimeout);
					// emit a picked queue timeout event
					_this3.emit('end-session-timeout', _this3, _this3._sessionRemainingTimeout);
				}

				if (_this3._sessionRemainingTimeout <= 0) {
					// end of time
					clearInterval(_this3._endSessionNotificationInterval);

					_this3.log.success('end of end session notification timeout...');

					// leave the room unfortunately...
					_this3.leave();
				}
			}, 1000);
		}

		/**
   * Send data to the other room clients
   * @param 	{Object} 		data 		THe data to send
   * @example 	js
   * room.sendToClients({
   * 	something : 'cool'
   * });
   */

	}, {
		key: 'sendToClients',
		value: function sendToClients(something) {
			if (!this.hasJoined()) {
				throw 'You cannot send something to client in the room "' + this.id + '" cause you don\'t has joined it yet...';
				return;
			}

			this._socket.emit('client.to.clients', this.id, something);
		}

		/**
   * Send data to the room application
   * @param 	{Object} 		data 		THe data to send
   * @example 	js
   * room.sendToApp({
   * 	something : 'cool'
   * });
   */

	}, {
		key: 'sendToApp',
		value: function sendToApp(something) {
			if (!this.hasJoined()) {
				throw 'You cannot send something to app in the room "' + this.id + '" cause you don\'t has joined it yet...';
				return;
			}
			this._socket.emit('client.to.app', this.id, something);
		}

		/**
   * Leave this room
   * @return 	{Promise} 		A promise resolved when the client has successfuly left the room
   * @example 	js
   * room.leave().then(() => {
   * 	// do something here...
   * });
   */

	}, {
		key: 'leave',
		value: function leave() {
			var _this4 = this;

			return new Promise(function (resolve, reject) {

				// check that we have joined the room before
				if (!_this4.hasJoined() && !_this4.isQueued() && !_this4.isPicked()) {
					reject('You cannot leave a the room "' + _this4.id + '" cause you have not joined it yet...');
					return;
				}

				// clear some timeout, interval, etc...
				clearInterval(_this4._pickedTimeoutInterval);
				clearInterval(_this4._endSessionNotificationInterval);

				// this._leavePromiseReject = reject;
				// this._leavePromiseResolve = resolve;
				_this4._socket.off('client.to.clients');
				_this4._socket.emit('client.leave', _this4.id);
			});
		}

		/**
   * Destroy this room instance locally
   */

	}, {
		key: 'destroy',
		value: function destroy() {
			// stop listening for this room datas
			// this._socket.off(`room.${this.id}.data`);
			// this._socket.off(`room.${this.id}.joined`);
			// this._socket.off(`room.${this.id}.left`);
			// this._socket.off(`room.${this.id}.picked`);
			// this._socket.off(`room.${this.id}.queued`);
			// this._socket.off(`room.${this.id}.app.data`);
			// this._socket.off(`room.${this.id}.client.data`);
			// remove some datas to clean memory
			delete this._name;
			delete this._id;
			delete this._app;
			delete this._clients;
			delete this._queue;
			delete this._activeClients;
			delete this._maxClients;
			delete this._sessionDuration;
			delete this._endSessionNotificationTimeout;
			delete this._pickedTimeout;
			delete this._pickedRemainingTimeout;
			delete this._pickedClients;
			delete this._maxClients;
			clearInterval(this._pickedTimeoutInterval);
			clearInterval(this._endSessionNotificationInterval);
			delete this._pickedTimeoutInterval;
			delete this._endSessionNotificationInterval;
		}

		/**
   * Update the room data with new ones
   * @param 	{Object} 		data 		The new room data
   * @return 	{Room} 						The instance itself to maintain chainability
   */

	}, {
		key: 'updateData',
		value: function updateData(data) {
			this._id = data.id;
			this._name = data.name;
			this._app = data.app;
			this._clients = data.clients;
			this._activeClients = data.activeClients;
			this._maxClients = data.maxClients;
			this._pickedTimeout = data.pickedTimeout;
			this._sessionDuration = data.sessionDuration;
			this._endSessionNotificationTimeout = data.endSessionNotificationTimeout;
			this._averageSessionDuration = data.averageSessionDuration;
			this._queue = data.queue;
			this._pickedClients = data.pickedClients;
			this._maxClients = data.maxClients;
			return this;
		}

		/**
   * The room id
   * @type 		{String}
   */

	}, {
		key: 'isQueued',


		/**
   * Return if the current client has been queued or not
   * @return 		{Boolean} 		true if the client is in the queue, false if not
   */
		value: function isQueued() {
			return this.queue.indexOf(this._socket.id) !== -1;
		}

		/**
   * Return if the current client has been picked in the room or not
   * @return 		{Boolean} 		true if the client has bein picked, false if not
   */

	}, {
		key: 'isPicked',
		value: function isPicked() {
			return this._pickedClients.indexOf(this._socket.id) !== -1;
		}

		/**
   * Return if the current client has joined the room or not
   * @return  	{Boolean} 		true if the client has joined the room, false if not
   */

	}, {
		key: 'hasJoined',
		value: function hasJoined() {
			return this.activeClients[this._socket.id] != null;
		}

		/**
   * Return if the room has an app or not
   * @return 		{Boolean} 		true if the room has an app, false if not
   */

	}, {
		key: 'hasApp',
		value: function hasApp() {
			return this.app !== null;
		}
	}, {
		key: 'id',
		get: function get() {
			return this._id;
		}

		/**
   * The room name
   * @type 		{String}
   */

	}, {
		key: 'name',
		get: function get() {
			return this._name;
		}

		/**
   * The app socket id
   * @type 		{String}
   */

	}, {
		key: 'app',
		get: function get() {
			return this._app;
		}

		/**
   * The clients in the room
   * @type  	{Array}
   */

	}, {
		key: 'clients',
		get: function get() {
			return this._clients;
		}

		/**
   * The active clients
   * @type  	{Array}
   */

	}, {
		key: 'activeClients',
		get: function get() {
			return this._activeClients;
		}

		/**
   * The active clients count
   * @type 	{Integer}
   */

	}, {
		key: 'activeClientsCount',
		get: function get() {
			return (0, _size3.default)(this.activeClients);
		}

		/**
   * Get the queued clients ids
   * @type 	{Array}
   */

	}, {
		key: 'queue',
		get: function get() {
			return this._queue;
		}

		/**
   * Get the queued clients objects
   * @type 		{Object}
   */

	}, {
		key: 'queuedClients',
		get: function get() {
			var _this5 = this;

			// construct the queuedClients object
			var queuedClients = {};
			this.queue.forEach(function (clientId) {
				queuedClients[clientId] = _this5.clients[clientId];
			});
			return queuedClients;
		}

		/**
   * Get the picked clients objects
   * @type 		{Object}
   */

	}, {
		key: 'pickedClients',
		get: function get() {
			var _this6 = this;

			// construct the queuedClients object
			var pickedClients = {};
			this._pickedClients.forEach(function (clientId) {
				pickedClients[clientId] = _this6.clients[clientId];
			});
			return pickedClients;
		}

		/**
   * The number of clients available for this room
   * @type 		{Integer}
   */

	}, {
		key: 'maxClients',
		get: function get() {
			return this._maxClients;
		}

		/**
   * The place in the queue of the current client
   * @type 		{Integer}
   */

	}, {
		key: 'placeInQueue',
		get: function get() {
			return this.queue.indexOf(this._socket.id);
		}

		/**
   * The estimation time in which it's the current client turn
   * @type 	{Number}
   */

	}, {
		key: 'waitTimeEstimation',
		get: function get() {

			if (this.isQueued()) {
				var countActiveClients = this._maxClients - (0, _size3.default)(this.activeClients) - this._pickedClients.length <= 0 ? 1 : 0;
				return (this.placeInQueue + +countActiveClients) * this.averageSessionDuration;
			} else if (this.isPicked()) {
				return 0;
			} else {
				var _countActiveClients = this._maxClients - (0, _size3.default)(this.activeClients) - this._pickedClients.length <= 0 ? 1 : 0;
				return (this.queue.length + _countActiveClients) * this.averageSessionDuration;
			}
		}

		/**
   * The estimation of each sessions in the room
   * @type 		{Number}
   */

	}, {
		key: 'averageSessionDuration',
		get: function get() {
			return this._averageSessionDuration;
		}

		/**
   * The picked timeout if has been picked in the room
   * @type 		{Number}
   */

	}, {
		key: 'pickedTimeout',
		get: function get() {
			return this._pickedTimeout;
		}

		/**
   * The picked queue remaining timeout
   * @type  		{Number}
   */

	}, {
		key: 'pickedRemainingTimeout',
		get: function get() {
			return this._pickedRemainingTimeout;
		}

		/**
   * The session duration authorized in this room
   * @type 		{Number}
   */

	}, {
		key: 'sessionDuration',
		get: function get() {
			return this._sessionDuration;
		}

		/**
   * The end session remaining timeout
   * @type 		{Number}
   */

	}, {
		key: 'sessionRemainingTimeout',
		get: function get() {
			return this._sessionRemainingTimeout;
		}

		/**
   * The end session notification timeout duration
   * @type 		{Number}
   */

	}, {
		key: 'endSessionNotificationTimeout',
		get: function get() {
			return this._endSessionNotificationTimeout;
		}
	}]);

	return Room;
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


(0, _eventEmitter2.default)(Room.prototype);

// export the Room class
exports.default = Room;