import __socketIoP2p from 'socket.io-p2p'
import __socketIo from 'socket.io-client'
import __settings from './settings'
import __eventEmitter from 'event-emitter';
import __Room from './room';
import _merge from 'lodash/merge';

class Client {

	data = {};

	_socket = null;
	_id = null;
	_joinedRooms = {};
	_availableRooms = {};
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
			let socketUrl = this._settings.host;
			if (this._settings.port) {
				socketUrl += `:${this._settings.port}`;
			}
			this._socket = __socketIo(socketUrl);
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
							console.log('leeeeeft', room);
							delete this._joinedRooms[room.id];
							this.emit('room.left', room);
						});
						this._availableRooms[roomId].on('joined', (room) => {
							this._joinedRooms[room.id] = this._availableRooms[room.id];
							this.emit('room.joined', room);
						});
						this._availableRooms[roomId].on('picked', (room) => {
							this.emit('room.picked', room);
						});
						this._availableRooms[roomId].on('queued', (room) => {
							this.emit('room.queued', room);
						});
						this._availableRooms[roomId].on('picked-queue-timeout', (room, remainingTime) => {
							this.emit('room.picked-queue-timeout', room, remainingTime);
						});
						this._availableRooms[roomId].on('missed-turn', (room) => {
							this.emit('room.missed-turn', room);
						});
					}
				});

				// emit new rooms
				this.emit('available-rooms', this._availableRooms);
			});
		});
	}

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

	leave(roomId) {
		// left the room
		return this._joinedRooms[roomId].leave();
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
