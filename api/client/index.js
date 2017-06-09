'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _room = require('./room');

var _room2 = _interopRequireDefault(_room);

var _client = require('./client');

var _client2 = _interopRequireDefault(_client);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var api = {
	Client: _client2.default,
	Room: _room2.default
};
exports.default = api;