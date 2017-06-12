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

	_cbs = {};

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
			// this._p2p = new __socketIoP2p(this._socket, {
			// 	autoUpgrade : false,
			// 	peerOpts: {
			// 		numClients: 300000
			// 	}
			// });
			this._p2p = this._socket;
			this._p2p.on('connect', () => {
				// save the client id
				this._id = this._socket.id;

				// announce the client
				this._socket.emit('announce', this.data);
			});
			this._p2p.on('announced', (data) => {
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
			this._p2p.on('available-rooms', (rooms) => {

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
						this._availableRooms[roomId] = new __Room(rooms[roomId], this._p2p);

						// listen when the room has been left
						this._availableRooms[roomId].on('left', (roomId) => {
							this._p2p.usePeerConnection = false;
							this._p2p.useSockets = true;
							delete this._joinedRooms[roomId];
						});

					}
				});

				console.log('new rooms', this._availableRooms);

				// emit new rooms
				this.emit('available-rooms', this._availableRooms);
			});

			// listen for joined room
			this._p2p.on('joined', (room) => {

				this._cbs[room.id] && this._cbs[room.id](room);

				console.log('joined', room);
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
