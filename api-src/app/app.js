import __socketIoP2p from 'socket.io-p2p'
import __socketIo from 'socket.io-client'
import __settings from './settings'
import __eventEmitter from 'event-emitter';
import _merge from 'lodash/merge';
import __pako from 'pako';

/**
 * @name  		App
 * Application proxy to connect into a room and be remotely controlled from any devices through sockets
 * @example 		js
 * import __remoteStack from 'coffeekraken-remote-stack'
 * const app = new __remoteStack.App({
 *  	name : 'My cool app'
 * });
 * app.announce('my-cool-room').then(() => {
 *  	// listen for some events, etc...
 *  	app.on('client.data', (data, client) => {
 *  		// do something with the data from the client
 *  	});
 *  	app.on('client.joined', (client) => {
 *  		// handle new client
 *  	});
 *  	app.on('client.left', (client) => {
 *  		// handle the left client
 *  	});
 * });
 *
 * @author 		Olivier Bossel <olivier.bossel@gmail.com>
 */

/**
 * @event
 * @name  app.announced
 * Notify that the app has been announced inside his room
 *
 * @example 	js
 * myApp.on('app.annouced', () => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  app.joined
 * Notify that the app has joined his room
 *
 * @example 	js
 * myApp.on('app.joined', () => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  client.data
 * Notify that the app has received some data from a client
 * @param 	{Object} 	data 		The data sent by the client
 * @param 	{Object} 	from 		The client object that has sent the data
 *
 * @example 	js
 * myApp.on('client.data', (data, from) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  client.joined
 * Notify that a client has joined the app
 * @param 	{Object} 	from 		The client object that has sent the data
 *
 * @example 	js
 * myApp.on('client.joined', (client) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  client.left
 * Notify that a client has left the app
 * @param 	{Object} 	from 		The client object that has sent the data
 *
 * @example 	js
 * myApp.on('client.left', (client) => {
 * 	// do something here...
 * });
 */

class App {

	data = {};
	_socket = null;
	_id = null;
	_announced = false;

	/**
	 * @constructor
	 * @param  		{Object} 		[data={}] 		The data you want to assign to the app
	 * @param 		{Object} 		[settings={}] 	Configure the app socket through this settings
	 */
	constructor(data = {}, settings = {}) {
		// save the app data
		this.data = data

		// extend settings
		this._settings = {
			...__settings,
			...settings
		}
	}

	/**
	 * Announce the app in a particular room available on the server side.
	 * One room can contain only one app.
	 * @param 		{String} 		roomId 		The id of the room to join
	 * @return 		{Promise} 					A promise
	 */
	announce(roomId) {
		return new Promise((resolve) => {
			let socketUrl = this._settings.host;
			if (this._settings.port) {
				socketUrl += `:${this._settings.port}`;
			}
			this._socket = __socketIo(socketUrl);
			this._socket.on('connect', () => {
				// save the client id
				this._id = this._socket.id;
				// announce the client
				this._socket.emit('app.announce', this.data, roomId);
			});
			this._socket.on('app.announced', (data) => {
				// update client state
				this._announced = true;
				// the client has been annouced correctly
				resolve(this);
				// emit an event
				this.emit('app.announced', this);
				// log
				this.log.success('App successfuly announced');
			});

			// listen for joined room
			this._socket.on('app.joined', (room) => {
				this.log.success(`App successfuly added to the "${roomId}" room`);
				this.emit('app.joined', this);
			});

			this._socket.on('client.data', (data, from) => {
				// decompress data if needed
				if (this._settings.compression) {
					data = JSON.parse(__pako.inflate(data, { to: 'string' }));
				}
				this.log.success(`received ${data} from client ${from.id}`);
				this.emit('client.data', data, from);
			});

			this._socket.on('client.joined', (client) => {
				this.log.success(`new client ${client.id}`);
				this.emit('client.joined', client);
			});

			this._socket.on('client.left', (client) => {
				this.log.success(`client ${client.id} has left`);
				this.emit('client.left', client);
			});
		});
	}

	/**
	 * Return if the app has been annouced in a room or not
	 * @return 		{Boolean} 			true if announced, false if not
	 */
	isAnnounced() {
		return this._announced;
	}

	/**
	 * Send something to all or some clients that are connected to this app through a room
	 * @param 		{Object} 		data 		 			The data to send
	 * @param 		{Array|String} 	[clientIds=null] 		The id's of the clients to send the data to
	 */
	sendToClients(something, clientIds = null) {
		this._socket.emit(`app.data`, something, clientIds);
	}

	log = {
		success : (message) => {
			if ( ! this._settings.debug) return;
			console.log(`%c Remote stack app : ${message}`, 'color: green');
		},
		error : (message) => {
			if ( ! this._settings.debug) return;
			console.log(`%c Remote stack app : ${message}`, 'color: red');
		}
	}
}

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
__eventEmitter(App.prototype);

export default App;
