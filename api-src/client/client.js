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
 * client.on('client.queued', (room) => {
 * 	// client has been queued in the passed room after client.join('cool-room') call...
 * });
 * client.on('client.picked', (room) => {
 *  // client has been picked in the passed room...
 *  // you can at this point be confident that the client.join('cool-room') will succeed
 *  // but you need to call it again yourself...
 * });
 * client.on('client.picked-timeout', (room, remainingTimeout) => {
 * 	// do something on each tick of the picked timeout...
 * });
 *
 * @author  	Olivier Bossel <olivier.bossel@gmail.com>
 */

/**
 * @event
 * @name  	client.announced
 * Notify that the client has been announced to the server
 *
 * @example 	js
 * myClient.on('client.annouced', () => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	client.joined
 * Notify that the client has successfuly joined a room
 *
 * @param 	{Room} 		room 		The joined room object
 *
 * @example 	js
 * myClient.on('client.joined', (room) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	client.left
 * Notify that the client has successfuly left a room
 *
 * @param 	{Room} 		room 		The left room object
 *
 * @example 	js
 * myClient.on('client.left', (room) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	client.queued
 * Notify that the client has been queued in a particular room
 *
 * @param 	{Room} 		room 		The room object
 *
 * @example 	js
 * myClient.on('client.queued', (room) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	client.picked
 * Notify that the client has been picked in a particular room
 *
 * @param 	{Room} 		room 		The room object
 *
 * @example 	js
 * myClient.on('client.picked', (room) => {
 * 	// try to join the room again here...
 * 	// you can be confident that the join will be a success until the picked-timeout is not finished...
 * });
 */

/**
 * @event
 * @name  	client.picked-timeout
 * Notify each second of the remaining timeout left to join the room when the client has been picked
 *
 * @param 	{Room} 		room 					The room object
 * @param 	{Integer} 	remainingTimeout 		The timeout left before the client is being kicked of the picked queue
 *
 * @example 	js
 * myClient.on('client.picked-timeout', (room, remainingTimeout) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name  	client.missed-turn
 * Notify that the client has missed his turn after being picked
 *
 * @param 	{Room} 		room 		The room object
 *
 * @example 	js
 * myClient.on('client.missed-turn', (room) => {
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
				this.emit('client.announced', this);
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
						this._availableRooms[roomId] = new __Room(rooms[roomId], this._socket);
						// listen when the room has been left
						this._availableRooms[roomId].on('client.left', (room) => {
							console.log('leeeeeft', room);
							delete this._joinedRooms[room.id];
							this.emit('client.left', room);
						});
						this._availableRooms[roomId].on('client.joined', (room) => {
							this._joinedRooms[room.id] = this._availableRooms[room.id];
							this.emit('client.joined', room);
						});
						this._availableRooms[roomId].on('client.picked', (room) => {
							this.emit('client.picked', room);
						});
						this._availableRooms[roomId].on('client.queued', (room) => {
							this.emit('client.queued', room);
						});
						this._availableRooms[roomId].on('client.picked-timeout', (room, remainingTime) => {
							this.emit('client.picked-queue-timeout', room, remainingTime);
						});
						this._availableRooms[roomId].on('client.missed-turn', (room) => {
							this.emit('client.missed-turn', room);
						});
					}
				});

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
	 * @type 		{Object<Room>}
	 */
	get availableRooms() {
		return this._availableRooms;
	}

	/**
	 * All the rooms in which the client is in
	 * @type 		{Object<Room>}
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
			console.log(`%c Remote stack client : ${message}`, 'color: green');
		},
		error : (message) => {
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
