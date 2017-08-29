import __socketIoP2p from 'socket.io-p2p'
import __socketIo from 'socket.io-client'
import __settings from './settings'
import __eventEmitter from 'event-emitter';
import __Room from './room';
import _merge from 'lodash/merge';
import _union from 'lodash/union';

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
 * @name  	room.joined
 * Notify that the client has successfuly joined a room
 *
 * @param 	{Room} 		room 		The joined room object
 *
 * @example 	js
 * myClient.on('room.joined', (room) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	room.left
 * Notify that the client has successfuly left a room
 *
 * @param 	{Room} 		room 		The left room object
 *
 * @example 	js
 * myClient.on('room.left', (room) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	room.closed
 * Notify that the a room that the client has joined has been closed
 *
 * @param 	{Room} 		room 		The left room object
 *
 * @example 	js
 * myClient.on('room.closed', (room) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	room.queued
 * Notify that the client has been queued in a particular room
 *
 * @param 	{Room} 		room 		The room object
 *
 * @example 	js
 * myClient.on('room.queued', (room) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	room.picked
 * Notify that the client has been picked in a particular room
 *
 * @param 	{Room} 		room 		The room object
 *
 * @example 	js
 * myClient.on('room.picked', (room) => {
 * 	// try to join the room again here...
 * 	// you can be confident that the join will be a success until the picked-remaining-timeout is not finished...
 * });
 */

/**
 * @event
 * @name  	room.missed-turn
 * Notify that the client has missed his turn after being picked
 *
 * @param 	{Room} 		room 		The room object
 *
 * @example 	js
 * myClient.on('room.missed-turn', (room) => {
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

class Client {

	data = {};

	_socket = null;
	_id = null;
	_joinedRooms = {};
	_knownedRooms = {};
	_announced = false;

	/**
	 * @constructor
	 * @param  		{Object} 		[data={}] 		The data you want to assign to the client
	 * @param 		{Object} 		[settings={}] 	Configure the app socket through this settings
	 */
	constructor(data = {}, settings = {}) {
		// save the user data
		this.data = data

		// extend settings
		this._settings = {
			...__settings,
			...settings
		}
	}

	/**
	 * Announce the client to the socket.io server.
	 * @return 		{Promise} 					A promise
	 */
	announce() {
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
				this._socket.emit('client.announce', this.data);
			});
			this._socket.on('_error', (errorObj) => {
				if (this._settings.debug) console.error('Remote stack client', errorObj);
				this.emit('error', errorObj);
			});
			this._socket.on('room.joined', (roomData) => {
				this._joinedRooms[roomData.id] = this._knownedRooms[roomData.id];
				this.emit('room.joined', this._knownedRooms[roomData.id]);
			});
			this._socket.on('room.left', (roomData) => {
				this._socket.off(`room.${roomData.id}.metas`);
				this.emit('room.left', this._knownedRooms[roomData.id]);
				delete this._joinedRooms[roomData.id];
			});
			this._socket.on('room.closed', (roomData) => {
				this._socket.off(`room.${roomData.id}.metas`);
				this.emit('room.closed', this._knownedRooms[roomData.id]);
				delete this._joinedRooms[roomData.id];
			});
			this._socket.on('room.queued', (roomData) => {
				this.emit('room.queued', this._knownedRooms[roomData.id]);
			});
			this._socket.on('room.picked', (roomData) => {
				this.emit('room.picked', this._knownedRooms[roomData.id]);
			});
			this._socket.on('room.missed-turn', (roomData) => {
				this.emit('room.missed-turn', this._knownedRooms[roomData.id]);
			});

			this._socket.on('client.announced', (data) => {
				// update client state
				this._announced = true;
				// the client has been annouced correctly
				resolve(this);
				// emit an event
				this.emit('announced', this);
				// log
				this.log.success('Successfuly announced');
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
	join(roomId) {

		return new Promise((resolve, reject) => {

			// join a room
			if (this._joinedRooms[roomId] && this._joinedRooms[roomId].hasJoined()) {
				reject(`You cannot join the room "${roomId}" cause this client has already joined it...`);
				return;
			}

			// if not annouced
			if ( ! this.isAnnounced()) {
				reject(`You need to announce the client first with the "Client.announce" method...`);
				return;
			}

			// listen when we get the room datas
			this._socket.on(`room.${roomId}.metas`, (room) => {
				console.log('room metas', room);
				if ( ! this._knownedRooms[room.id]) {
					this._knownedRooms[room.id] = new __Room(room, this._socket, this._settings);
				} else {
					this._knownedRooms[room.id].updateData(room);
				}
				// correctly joined the room
				resolve(this._knownedRooms[room.id]);
			});

			// try to join a room
			this._socket.emit('client.join', roomId);
		});
	}

	/**
	 * Destroy the client
	 */
	destroy() {
		this._socket.off('room.joined');
		this._socket.off('room.left');
		this._socket.off('room.queued');
		this._socket.off('room.picked');
		this._socket.off('room.missed-turn');
		this._socket.off('_error');
		this._socket.off('client.announced');
		delete this._joinedRooms;
		delete this._knownedRooms;
		this._socket.disconnect();
		delete this._socket;
	}

	/**
	 * All the rooms known rooms that the client has already try to join or joined
	 * @type 		{Object}
	 */
	get knownedRooms() {
		return this._knownedRooms;
	}

	/**
	 * All the rooms in which the client is in
	 * @type 		{Object}
	 */
	get joinedRooms() {
		return this._joinedRooms;
	}

	/**
	 * Return if the client has been annouced to the server
	 * @return 		{Boolean} 			true if announced, false if not
	 */
	isAnnounced() {
		return this._announced;
	}

	log = {
		success : (message) => {
			if ( ! this._settings.debug) return;
			console.log(`%c Remote stack client : ${message}`, 'color: green');
		},
		error : (message) => {
			if ( ! this._settings.debug) return;
			console.log(`%c Remote stack client : ${message}`, 'color: red');
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
__eventEmitter(Client.prototype);

export default Client;
