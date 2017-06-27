import __socketIo from 'socket.io-client'
import __socketIoStream from 'socket.io-stream'
import __uniqid from 'uniqid'
import _merge from 'lodash/merge'
import _size from 'lodash/size'
import __pako from 'pako'
import __settings from './settings'

import __eventEmitter from 'event-emitter';

/**
 * @name 		Room
 * Room class that represent a room getted from the socket.io server
 * This class is usually instanciated by the Client one
 *
 * @author  	Olivier Bossel <olivier.bossel@gmail.com>
 */

/**
 * @event
 * @name  	joined
 * Notify that the client has successfuly joined a room
 *
 * @param 	{Room} 		room 		The joined room object
 *
 * @example 	js
 * myRoom.on('joined', (room) => {
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
 * myRoom.on('client.joined', (room, client) => {
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
 * myRoom.on('left', (room) => {
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
 * myRoom.on('client.left', (room, client) => {
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
 * myRoom.on('queued', (room) => {
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
 * myRoom.on('client.queued', (room, client) => {
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
 * myRoom.on('picked', (room) => {
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
 * myRoom.on('client.picked', (room) => {
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
 * myRoom.on('picked-timeout', (room, remainingTimeout) => {
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
 * myRoom.on('missed-turn', (room) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name 	client.data
 * Notify that a client has send some data to the room
 *
 * @paeam 	{Object} 		client 		The client object
 * @param 	{Object} 		data 		The data sent by the client
 *
 * @example 	js
 * myRoom.on('client.data', (client, data) => {
 * 	// do something here...
 * });
 */

/**
 * @event
 * @name 	app.data
 * Notify that the room app has send some data
 *
 * @param 	{Object} 		data 		The data sent by the app
 *
 * @example 	js
 * myRoom.on('app.data', (data) => {
 * 	// do something here...
 * });
 */

class Room {

	_id = null;
	_name = null;
	_clients = {};
	_activeClients = {};
	_queue = [];
	_pickedClients = [];
	_pickedTimeout = null;
	_pickedRemainingTimeout = null;
	_maxClients = 0;
	// _queuedClientsEstimations = {};
	_maxClients = 0;
	_averageSessionDuration = 0;
	_leavePromiseResolve = null;
	_leavePromiseReject = null;
	_joinPromiseResolve = null;
	_joinPromiseReject = null;

	_socket = null;

	/**
	 * @constructor
	 * @param 	{Object} 		data 		The room data object
	 * @param 	{SocketIo} 		socket 		The socket instance used to communicate with the server
	 */
	constructor(data, socket, settings = {}) {

		// extend settings
		this._settings = {
			...__settings,
			...settings
		}

		// save the socket
		this._socket = socket;
		// save the room name to join
		this.updateData(data);

		// listen for new room data
		this._socket.on(`room.${data.id}.data`, (data) => {
			data = JSON.parse(__pako.inflate(data, { to: 'string' }));

			this.log.success(`New room data : ${data}`);

			// new room data
			this.updateData(data);
		});

		this._socket.on(`room.${data.id}.left`, () => {
			if ( ! this.id) return;

			this.log.success(`Left ${this.id}`);

			// resolve the promise
			this._leavePromiseResolve(this);
			// let the app know that we have left the room
			this.emit('left', this);
		});

		this._socket.on(`room.${this.id}.client.left`, (room, client) => {
			if ( ! this.id) return;
			this.log.success(`The client ${client} has left the room ${this.id}`);
			this.emit('client.left', this, client);
		});

		this._socket.on(`room.${data.id}.queued`, () => {
			if ( ! this.id) return;

			this.log.success(`Queued in ${this.id}`);

			this.emit('queued', this);
		});

		this._socket.on(`room.${this.id}.client.queued`, (room, client) => {
			if ( ! this.id) return;
			this.log.success(`The client ${client} has been queued in the room ${this.id}`);
			this.emit('client.queued', this, client);
		});

		this._socket.on(`room.${data.id}.picked`, () => {
			if ( ! this.id) return;

			this.log.success(`Picked in ${this.id}`);

			this.emit('picked', this);

			// start timer of the picked queue
			this._startPickedClientsTimeout();

		});

		this._socket.on(`room.${this.id}.client.picked`, (room, client) => {
			if ( ! this.id) return;
			this.log.success(`The client ${client} has been picked in the room ${this.id}`);
			this.emit('client.picked', this, client);
		});

		this._socket.on(`room.${data.id}.joined`, () => {
			if ( ! this.id) return;

			this.log.success(`Joined ${this.id}`);

			// resolve the promise
			this._joinPromiseResolve(this);
			// let the app know that we have left the room
			this.emit('joined', this);
		});

		this._socket.on(`room.${this.id}.client.joined`, (room, client) => {
			if ( ! this.id) return;
			this.log.success(`The client ${client} has joined the room ${this.id}`);
			this.emit('client.joined', this, client);
		});

		this._socket.on(`room.${data.id}.app.data`, (something) => {

			this.log.success(`Received some data from the app : ${something}`);

			// let the app know that we have received something from the app
			this.emit('app.data', something);
		});

		this._socket.on(`room.${this.id}.client.data`, (client, something) => {

			this.log.success(`Received some data from the another client : ${something} ${client}`);

			// let the app know that we have received something from another client
			this.emit('client.data', client, something);
		});

	}

	/**
	 * Start the picked timeout
	 */
	_startPickedClientsTimeout() {
		// save the initial time
		this._pickedRemainingTimeout = this._pickedTimeout;

		// emit a picked queue timeout event
		this.emit('picked-timeout', this, this._pickedRemainingTimeout);

		// create the timeout
		this._pickedTimeoutInterval = setInterval(() => {
			this._pickedRemainingTimeout = this._pickedRemainingTimeout - 1000;

			this.log.success('picked timeout', this._pickedRemainingTimeout);

			// emit a picked queue timeout event
			this.emit('picked-timeout', this, this._pickedRemainingTimeout);

			if (this._pickedRemainingTimeout <= 0) {
				// end of time
				clearInterval(this._pickedTimeoutInterval);

				this.log.success('end of picked queue...');

				// emit a missed-turn event
				this.emit('missed-turn', this);

				// leave the room unfortunately...
				this.leave();
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
	sendToClients(something) {
		if ( ! this.hasJoined()) {
			throw(`You cannot send something to client in the room "${this.id}" cause you don't has joined it yet...`);
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
	sendToApp(something) {
		if ( ! this.hasJoined()) {
			throw(`You cannot send something to app in the room "${this.id}" cause you don't has joined it yet...`);
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
	leave() {
		return new Promise((resolve, reject) => {

			// check that we have joined the room before
			if ( ! this.hasJoined() && ! this.isQueued() && ! this.isPicked()) {
				reject(`You cannot leave a the room "${this.id}" cause you have not joined it yet...`);
				return;
			}

			this._leavePromiseReject = reject;
			this._leavePromiseResolve = resolve;
			this._socket.off('client.to.clients');
			this._socket.emit('client.leave', this.id);
		});
	}

	/**
	 * Ask to join the room
	 * This request can lead to a "client.queued" event if this room is full. You will need to
	 * call this method again when you receive the "client.picked" event
	 *
 	 * @return  {Promise} 					A promise that will be resolved only if the client is accepted directly in the room
	 */
	join() {
		return new Promise((resolve, reject) => {

			// if the user has bein picked and has clicked on the "join" again,
			// we stop the picked queue timeout
			if (this.isPicked()) {
				this._pickedRemainingTimeout = null;
				clearInterval(this._pickedTimeoutInterval);
			}

			// check that we have joined the room before
			if (this.hasJoined()) {
				reject(`You cannot join a the room "${this.id}" cause you have already joined it...`);
				return;
			}

			this._joinPromiseReject = reject;
			this._joinPromiseResolve = resolve;

			this._socket.emit('client.join', this.id);
		});
	}

	/**
	 * Destroy this room instance locally
	 */
	destroy() {
		// stop listening for this room datas
		this._socket.off(`room.${this.id}.data`);
		this._socket.off(`room.${this.id}.joined`);
		this._socket.off(`room.${this.id}.left`);
		this._socket.off(`room.${this.id}.picked`);
		this._socket.off(`room.${this.id}.queued`);
		this._socket.off(`room.${this.id}.app.data`);
		this._socket.off(`room.${this.id}.client.data`);
		// remove some datas to clean memory
		delete this._name;
		delete this._id;
		delete this._clients;
		delete this._queue;
		delete this._activeClients;
		delete this._maxClients;
		// delete this._queuedClientsEstimations;
		delete this._pickedTimeout;
		delete this._pickedRemainingTimeout;
		delete this._pickedClients;
		delete this._maxClients;
		clearInterval(this._pickedTimeoutInterval);
		delete this._pickedTimeoutInterval;
	}

	/**
	 * Update the room data with new ones
	 * @param 	{Object} 		data 		The new room data
	 * @return 	{Room} 						The instance itself to maintain chainability
	 */
	updateData(data) {
		this._id = data.id;
		this._name = data.name;
		// _merge(this._clients, data.clients);
		this._clients = data.clients;
		this._activeClients = data.activeClients;
		this._maxClients = data.maxClients;
		// this._queuedClientsEstimations = data.queuedClientsEstimations;
		this._pickedTimeout = data.pickedTimeout;
		this._averageSessionDuration = data.averageSessionDuration;
		this._queue = data.queue;
		this._pickedClients = data.pickedClients;
		this._maxClients = data.maxClients;
		return this;
	}

	/**
	 * The room id
	 * @type 		{String}
	 */
	get id() {
		return this._id;
	}

	/**
	 * The room name
	 * @type 		{String}
	 */
	get name() {
		return this._name;
	}

	/**
	 * The clients in the room
	 * @type  	{Array}
	 */
	get clients() {
		return this._clients;
	}

	/**
	 * The active clients
	 * @type  	{Array}
	 */
	get activeClients() {
		return this._activeClients;
	}

	/**
	 * The active clients count
	 * @type 	{Integer}
	 */
	get activeClientsCount() {
		return _size(this.activeClients);
	}

	/**
	 * Get the queued clients ids
	 * @type 	{Array}
	 */
	get queue() {
		return this._queue;
	}

	/**
	 * Get the queued clients objects
	 * @type 		{Object}
	 */
	get queuedClients() {
		// construct the queuedClients object
		const queuedClients = {};
		this.queue.forEach((clientId) => {
			queuedClients[clientId] = this.clients[clientId];
		});
		return queuedClients;
	}

	/**
	 * Get the picked clients objects
	 * @type 		{Object}
	 */
	get pickedClients() {
		// construct the queuedClients object
		const pickedClients = {};
		this._pickedClients.forEach((clientId) => {
			pickedClients[clientId] = this.clients[clientId];
		});
		return pickedClients;
	}

	/**
	 * The number of clients available for this room
	 * @type 		{Integer}
	 */
	get maxClients() {
		return this._maxClients;
	}

	/**
	 * The place in the queue of the current client
	 * @type 		{Integer}
	 */
	get placeInQueue() {
		return this.queue.indexOf(this._socket.id);
	}

	/**
	 * The estimation time in which it's the current client turn
	 * @type 	{Number}
	 */
	get waitTimeEstimation() {
		if (this.isQueued()) {
			const countActiveClients = (this._maxClients - _size(this.activeClients) - this._pickedClients.length <= 0) ? 1 : 0;
			return (this.placeInQueue +  + countActiveClients) * this.averageSessionDuration;
		} else if (this.isPicked()) {
			return 0;
		} else {
			const countActiveClients = (this._maxClients - _size(this.activeClients) - this._pickedClients.length <= 0) ? 1 : 0;
			return (this.queue.length + countActiveClients) * this.averageSessionDuration;
		}
	}

	/**
	 * The estimation of each sessions in the room
	 * @type 		{Number}
	 */
	get averageSessionDuration() {
		return this._averageSessionDuration;
	}

	/**
	 * The picked timeout if has been picked in the room
	 * @type 		{Number}
	 */
	get pickedTimeout() {
		return this._pickedTimeout;
	}

	/**
	 * The picked queue remaining timeout
	 * @type  		{Number}
	 */
	get pickedRemainingTimeout() {
		return this._pickedRemainingTimeout;
	}

	/**
	 * Return if the current client has been queued or not
	 * @return 		{Boolean} 		true if the client is in the queue, false if not
	 */
	isQueued() {
		return this.queue.indexOf(this._socket.id) !== -1;
	}

	/**
	 * Return if the current client has been picked in the room or not
	 * @return 		{Boolean} 		true if the client has bein picked, false if not
	 */
	isPicked() {
		return this._pickedClients.indexOf(this._socket.id) !== -1;
	}

	/**
	 * Return if the current client has joined the room or not
	 * @return  	{Boolean} 		true if the client has joined the room, false if not
	 */
	hasJoined() {
		return this.activeClients[this._socket.id] != null;
	}

	log = {
		success : (message) => {
			if ( ! this._settings.debug) return;
			console.log(`%c Remote stack room : ${message}`, 'color: green');
		},
		error : (message) => {
			if ( ! this._settings.debug) return;
			console.log(`%c Remote stack room : ${message}`, 'color: red');
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
__eventEmitter(Room.prototype);

// export the Room class
export default Room;
