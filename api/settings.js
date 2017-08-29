"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
/**
 * @name 	App settings
 * Define the App class default settings
 */

exports.default = {

	/**
  * The socket.io server host to connect to
  * @type 	{String}
  */
	host: document.location.hostname,

	/**
  * The socket.io server port to connect to
  * @type 	{Integer}
  */
	port: 3030,

	debug: false,
	compression: false
};