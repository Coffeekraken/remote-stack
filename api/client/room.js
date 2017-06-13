'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _socket = require('socket.io-client');

var _socket2 = _interopRequireDefault(_socket);

var _settings = require('./settings');

var _settings2 = _interopRequireDefault(_settings);

var _uniqid = require('uniqid');

var _uniqid2 = _interopRequireDefault(_uniqid);

var _merge2 = require('lodash/merge');

var _merge3 = _interopRequireDefault(_merge2);

var _eventEmitter = require('event-emitter');

var _eventEmitter2 = _interopRequireDefault(_eventEmitter);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Room = function () {
	function Room(data, socket) {
		var _this = this;

		_classCallCheck(this, Room);

		this._id = null;
		this._name = null;
		this._clients = {};
		this._activeClients = {};
		this._queue = [];
		this._joined = false;
		this._leaveCb = null;
		this._leavePromiseResolve = null;
		this._leavePromiseReject = null;
		this._joinPromiseResolve = null;
		this._joinPromiseReject = null;
		this._processedMsg = {};
		this._socket = null;

		// save the socket
		this._socket = socket;
		// save the room name to join
		this.updateData(data);

		// listen for new room data
		this._socket.on('new-room-data.' + data.id, function (data) {
			console.log('new data', data);
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

		this._socket.on('joined-room-' + data.id, function () {
			if (!_this.id) return;
			// resolve the promise
			_this._joinPromiseResolve(_this);
			// let the app know that we have left the room
			_this.emit('joined', _this);
		});
	}

	_createClass(Room, [{
		key: 'sendToClients',
		value: function sendToClients(something) {
			if (!this.hasJoined()) {
				throw 'You cannot send something to client in the room "' + this.id + '" cause you don\'t has joined it yet...';
				return;
			}

			if ((typeof something === 'undefined' ? 'undefined' : _typeof(something)) === 'object') {
				something._roomId = this.id;
			}

			this._socket.emit('send-to-clients', something);
		}
	}, {
		key: 'sendToApp',
		value: function sendToApp(something) {
			if (!this.hasJoined()) {
				throw 'You cannot send something to app in the room "' + this.id + '" cause you don\'t has joined it yet...';
				return;
			}

			if ((typeof something === 'undefined' ? 'undefined' : _typeof(something)) === 'object') {
				something._roomId = this.id;
			}

			this._socket.emit('send-to-app', something);
		}

		/**
   * Leave this room
   */

	}, {
		key: 'leave',
		value: function leave() {
			var _this2 = this;

			return new Promise(function (resolve, reject) {

				// check that we have joined the room before
				if (!_this2.hasJoined()) {
					reject('You cannot leave a the room "' + _this2.id + '" cause you have not joined it yet...');
					return;
				}

				_this2._leavePromiseReject = reject;
				_this2._leavePromiseResolve = resolve;

				// this._socket.useSockets = true;
				// this._socket.usePeerConnection = false;

				_this2._socket.off('receive-from-client');

				_this2._socket.emit('leave', _this2.id);
			});
		}
	}, {
		key: 'join',
		value: function join() {
			var _this3 = this;

			return new Promise(function (resolve, reject) {

				// check that we have joined the room before
				if (_this3.hasJoined()) {
					reject('You cannot join a the room "' + _this3.id + '" cause you have already joined it...');
					return;
				}

				_this3._joinPromiseReject = reject;
				_this3._joinPromiseResolve = resolve;

				_this3._socket.on('receive-from-client', function (something) {
					console.error('receive from client', something);
				});

				_this3._socket.emit('join', _this3.id);

				// this._socket.usePeerConnection = true;
				// this._socket.useSockets = false;
			});
		}
	}, {
		key: 'destroy',
		value: function destroy() {
			// stop listening for this room datas
			this._socket.off('new-room-data.' + this.id);
			// remove some datas to clean memory
			delete this._clients;
			delete this._queue;
			delete this._activeClients;
		}
	}, {
		key: 'updateData',
		value: function updateData(data) {
			this._id = data.id;
			this._name = data.name;
			// _merge(this._clients, data.clients);
			this._clients = data.clients;
			this._activeClients = data.activeClients;
			this._queue = data.queue;
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
		key: 'hasJoined',


		/**
   * Return if the current client has joined the room or not
   * @return  	{Boolean} 		true if the client has joined the room, false if not
   */
		value: function hasJoined() {
			return this.clients[this._socket.id || this._socket.socket.id] != null;
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
	}]);

	return Room;
}();

// make the room class an emitter capable object


(0, _eventEmitter2.default)(Room.prototype);

// export the Room class
exports.default = Room;