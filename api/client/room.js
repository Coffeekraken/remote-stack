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

var Room = function () {
	// _queuedClientsEstimations = {};
	function Room(data, socket) {
		var _this = this;

		var settings = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

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
		this._settings = {};
		this._socket = null;


		// extend settings
		this._settings = _extends({}, _settings2.default, settings);

		// save the socket
		this._socket = socket;
		// save the room name to join
		this.updateData(data);

		// listen for new room data
		this._socket.on('new-room-data.' + data.id, function (data) {
			data = JSON.parse(_pako2.default.inflate(data, { to: 'string' }));
			// new room data
			_this.updateData(data);
		});

		this._socket.on('left-room-' + data.id, function () {
			if (!_this.id) return;
			// resolve the promise
			_this._leavePromiseResolve(_this);
			// let the app know that we have left the room
			_this.emit('left', _this);
		});

		this._socket.on('queued-room-' + data.id, function () {
			if (!_this.id) return;
			_this.emit('queued', _this);
		});

		this._socket.on('picked-room-' + data.id, function () {
			console.log('PICKED', _this);
			if (!_this.id) return;
			_this.emit('picked', _this);

			// start timer of the picked queue
			_this._startPickedQueueTimeout();
		});

		this._socket.on('joined-room-' + data.id, function () {
			if (!_this.id) return;
			// resolve the promise
			_this._joinPromiseResolve(_this);
			// let the app know that we have left the room
			_this.emit('joined', _this);
		});

		this._socket.on('receive-from-client-' + data.id, function (something) {
			// decompress data
			something = JSON.parse(_pako2.default.inflate(something, { to: 'string' }));
			console.error('receive from client', something);
			// let the app know that we have received something from another client
			_this.emit('receive-from-client', something);
		});
	}

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
					_this2.emit('missed-turn', _this2);

					// leave the room unfortunately...
					_this2.leave();
				}
			}, 1000);
		}
	}, {
		key: 'sendToClients',
		value: function sendToClients(something) {
			if (!this.hasJoined()) {
				throw 'You cannot send something to client in the room "' + this.id + '" cause you don\'t has joined it yet...';
				return;
			}

			if (this._settings.compression) {
				something = _pako2.default.deflate(JSON.stringify(something), { to: 'string' });
			}

			this._socket.emit('send-to-clients', this.id, something);
		}
	}, {
		key: 'sendToApp',
		value: function sendToApp(something) {
			if (!this.hasJoined()) {
				throw 'You cannot send something to app in the room "' + this.id + '" cause you don\'t has joined it yet...';
				return;
			}
			if (this._settings.compression) {
				something = _pako2.default.deflate(JSON.stringify(something), { to: 'string' });
			}
			this._socket.emit('send-to-app', this.id, something);
		}

		/**
   * Leave this room
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
				_this3._socket.off('receive-from-client');
				_this3._socket.emit('leave', _this3.id);
			});
		}
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

				_this4._socket.emit('join', _this4.id);
			});
		}
	}, {
		key: 'destroy',
		value: function destroy() {
			// stop listening for this room datas
			this._socket.off('new-room-data.' + this.id);
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
		}
	}, {
		key: '_onJoined',
		value: function _onJoined() {
			var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

			console.log('joined', data);
			// emit an event
			this.emit('joined', data);
		}
	}, {
		key: '_onQueued',
		value: function _onQueued() {
			var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

			console.log('queued', data);
			this.emit('queued', data);
		}
	}, {
		key: '_onPicked',
		value: function _onPicked() {
			var data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

			console.log('picked', data);
			this.emit('picked', data);
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
   * Get the queue
   * @type 	{Array}
   */

	}, {
		key: 'queue',
		get: function get() {
			return this._queue;
		}

		/**
   * Get the queued clients
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
			console.log('queuedClients', queuedClients);
			return queuedClients;
		}

		/**
   * Get the picked clients
   * @type 		{Object<Object>}
   */

	}, {
		key: 'pickedQueueClients',
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
   * The places number
   * @type 		{Integer}
   */

	}, {
		key: 'places',
		get: function get() {
			return this._places;
		}

		/**
   * The place in the queue
   * @type 		{Integer}
   */

	}, {
		key: 'placeInQueue',
		get: function get() {
			return this.queue.indexOf(this._socket.id);
		}

		/**
   * The estimation time in which it's our turn
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
		key: 'pickedQueueTimeout',
		get: function get() {
			return this._pickedQueueTimeout;
		}

		/**
   * The picked queue remaining timeout
   * @type  		{Number}
   */

	}, {
		key: 'pickedQueueRemainingTimeout',
		get: function get() {
			return this._pickedQueueRemainingTimeout;
		}
	}]);

	return Room;
}();

// make the room class an emitter capable object


(0, _eventEmitter2.default)(Room.prototype);

// export the Room class
exports.default = Room;