import __socketIoP2p from 'socket.io-p2p'
import __socketIo from 'socket.io-client'
import __settings from './settings'
import __eventEmitter from 'event-emitter';
import _merge from 'lodash/merge';
import __pako from 'pako';

class App {

	data = {};
	_socket = null;
	_id = null;
	_announced = false;

	constructor(data = {}, settings = {}) {
		// save the app data
		this.data = data

		// extend settings
		this._settings = {
			...__settings,
			...settings
		}
	}

	announce(roomId) {
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
				this._socket.emit('announce-app', this.data, roomId);
			});
			this._socket.on('announced-app', (data) => {
				// update client state
				this._announced = true;
				// the client has been annouced correctly
				resolve(this);
				// emit an event
				this.emit('announced', this);
				// log
				this.log.success('App successfuly announced');
			});

			// listen for joined room
			this._socket.on('joined-app', (room) => {
				this.log.success(`App successfuly added to the "${roomId}" room`);
				this.emit('joined', this);
			});

			this._socket.on('received-from-client', (data, from) => {
				// decompress data if needed
				if (this._settings.compression) {
					data = JSON.parse(__pako.inflate(data, { to: 'string' }));
				}
				this.log.success(`received ${data} from client ${from.id}`);
				this.emit('received-from-client', data, from);
			});

			this._socket.on('client-joined', (client) => {
				this.log.success(`new client ${client.id}`);
				this.emit('client.joined', client);
			});

			this._socket.on('client-left', (client) => {
				this.log.success(`client ${client.id} has left`);
				this.emit('client.left', client);
			});
		});
	}

	isAnnounced() {
		return this._announced;
	}

	sendToClients(something, clientIds = null) {
		this._socket.emit(`app-send-to-clients`, something, clientIds);
	}

	log = {
		success : (message) => {
			if ( ! this._settings.debug) return;
			console.log(`%c Remote stack app : ${message}`, 'color: green');
		},
		error : (message) => {
			if ( ! this._settings.debug) return;
			console.log(`%c Remote stack app : ${message}`, 'color: red');
		}
	}
}

// make the room class an emitter capable object
__eventEmitter(App.prototype);

export default App;
