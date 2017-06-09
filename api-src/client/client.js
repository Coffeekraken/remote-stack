import __socketIo from 'socket.io-client'
import __settings from './settings'
import __eventEmitter from 'event-emitter';
import __Room from './room';

class Client {

	data = {};

	_socket = null;

	_id = null;


	_joinedRooms = {};
	_rooms = {};
	_announced = false;

	constructor(data = {}, settings = {}) {
		// save the user data
		this.data = data

		// extend settings
		this._settings = {
			...__settings,
			...settings
		}
	}

	announce() {
		return new Promise((resolve) => {
			this._socket = __socketIo(this._settings.host + (this._settings.port) ? `:${this._settings.port}` : '');
			this._socket.on('connect', () => {
				// save the client id
				this._id = this._socket.id;

				// announce the client
				this._socket.emit('announce', this.data);
			});
			this._socket.on('announced', (data) => {
				// update client state
				this._announced = true;
				// the client has been annouced correctly
				resolve(this);
				// emit an event
				this.emit('announced', this);
				// log
				this.log.success('Successfuly announced');
				console.log(this);
			});
			// listen for rooms
			this._socket.on('rooms', (rooms) => {

				// save the rooms
				this._rooms = rooms;

				// emit new rooms
				this.emit('rooms', rooms);
			});
		});
	}

	join(roomId) {
		return new Promise((resolve, reject) => {

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
			this._socket.emit('join', roomId, (data) => {

				// create a new room instance
				const room = new __Room(data, this._socket);

				// save the rooms in the client
				this._joinedRooms[roomId] = room;

				// resolve the promise
				this.emit('joined', room);
				resolve(room);
			});
		});
	}

	leave(roomId) {
		// left a room
		if ( ! this._joinedRooms[roomId]) throw `You cannot left the room "${roomId}" cause this client has not joined it yet...`;
		// left the room
		const promise = this._joinedRooms[roomId].leave();
		// update the rooms of the client
		promise.then(() => {
			// remove the room from the client rooms stack
			delete this._joinedRooms[roomId];
		});
		// return the promise
		return promise;
	}

	/**
	 * All the rooms in which the client is in
	 * @type 		{Object<Room>}
	 */
	get joinedRooms() {
		return this._joinedRooms;
	}

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

// make the room class an emitter capable object
__eventEmitter(Client.prototype);

export default Client;
