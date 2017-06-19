'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _socket = require('socket.io-client');

var _socket2 = _interopRequireDefault(_socket);

var _uniqid = require('uniqid');

var _uniqid2 = _interopRequireDefault(_uniqid);

var _merge2 = require('lodash/merge');

var _merge3 = _interopRequireDefault(_merge2);

var _size2 = require('lodash/size');

var _size3 = _interopRequireDefault(_size2);

var _pako = require('pako');

var _pako2 = _interopRequireDefault(_pako);

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

var Room = function () {

	/**
  * @constructor
  * @param 	{Object} 		data 		The room data object
  * @param 	{SocketIo} 		socket 		The socket instance used to communicate with the server
  */
	function Room(data, socket) {
		var _this = this;

		_classCallCheck(this, Room);

		this._id = null;
		this._name = null;
		this._clients = {};
		this._activeClients = {};
		this._queue = [];
		this._pickedQueue = [];
		this._pickedQueueTimeout = null;
		this._pickedQueueRemainingTimeout = null;
		this._simultaneous = 0;
		this._places = 0;
		this._averageSessionDuration = 0;
		this._leavePromiseResolve = null;
		this._leavePromiseReject = null;
		this._joinPromiseResolve = null;
		this._joinPromiseReject = null;
		this._socket = null;


		// save the socket
		this._socket = socket;
		// save the room name to join
		this.updateData(data);

		// listen for new room data
		this._socket.on('room.' + data.id + '.data', function (data) {
			data = JSON.parse(_pako2.default.inflate(data, { to: 'string' }));
			// new room data
			_this.updateData(data);
		});

		this._socket.on('room.' + data.id + '.left', function () {
			if (!_this.id) return;
			// resolve the promise
			_this._leavePromiseResolve(_this);
			// let the app know that we have left the room
			_this.emit('client.left', _this);
		});

		this._socket.on('room.' + data.id + '.queued', function () {
			if (!_this.id) return;
			_this.emit('client.queued', _this);
		});

		this._socket.on('room.' + data.id + '.picked', function () {
			console.log('PICKED', _this);
			if (!_this.id) return;
			_this.emit('client.picked', _this);

			// start timer of the picked queue
			_this._startPickedQueueTimeout();
		});

		this._socket.on('room.' + data.id + '.joined', function () {
			if (!_this.id) return;
			// resolve the promise
			_this._joinPromiseResolve(_this);
			// let the app know that we have left the room
			_this.emit('client.joined', _this);
		});

		this._socket.on('room.' + data.id + '.app.data', function (something) {
			// let the app know that we have received something from the app
			_this.emit('app.data', something);
		});

		this._socket.on('room.' + this.id + '.client.data', function (something) {
			// let the app know that we have received something from another client
			_this.emit('client.data', something);
		});
	}

	/**
  * Start the picked timeout
  */

	// _queuedClientsEstimations = {};


	_createClass(Room, [{
		key: '_startPickedQueueTimeout',
		value: function _startPickedQueueTimeout() {
			var _this2 = this;

			// save the initial time
			this._pickedQueueRemainingTimeout = this._pickedQueueTimeout;

			// emit a picked queue timeout event
			this.emit('picked-queue-timeout', this, this._pickedQueueRemainingTimeout);

			// create the timeout
			this._pickedQueueTimeoutInterval = setInterval(function () {
				_this2._pickedQueueRemainingTimeout = _this2._pickedQueueRemainingTimeout - 1000;
				console.log('new picked queue current time', _this2._pickedQueueRemainingTimeout);

				// emit a picked queue timeout event
				_this2.emit('picked-queue-timeout', _this2, _this2._pickedQueueRemainingTimeout);

				if (_this2._pickedQueueRemainingTimeout <= 0) {
					// end of time
					console.log('end of picked queue...');
					clearInterval(_this2._pickedQueueTimeoutInterval);

					// emit a missed-turn event
					_this2.emit('client.missed-turn', _this2);

					// leave the room unfortunately...
					_this2.leave();
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
			var _this3 = this;

			return new Promise(function (resolve, reject) {

				// check that we have joined the room before
				if (!_this3.hasJoined() && !_this3.isQueued() && !_this3.isPicked()) {
					reject('You cannot leave a the room "' + _this3.id + '" cause you have not joined it yet...');
					return;
				}

				_this3._leavePromiseReject = reject;
				_this3._leavePromiseResolve = resolve;
				_this3._socket.off('client.to.clients');
				_this3._socket.emit('client.leave', _this3.id);
			});
		}

		/**
   * Ask to join the room
   * This request can lead to a "client.queued" event if this room is full. You will need to
   * call this method again when you receive the "client.picked" event
   *
  	 * @return  {Promise} 					A promise that will be resolved only if the client is accepted directly in the room
   */

	}, {
		key: 'join',
		value: function join() {
			var _this4 = this;

			return new Promise(function (resolve, reject) {

				// if the user has bein picked and has clicked on the "join" again,
				// we stop the picked queue timeout
				if (_this4.isPicked()) {
					_this4._pickedQueueRemainingTimeout = null;
					clearInterval(_this4._pickedQueueTimeoutInterval);
				}

				// check that we have joined the room before
				if (_this4.hasJoined()) {
					reject('You cannot join a the room "' + _this4.id + '" cause you have already joined it...');
					return;
				}

				_this4._joinPromiseReject = reject;
				_this4._joinPromiseResolve = resolve;

				_this4._socket.emit('client.join', _this4.id);
			});
		}

		/**
   * Destroy this room instance locally
   */

	}, {
		key: 'destroy',
		value: function destroy() {
			// stop listening for this room datas
			this._socket.off('room.' + this.id + '.data');
			this._socket.off('room.' + this.id + '.joined');
			this._socket.off('room.' + this.id + '.left');
			this._socket.off('room.' + this.id + '.picked');
			this._socket.off('room.' + this.id + '.queued');
			this._socket.off('room.' + this.id + '.app.data');
			this._socket.off('room.' + this.id + '.client.data');
			// remove some datas to clean memory
			delete this._name;
			delete this._id;
			delete this._clients;
			delete this._queue;
			delete this._activeClients;
			delete this._simultaneous;
			// delete this._queuedClientsEstimations;
			delete this._pickedQueueTimeout;
			delete this._pickedQueueRemainingTimeout;
			delete this._pickedQueue;
			delete this._places;
			clearInterval(this._pickedQueueTimeoutInterval);
			delete this._pickedQueueTimeoutInterval;
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
			// _merge(this._clients, data.clients);
			this._clients = data.clients;
			this._activeClients = data.activeClients;
			this._simultaneous = data.simultaneous;
			// this._queuedClientsEstimations = data.queuedClientsEstimations;
			this._pickedQueueTimeout = data.pickedQueueTimeout;
			this._averageSessionDuration = data.averageSessionDuration;
			this._queue = data.queue;
			this._pickedQueue = data.pickedQueue;
			this._places = data.simultaneous;
			return this;
		}
	}, {
		key: '_onJoined',
		value: function _onJoined() {
			var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

			console.log('joined', data);
			// emit an event
			this.emit('client.joined', data);
		}
	}, {
		key: '_onQueued',
		value: function _onQueued() {
			var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

			console.log('queued', data);
			this.emit('client.queued', data);
		}
	}, {
		key: '_onPicked',
		value: function _onPicked() {
			var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

			console.log('picked', data);
			this.emit('client.picked', data);
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
			return this._pickedQueue.indexOf(this._socket.id) !== -1;
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
   * The clients in the room
   * @type  	{Array<Client>}
   */

	}, {
		key: 'clients',
		get: function get() {
			return this._clients;
		}

		/**
   * The active clients
   * @type  	{Array<Client>}
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
   * @type 		{Object<Object>}
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
   * @type 		{Object<Object>}
   */

	}, {
		key: 'pickedClients',
		get: function get() {
			var _this6 = this;

			// construct the queuedClients object
			var pickedClients = {};
			this._pickedQueue.forEach(function (clientId) {
				pickedClients[clientId] = _this6.clients[clientId];
			});
			return pickedClients;
		}

		/**
   * The number of places available for this room
   * @type 		{Integer}
   */

	}, {
		key: 'places',
		get: function get() {
			return this._places;
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
				var countActiveClients = this._simultaneous - (0, _size3.default)(this.activeClients) - this._pickedQueue.length <= 0 ? 1 : 0;
				return (this.placeInQueue + +countActiveClients) * this.averageSessionDuration;
			} else if (this.isPicked()) {
				return 0;
			} else {
				var _countActiveClients = this._simultaneous - (0, _size3.default)(this.activeClients) - this._pickedQueue.length <= 0 ? 1 : 0;
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
			return this._pickedQueueTimeout;
		}

		/**
   * The picked queue remaining timeout
   * @type  		{Number}
   */

	}, {
		key: 'pickedRemainingTimeout',
		get: function get() {
			return this._pickedQueueRemainingTimeout;
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