import __socketIoP2p from 'socket.io-p2p'
import __socketIo from 'socket.io-client'
import __settings from './settings'
import __eventEmitter from 'event-emitter';
import __Room from './room';
import _merge from 'lodash/merge';

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


class Client {

	data = {};

	_socket = null;
	_id = null;
	_joinedRooms = {};
	_availableRooms = {};
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
			// listen for rooms
			this._socket.on('available-rooms', (rooms) => {

				// remove the rooms that have dissapeard
				Object.keys(this._availableRooms).forEach((roomId) => {
					if ( ! rooms[roomId]) {
						this._availableRooms[roomId] && this._availableRooms[roomId].destroy();
						delete this._availableRooms[roomId];
					}
				});

				// save the rooms
				Object.keys(rooms).forEach((roomId) => {
					if (this._availableRooms[roomId]) {
						this._availableRooms[roomId].updateData(rooms[roomId]);
					} else {
						this._availableRooms[roomId] = new __Room(rooms[roomId], this._socket, this._settings);
						// listen when the room has been left
						this._availableRooms[roomId].on('left', (room) => {
							delete this._joinedRooms[room.id];
							this.emit('left', room);
						});
						this._availableRooms[roomId].on('client.left', (room, client) => {
							this.emit('client.left', room, client);
						});
						this._availableRooms[roomId].on('joined', (room) => {
							this._joinedRooms[room.id] = this._availableRooms[room.id];
							this.emit('joined', room);
						});
						this._availableRooms[roomId].on('client.joined', (room, client) => {
							this.emit('client.joined', room, client);
						});
						this._availableRooms[roomId].on('picked', (room) => {
							this.emit('picked', room);
						});
						this._availableRooms[roomId].on('client.picked', (room, client) => {
							this.emit('client.picked', room, client);
						});
						this._availableRooms[roomId].on('queued', (room) => {
							this.emit('queued', room);
						});
						this._availableRooms[roomId].on('client.queued', (room, client) => {
							this.emit('client.queued', room, client);
						});
						this._availableRooms[roomId].on('picked-timeout', (room, remainingTime) => {
							this.emit('picked-timeout', room, remainingTime);
						});
						this._availableRooms[roomId].on('missed-turn', (room) => {
							this.emit('missed-turn', room);
						});
					}
				});

				this.log.success(`Available rooms : ${this._availableRooms}`);

				// emit new rooms
				this.emit('available-rooms', this._availableRooms);
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
		// join a room
		if (this._joinedRooms[roomId]) {
			reject(`You cannot join the room "${roomId}" cause this client has already joined it...`);
			return;
		}

		// if not annouced
		if ( ! this.isAnnounced()) {
			reject(`You need to announce the client first with the "Client.announce" method...`);
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
	leave(roomId) {
		// left the room
		return this._joinedRooms[roomId].leave();
	}

	/**
	 * All the rooms available to join
	 * @type 		{Object}
	 */
	get availableRooms() {
		return this._availableRooms;
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
