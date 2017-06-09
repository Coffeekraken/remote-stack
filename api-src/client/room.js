import __socketIo from 'socket.io-client'
import __settings from './settings'

import __eventEmitter from 'event-emitter';

class Room {

	_id = null;
	_name = null;
	_clients = [];
	_activeClients = [];
	_queue = [];

	_socket = null;

	constructor(data, socket) {
		// save the socket
		this._socket = socket;
		// save the room name to join
		this._saveData(data);

		// listen for new room data
		this._socket.on(`new-room-data.${data.id}`, (data) => {
			// new room data
			console.log('new room data', data);
			this._saveData(data);
		});

	}

	/**
	 * Leave this room
	 */
	leave() {
		return new Promise((resolve, reject) => {
			this._socket.emit('leave', this.id, (data) => {
				console.log('room leaved!!!', this);
				// destroy the room locally
				this.destroy();

				// resolve the promise
				resolve();
			});
		});
	}

	destroy() {
		// stop listening for this room datas
		this._socket.off(`new-room-data.${this.id}`);
		// remove some datas to clean memory
		delete this._clients;
		delete this._queue;
		delete this._activeClients;
	}


	_saveData(data) {
		this._id = data.id;
		this._name = data.name;
		this._clients = data.clients;
		this._activeClients = data.activeClients;
		this._queue = data.queue;
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
}

// make the room class an emitter capable object
__eventEmitter(Room.prototype);

// export the Room class
export default Room;
