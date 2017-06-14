import __socketIo from 'socket.io-client'
import __settings from './settings'
import __uniqid from 'uniqid'
import _merge from 'lodash/merge'
import _size from 'lodash/size'
import __pako from 'pako'

import __eventEmitter from 'event-emitter';

class Room {

	_id = null;
	_name = null;
	_clients = {};
	_activeClients = {};
	_queue = [];
	_pickedQueue = [];
	_pickedQueueTimeout = null;
	_pickedQueueRemainingTimeout = null;
	_simultaneous = 0;
	// _queuedClientsEstimations = {};
	_places = 0;
	_averageSessionDuration = 0;
	_leavePromiseResolve = null;
	_leavePromiseReject = null;
	_joinPromiseResolve = null;
	_joinPromiseReject = null;

	_settings = {};

	_socket = null;

	constructor(data, socket, settings = {}) {

		// extend settings
		this._settings = {
			...__settings,
			...settings
		};

		// save the socket
		this._socket = socket;
		// save the room name to join
		this.updateData(data);

		// listen for new room data
		this._socket.on(`new-room-data.${data.id}`, (data) => {
			data = JSON.parse(__pako.inflate(data, { to: 'string' }));
			// new room data
			this.updateData(data);
		});

		this._socket.on(`left-room-${data.id}`, () => {
			if ( ! this.id) return;
			// resolve the promise
			this._leavePromiseResolve(this);
			// let the app know that we have left the room
			this.emit('left', this);
		});

		this._socket.on(`queued-room-${data.id}`, () => {
			if ( ! this.id) return;
			this.emit('queued', this);
		});

		this._socket.on(`picked-room-${data.id}`, () => {
			console.log('PICKED', this);
			if ( ! this.id) return;
			this.emit('picked', this);

			// start timer of the picked queue
			this._startPickedQueueTimeout();

		});

		this._socket.on(`joined-room-${data.id}`, () => {
			if ( ! this.id) return;
			// resolve the promise
			this._joinPromiseResolve(this);
			// let the app know that we have left the room
			this.emit('joined', this);
		});

		this._socket.on(`receive-from-client-${data.id}`, (something) => {
			// decompress data
			something = JSON.parse(__pako.inflate(something, { to: 'string' }));
			console.error('receive from client', something);
			// let the app know that we have received something from another client
			this.emit('receive-from-client', something);
		});

	}

	_startPickedQueueTimeout() {
		// save the initial time
		this._pickedQueueRemainingTimeout = this._pickedQueueTimeout;

		// emit a picked queue timeout event
		this.emit('picked-queue-timeout', this, this._pickedQueueRemainingTimeout);

		// create the timeout
		this._pickedQueueTimeoutInterval = setInterval(() => {
			this._pickedQueueRemainingTimeout = this._pickedQueueRemainingTimeout - 1000;
			console.log('new picked queue current time', this._pickedQueueRemainingTimeout);

			// emit a picked queue timeout event
			this.emit('picked-queue-timeout', this, this._pickedQueueRemainingTimeout);

			if (this._pickedQueueRemainingTimeout <= 0) {
				// end of time
				console.log('end of picked queue...');
				clearInterval(this._pickedQueueTimeoutInterval);

				// emit a missed-turn event
				this.emit('missed-turn', this);

				// leave the room unfortunately...
				this.leave();
			}
		}, 1000);
	}

	sendToClients(something) {
		if ( ! this.hasJoined()) {
			throw(`You cannot send something to client in the room "${this.id}" cause you don't has joined it yet...`);
			return;
		}

		if (this._settings.compression) {
			something = __pako.deflate(JSON.stringify(something), { to: 'string' });
		}

		this._socket.emit('send-to-clients', this.id, something);
	}

	sendToApp(something) {
		if ( ! this.hasJoined()) {
			throw(`You cannot send something to app in the room "${this.id}" cause you don't has joined it yet...`);
			return;
		}
		if (this._settings.compression) {
			something = __pako.deflate(JSON.stringify(something), { to: 'string' });
		}
		this._socket.emit('send-to-app', this.id, something);
	}

	/**
	 * Leave this room
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
			this._socket.off('receive-from-client');
			this._socket.emit('leave', this.id);
		});
	}

	join() {
		return new Promise((resolve, reject) => {

			// if the user has bein picked and has clicked on the "join" again,
			// we stop the picked queue timeout
			if (this.isPicked()) {
				this._pickedQueueRemainingTimeout = null;
				clearInterval(this._pickedQueueTimeoutInterval);
			}

			// check that we have joined the room before
			if (this.hasJoined()) {
				reject(`You cannot join a the room "${this.id}" cause you have already joined it...`);
				return;
			}

			this._joinPromiseReject = reject;
			this._joinPromiseResolve = resolve;

			this._socket.emit('join', this.id);
		});
	}

	destroy() {
		// stop listening for this room datas
		this._socket.off(`new-room-data.${this.id}`);
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


	updateData(data) {
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

	_onJoined(data = {}) {
		console.log('joined', data);
		// emit an event
		this.emit('joined', data);
	}

	_onQueued(data = {}) {
		console.log('queued', data);
		this.emit('queued', data);
	}

	_onPicked(data = {}) {
		console.log('picked', data);
		this.emit('picked', data);
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
	 * @type  	{Array<Client>}
	 */
	get clients() {
		return this._clients;
	}

	/**
	 * The active clients
	 * @type  	{Array<Client>}
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
	 * Get the queue
	 * @type 	{Array}
	 */
	get queue() {
		return this._queue;
	}

	/**
	 * Get the queued clients
	 * @type 		{Object<Object>}
	 */
	get queuedClients() {
		// construct the queuedClients object
		const queuedClients = {};
		this.queue.forEach((clientId) => {
			queuedClients[clientId] = this.clients[clientId];
		});
		console.log('queuedClients', queuedClients);
		return queuedClients;
	}

	/**
	 * Get the picked clients
	 * @type 		{Object<Object>}
	 */
	get pickedQueueClients() {
		// construct the queuedClients object
		const pickedClients = {};
		this._pickedQueue.forEach((clientId) => {
			pickedClients[clientId] = this.clients[clientId];
		});
		return pickedClients;
	}

	/**
	 * The places number
	 * @type 		{Integer}
	 */
	get places() {
		return this._places;
	}

	/**
	 * The place in the queue
	 * @type 		{Integer}
	 */
	get placeInQueue() {
		return this.queue.indexOf(this._socket.id);
	}

	/**
	 * The estimation time in which it's our turn
	 * @type 	{Number}
	 */
	get waitTimeEstimation() {
		if (this.isQueued()) {
			const countActiveClients = (this._simultaneous - _size(this.activeClients) - this._pickedQueue.length <= 0) ? 1 : 0;
			return (this.placeInQueue +  + countActiveClients) * this.averageSessionDuration;
		} else if (this.isPicked()) {
			return 0;
		} else {
			const countActiveClients = (this._simultaneous - _size(this.activeClients) - this._pickedQueue.length <= 0) ? 1 : 0;
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
	get pickedQueueTimeout() {
		return this._pickedQueueTimeout;
	}

	/**
	 * The picked queue remaining timeout
	 * @type  		{Number}
	 */
	get pickedQueueRemainingTimeout() {
		return this._pickedQueueRemainingTimeout;
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
		return this._pickedQueue.indexOf(this._socket.id) !== -1;
	}

	/**
	 * Return if the current client has joined the room or not
	 * @return  	{Boolean} 		true if the client has joined the room, false if not
	 */
	hasJoined() {
		return this.activeClients[this._socket.id] != null;
	}
}

// make the room class an emitter capable object
__eventEmitter(Room.prototype);

// export the Room class
export default Room;
