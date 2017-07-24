const __express = require('express');
const __expressHandlebars = require('express-handlebars');
const __path = require('path');
const __fs = require('fs');
const __cors = require('cors');
const __bodyParser = require('body-parser');
const __merge = require('lodash/merge');
const __exec = require('child_process').spawnSync;
const __jsdom = require('jsdom');
const __semver = require('semver');
const __urldecode = require('urldecode');
const _size = require('lodash/size');
const __server = require("http").createServer();
const __pako = require('pako');
const io = require('socket.io')(__server);

module.exports = function(config) {

	function initRoom(room) {
		// some internal values
		room.app = null;
		room.clients = {};
		room.activeClients = {};
		room.queue = [];
		room.pickedClients = [];
		// make sure the averageSessionDuration has a value
		if (room.averageSessionDuration === -1 && room.sessionDuration > 0) {
			room.averageSessionDuration = room.sessionDuration;
		}
		return room
	}

	// store the clients
	const clients = {};

	// store the apps
	const apps = {};

	// store the rooms
	const rooms = {};
	config.rooms.forEach((room) => {
		rooms[room.id] = room;
		initRoom(room)
	});

	// start demo server
	__server.listen(config.port, function () {
		console.log('Remote queue server : ✓ running on port ' + config.port + '!');
	});

	function broadcastNewRoomData(roomId) {
		// notify all the room clients of new room data
		io.emit(`room.${roomId}.data`, __pako.deflate(JSON.stringify(rooms[roomId]), { to: 'string' }));
	}

	function closeRoom(roomId) {
		if ( ! rooms[roomId]) return;
		for (let clientId in rooms[roomId].clients) {
			const clientSocket = io.sockets.connected[clientId]
			if ( ! clientSocket || clientId === rooms[roomId].app) continue
			// notify the client
			clientSocket.emit('room.closed', rooms[roomId]);
			// clientSocket.emit(`room.${roomId}.closed`, rooms[roomId]);
			// make the client leave the room
			clientSocket.leave(roomId);
		}
		// delete the room
		delete rooms[roomId]
	}

	function pickNextClientInRoom(socket, roomId) {
		const room = rooms[roomId];
		if ( ! room) return;
		if ( ! room.queue.length) return;

		// get next client id
		const nextClientId = room.queue.shift();

		// make the client join the room
		const nextClientSocket = io.sockets.connected[nextClientId];;

		if ( ! nextClientSocket) {
			pickNextClientInRoom(socket, roomId);
			return;
		}

		room.pickedClients.push(nextClientId);

		// tell the client that he has bein picked
		nextClientSocket.emit('room.picked', room);
		// nextClientSocket.emit(`room.${roomId}.picked`, room);

		// notify all the users that a new client has been picked
		socket.broadcast.to(roomId).emit(`room.client.picked`, room, clients[nextClientSocket.id]);

		// notify clients of new room data
		broadcastNewRoomData(roomId);
	}

	function onClientJoinedRoom(socket, roomId) {
		if (config.debug) console.log(`Remote stack server : client "${socket.id}" has joined the room "${roomId}"`);

		// get the room object
		const room = rooms[roomId];

		// add the client to the room
		if ( ! room.activeClients[socket.id]) {
			room.activeClients[socket.id] = clients[socket.id];
		}

		// remove the client from the picked queue id needed
		const pickedClientsClientIdx = room.pickedClients.indexOf(socket.id);
		if (pickedClientsClientIdx !== -1) {
			room.pickedClients.splice(pickedClientsClientIdx, 1);
		}

		// notify the app of a new client
		socket.broadcast.to(room.app).emit('client.joined', clients[socket.id]);

		// callback fn
		socket.emit('room.joined', room);
		// socket.emit(`room.${roomId}.joined`, room);

		// notify all the room users that a new client has joined
		socket.broadcast.to(roomId).emit(`room.client.joined`, room, clients[socket.id]);

		// notify clients of new room data
		broadcastNewRoomData(roomId);
	}

	function removeClientFromRoom(socket, roomId) {

		// remove the client from the actual room object
		const room = rooms[roomId];
		if ( ! room) return;

		// keep track if the client was part of the room
		let wasClientPartOfTheRoom = room.clients[socket.id];

		// keep track if the client was active in the room
		let wasClientActiveInTheRoom = room.activeClients[socket.id];

		// check if the client was part of the room
		let needToPickNextClientInQueue = room.activeClients[socket.id] || room.pickedClients.indexOf(socket.id) !== -1;

		// keep track if need to broadcast new room data
		let isRoomUpdated = false;

		// remove some client data from the room
		if (room.clients[socket.id]) {
			delete room.clients[socket.id];
			isRoomUpdated = true;
		}
		if (room.activeClients[socket.id]) {
			delete room.activeClients[socket.id];
			isRoomUpdated = true;
		}

		// remove the client from the queue if needed
		const queueIdx = room.queue.indexOf(socket.id);
		if (queueIdx !== -1) {
			room.queue.splice(queueIdx, 1);
			isRoomUpdated = true;
		}

		// remove the client from the picked queue id needed
		const pickedClientsClientIdx = room.pickedClients.indexOf(socket.id);
		if (pickedClientsClientIdx !== -1) {
			room.pickedClients.splice(pickedClientsClientIdx, 1);
			isRoomUpdated = true;
		}

		// pick next client in queue if needed
		if (needToPickNextClientInQueue) {
			// pick the next client from the queue
			pickNextClientInRoom(socket, roomId);
		}

		// notify clients of new room data
		if (isRoomUpdated) {
			broadcastNewRoomData(roomId);
		}

		// callback fn
		if (wasClientPartOfTheRoom) {
			socket.emit('room.left', room);
			// socket.emit(`room.${roomId}.left`, room);

			// notify all the users that a client has left the room
			socket.broadcast.to(roomId).emit(`room.client.left`, room, clients[socket.id]);
		}

		// notify the app that the client has left the room
		if (wasClientActiveInTheRoom) {
			socket.broadcast.to(rooms[roomId].app).emit('client.left', clients[socket.id]);
		}
	}

	function onLeftRoom(socket, roomId) {
		if (config.debug) console.log(`Remote stack server : client "${socket.id}" has left the room "${roomId}"`);
		removeClientFromRoom(socket, roomId);
	}

	io.on('connection', function (socket) {

		if (config.debug) console.log(`Remote stack server : New connection "${socket.id}"`);

		// listen for the client disconnection
		socket.on('disconnecting', (reason) => {
			if (config.debug) console.log(`Remote stack server : The client "${socket.id}" has been disconnected for the following reason :`);
			if (config.debug) console.log(`Remote stack server : --- ${reason}`);

			// delete the clients from all the rooms
			Object.keys(rooms).forEach((roomId) => {
				// check if the removed client is in fact the app to kill the room
				if (rooms[roomId].app === socket.id && io.sockets.adapter.rooms[roomId]) {
					// close room
					closeRoom(roomId);
				} else {
					// it's a regular client, so remove it from the room
					removeClientFromRoom(socket, roomId);
				}
			});

			// delete the client (or the app)
			delete clients[socket.id];
			delete apps[socket.id];
		});

		// announce a client
		socket.on('client.announce', (data, cb) => {
			if (config.debug) console.log(`Remote stack server : Announce new client "${JSON.stringify(data)}"`);

			// check if not already registered the client
			if (clients[socket.id]) {
				// the client has already been announced
				return
			}

			// add the id to the client data
			data.id = socket.id;

			// save the new client
			clients[socket.id] = data;

			// client announced
			cb && cb(data);
			socket.emit('client.announced', data);

		});

		// announce an app
		socket.on('app.announce', (data, roomId, settings, onSuccess = null, onError = null) => {

			if ( ! roomId) return;

			if (config.debug) console.log(`Remote stack server : Announce new app "${JSON.stringify(data)}" with settings "${JSON.stringify(settings)}"`);

			// check the count of created rooms
			if (config.maxRooms !== -1 && rooms.length >= config.maxRooms) {
				const errorObj = {
					status : 403, // forbiden
					code : `The max rooms on this server has been reached`,
					data : {
						roomId : roomId
					}
				};
				socket.emit('_error', errorObj);
				onError && onError(errorObj);
				return;
			}

			// allow only 1 app by room
			if (rooms[roomId] && rooms[roomId].app) {
				const errorObj = {
					status : 400,
					error : `The "${roomId}" has already an app defined`,
					data : {
						roomId : roomId
					}
				};
				socket.emit('_error', errorObj);
				onError && onError(errorObj);
				return;
			}

			// check if not already registered the app
			if (apps[socket.id]) {
				const errorObj = {
					status : 409, // Conflict
					error : `This app with socket id "${socket.id}" has already been announced'`,
					data : {
						roomId : roomId
					}
				};
				// the app has already been announced
				onError && onError(errorObj);
				socket.emit('_error', errorObj);
				return
			}

			// add the id to the app
			data.id = socket.id;

			// save the room in which the app lives
			data.roomId = roomId;

			// save the new app
			apps[socket.id] = data;

			// check if the room is a declared one.
			// if not, check if we have the right to create some new rooms or not
			if ( ! rooms[roomId] && ! config.allowNewRooms) {
				const errorObj = {
					status : 405, // not allowed
					code : 'new-room-not-allowed',
					error : "The server is configured to not allow the creation of new rooms"
				}
				onError && onError(errorObj);
				socket.emit('_error', errorObj);
				return
			} else {

				// check the if pattern if needed
				if (config.newRoomIdPattern) {
					// check that the new id match the pattern
					if ( ! roomId.match(config.newRoomIdPattern)) {
						const errorObj = {
							status : 409, // not allowed
							code : 'new-room-id-not-valid',
							error : `The requested "${roomId}" room id does not match the required pattern "${config.newRoomIdPattern}"`,
							data : {
								roomId : roomId
							}
						}
						onError && onError(errorObj);
						socket.emit('_error', errorObj);
						return
					}
				}

				const roomSettings = __merge({}, config.defaultNewRoomSettings);

				// create the new room object
				if (config.allowSettingsOverride === true) {
					__merge(roomSettings, settings);
				} else if (config.allowSettingsOverride instanceof Array) {
					// loop on each passed settings to check if allowed to be overrided
					for (let key in settings) {
						if (config.allowSettingsOverride.indexOf(key) !== -1) {
							// override the setting
							roomSettings[key] = settings[key];
						} else if (roomSettings[key]) {
							const errorObj = {
								status : 409, // not allowed
								code : 'setting-override-not-allowed',
								error : `The requested "${key}" setting override is not allowed by the server for the room "${roomId}"`,
								data : {
									setting : key,
									wantedValue : settings[key],
									actualValue : roomSettings[key],
									roomId : roomId
								}
							}
							onError && onError(errorObj);
							socket.emit('_error', errorObj);
						}
					}
				}

				rooms[roomId] = initRoom(roomSettings);
				rooms[roomId].id = roomId
				// new room created
				if (config.debug) console.log('Remote stack server : New room created', roomId);
			}

			// save the app in the room
			rooms[roomId].app = socket.id;

			// add the app to his room
			socket.join(roomId, (response) => {
				socket.emit('app.joined', rooms[roomId]);
			});

			// client announced
			socket.emit('app.announced', rooms[roomId]);

			// callback
			onSuccess && onSuccess(apps[socket.id])
		});

		// app left
		socket.on('app.leave', () => {
			if ( ! apps[socket.id]) return;
			// close the room
			closeRoom(apps[socket.id].roomId);
		});

		// join a room
		socket.on('client.join', function(roomId, onSuccess = null, onError = null) {

			// check if the room exist
			if ( ! rooms[roomId]) {
				const errorObj = {
					status : 404,
					code : 'room-not-exist',
					error : `Room "${roomId}" does not exist`,
					data : {
						roomId
					}
				}
				socket.emit('_error', errorObj);
				onError && onError(errorObj);
				return
			}

			// if the client if not already listen in the room,
			// send the room metas to the client
			if ( ! rooms[roomId].clients[socket.id]) {
				socket.emit(`room.${roomId}.metas`, rooms[roomId]);
			}

			// check if the user that ask to join the room is part of the pickedClients
			if (rooms[roomId].pickedClients.indexOf(socket.id) !== -1) {
				// join the room
				socket.join(roomId, () => {
					onClientJoinedRoom(socket, roomId);
					onSuccess && onSuccess(rooms[roomId]);
				});

				// stop here
				return
			}

			if (config.debug) console.log(`Remote stack server : client "${socket.id}" has asked to join the room "${roomId}"`);

			const room = rooms[roomId];
			if ( ! room.clients[socket.id]) {
				room.clients[socket.id] = clients[socket.id];
			}

			// check if can join the room now or need to wait for in the queue
			const maxClients = rooms[roomId].maxClients;
			if (maxClients && _size(rooms[roomId].activeClients) >= maxClients || rooms[roomId].pickedClients.length) {

				// add the user in queue
				if (room.queue.indexOf(socket.id) !== -1) return;

				// add the user in queue
				room.queue.push(socket.id);

				// debug
				if (config.debug) console.log(`Remote stack server : client "${socket.id}" has joined the queue of the room "${roomId}"`);

				// tell the user that he has been queued
				socket.emit('room.queued', room);
				// socket.emit(`room.${roomId}.queued`, room);

				// notify all the users that a new client has been queued
				socket.broadcast.to(roomId).emit(`room.${roomId}.client.queued`, room, clients[socket.id]);

				// notify clients of new room data
				broadcastNewRoomData(roomId);

				// stop here
				return
			}

			// join the room
			socket.join(roomId, (response) => {
				onClientJoinedRoom(socket, roomId);
				onSuccess && onSuccess(rooms[roomId]);
			});
		});

		socket.on('client.to.clients', function(roomId, something) {
			// if (config.debug) console.log(`Remote stack server : client "${socket.id}" send "${JSON.stringify(something)}" to the room (${something._roomId}) clients`);
			if (something._roomId) {
				socket.broadcast.to(something._roomId).emit(`room.${roomId}.client.data`, clients[socket.id], something);
			}
		});

		socket.on('client.to.app', function(roomId, something) {
			if (roomId) {
				socket.broadcast.to(rooms[roomId].app).emit('client.data', clients[socket.id], something);
			}
		});

		socket.on('app.data', (something, clientIds = null) => {

			// process clientIds if not an array
			if (clientIds) {
				clientIds = [].concat(clientIds);
			}

			// make sure we have the roomId to send to
			const appData = apps[socket.id];
			if ( ! appData) return;
			const toRoomId = appData.roomId;
			if ( ! toRoomId) return;
			if (clientIds) {
				clientIds.forEach((clientId) => {
					const clientSocket = io.sockets.connected[clientId];
					if (clientSocket) {
						clientSocket.emit(`room.${toRoomId}.app.data`, something);
					}
				});
			} else {
				// send to all the room clients
				io.broadcast.to(toRoomId).emit(`room.${toRoomId}.app.data`, something);
			}
		});

		// leave a room
		socket.on('client.leave', function(roomId, onSuccess = null, onError = null) {
			if (config.debug) console.log(`Remote stack server : client "${socket.id}" has asked to leave the room "${roomId}"`);

			// check if the room exist
			if ( ! rooms[roomId]) {
				if (config.debug) console.log(`Remote stack server : the room "${roomId}" does not exist...`);
				onError && onError({
					status : 404,
					error : `Unable to leave the room "${roomId}" cause it doesn't exist on the server`
				});
				return;
			}

			// leave the room
			socket.leave(roomId, (response) => {
				onLeftRoom(socket, roomId);
				onSuccess && onSuccess();
			});
		});
	});
}
