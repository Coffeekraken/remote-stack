'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _socket = require('socket.io-client');

var _socket2 = _interopRequireDefault(_socket);

var _settings = require('./settings');

var _settings2 = _interopRequireDefault(_settings);

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
		this._clients = [];
		this._activeClients = [];
		this._queue = [];
		this._socket = null;

		// save the socket
		this._socket = socket;
		// save the room name to join
		this._saveData(data);

		// listen for new room data
		this._socket.on('new-room-data.' + data.id, function (data) {
			// new room data
			console.log('new room data', data);
			_this._saveData(data);
		});
	}

	/**
  * Leave this room
  */


	_createClass(Room, [{
		key: 'leave',
		value: function leave() {
			var _this2 = this;

			return new Promise(function (resolve, reject) {
				_this2._socket.emit('leave', _this2.id, function (data) {
					console.log('room leaved!!!', _this2);
					// destroy the room locally
					_this2.destroy();

					// resolve the promise
					resolve();
				});
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
		key: '_saveData',
		value: function _saveData(data) {
			this._id = data.id;
			this._name = data.name;
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