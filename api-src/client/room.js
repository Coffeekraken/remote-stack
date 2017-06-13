import __socketIo from 'socket.io-client'
import __settings from './settings'
import __uniqid from 'uniqid'
import _merge from 'lodash/merge'

import __eventEmitter from 'event-emitter';

class Room {

	_id = null;
	_name = null;
	_clients = {};
	_activeClients = {};
	_queue = [];
	_places = 0;

	_joined = false;

	_leaveCb = null;
	_leavePromiseResolve = null;
	_leavePromiseReject = null;

	_joinPromiseResolve = null;
	_joinPromiseReject = null;


	_processedMsg = {};

	_socket = null;

	constructor(data, socket) {
		// save the socket
		this._socket = socket;
		// save the room name to join
		this.updateData(data);

		// listen for new room data
		this._socket.on(`new-room-data.${data.id}`, (data) => {
			console.log('new data', data);
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
			if ( ! this.id) return;
			this.emit('picked', this);
		});

		this._socket.on(`joined-room-${data.id}`, () => {
			if ( ! this.id) return;
			// resolve the promise
			this._joinPromiseResolve(this);
			// let the app know that we have left the room
			this.emit('joined', this);
		});

	}

	sendToClients(something) {
		if ( ! this.hasJoined()) {
			throw(`You cannot send something to client in the room "${this.id}" cause you don't has joined it yet...`);
			return;
		}

		if (typeof(something) === 'object') {
			something._roomId = this.id;
		}

		this._socket.emit('send-to-clients', something);
	}

	sendToApp(something) {
		if ( ! this.hasJoined()) {
			throw(`You cannot send something to app in the room "${this.id}" cause you don't has joined it yet...`);
			return;
		}

		if (typeof(something) === 'object') {
			something._roomId = this.id;
		}

		this._socket.emit('send-to-app', something);
	}

	/**
	 * Leave this room
	 */
	leave() {
		return new Promise((resolve, reject) => {

			// check that we have joined the room before
			if ( ! this.hasJoined()) {
				reject(`You cannot leave a the room "${this.id}" cause you have not joined it yet...`);
				return;
			}

			this._leavePromiseReject = reject;
			this._leavePromiseResolve = resolve;

			// this._socket.useSockets = true;
			// this._socket.usePeerConnection = false;

			this._socket.off('receive-from-client');

			this._socket.emit('leave', this.id);
		});
	}

	join() {
		return new Promise((resolve, reject) => {

			// check that we have joined the room before
			if (this.hasJoined()) {
				reject(`You cannot join a the room "${this.id}" cause you have already joined it...`);
				return;
			}

			this._joinPromiseReject = reject;
			this._joinPromiseResolve = resolve;

			this._socket.on('receive-from-client', (something) => {
				console.error('receive from client', something);
			});

			this._socket.emit('join', this.id);

			// this._socket.usePeerConnection = true;
			// this._socket.useSockets = false;
		});
	}

	destroy() {
		console.log('destroy room', this);
		// stop listening for this room datas
		this._socket.off(`new-room-data.${this.id}`);
		// remove some datas to clean memory
		delete this._clients;
		delete this._queue;
		delete this._activeClients;
	}


	updateData(data) {
		this._id = data.id;
		this._name = data.name;
		// _merge(this._clients, data.clients);
		this._clients = data.clients;
		this._activeClients = data.activeClients;
		this._queue = data.queue;
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
	 * Get the queue
	 * @type 	{Array}
	 */
	get queue() {
		return this._queue;
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
		console.log('placeInQueue', this.queue.indexOf(this._socket.id));
		return this.queue.indexOf(this._socket.id);
	}

	/**
	 * Return if the current client has joined the room or not
	 * @return  	{Boolean} 		true if the client has joined the room, false if not
	 */
	hasJoined() {
		return this.activeClients[this._socket.id || this._socket.socket.id] != null;
	}
}

// make the room class an emitter capable object
__eventEmitter(Room.prototype);

// export the Room class
export default Room;
