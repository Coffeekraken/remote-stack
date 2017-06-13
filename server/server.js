const __express = require('express');
const __expressHandlebars = require('express-handlebars');
const __path = require('path');
const __fs = require('fs');
const __cors = require('cors');
const __bodyParser = require('body-parser');
const __extend = require('lodash/extend');
const __exec = require('child_process').spawnSync;
const __jsdom = require('jsdom');
const __semver = require('semver');
const __urldecode = require('urldecode');

const _size = require('lodash/size');

const __server = require("http").createServer();
const __socketIoP2p = require('socket.io-p2p-server');
const __socketIoP2pServer = __socketIoP2p.Server;

const io = require('socket.io')(__server);

module.exports = function(config) {

	// store the clients
	const clients = {};

	// store the apps
	const apps = {};

	// store the rooms
	const rooms = {};
	config.rooms.forEach((room) => {
		rooms[room.id] = room;
		room.app = null;
		room.clientsSessionsDuration = {};
		room.clients = {};
		room.activeClients = {};
		room.queue = [];
		room.averageSessionDuration = 0;
		room.queuedClientsEstimations = {};
	});

	// start demo server
	__server.listen(config.port, function () {
		console.log('Remote queue server : ✓ running on port ' + config.port + '!');
	});

	// io.use(__socketIoP2pServer);

	function calculateQueuedClientsEstimations(roomId) {
		const room = rooms[roomId];
		if ( ! room) return;

		// loop on each estimations
		let total = 0;
		let finishedSessionsCount = 0;
		for (let userId in room.clientsSessionsDuration) {
			const userSession = room.clientsSessionsDuration[userId];
			if ( ! userSession) continue;
			if (userSession.total) {
				total += userSession.total;
				finishedSessionsCount++;
			}
		}

		// calculate each queued clients waiting time estimation
		const now = new Date().getTime();
		const sessionsDurations = [];
		for (let userId in room.activeClients) {
			const activeUserSession = room.clientsSessionsDuration[userId];
			sessionsDurations.push(now - activeUserSession.start);
		}

		// sort times
		sessionsDurations.sort();

		console.log(sessionsDurations);

		// set the average session duration
		room.averageSessionDuration = total / finishedSessionsCount;
	}

	function pickNextClientInRoom(roomId) {
		const room = rooms[roomId];
		if ( ! room) return;
		if ( ! room.queue.length) return;

		// get next client id
		const nextClientId = room.queue.shift();

		// make the client join the room
		console.log('next client', nextClientId);

		const nextClientSocket = io.sockets.connected[nextClientId];;

		if ( ! nextClientSocket) pickNextClientInRoom(roomId);

		// make the user join the room
		nextClientSocket.join(roomId, (response) => {
			onJoinedRoom(nextClientSocket, roomId);
		});
	}

	function onJoinedRoom(socket, roomId) {
		console.log(`Remote stack server : client "${socket.id}" has joined the room "${roomId}"`);

		// add the client to the room
		const room = rooms[roomId];
		if ( ! room.activeClients[socket.id]) {
			room.activeClients[socket.id] = clients[socket.id];
		}

		// stack store the start timestamp of this user in this room
		room.clientsSessionsDuration[socket.id] = {
			start : new Date().getTime(),
			end : new Date().getTime(),
			total : 0
		};

		// notify the app of a new client
		socket.broadcast.to(rooms[roomId].app).emit('new-client', clients[socket.id]);

		// calculate times estimations for queued users
		calculateQueuedClientsEstimations(roomId);

		// callback fn
		socket.emit(`joined-room-${roomId}`, room);

		// notify all the room clients of new room data
		io.emit(`new-room-data.${roomId}`, rooms[roomId]);
	}

	function onLeftRoom(socket, roomId) {

		// remove the client from the actual room object
		const room = rooms[roomId];
		if ( ! room) return;

		console.log(`Remote stack server : client "${socket.id}" has left the room "${roomId}"`);

		// stack store the start timestamp of this user in this room
		const endTime = new Date().getTime();
		room.clientsSessionsDuration[socket.id].end = endTime;
		room.clientsSessionsDuration[socket.id].total = endTime - room.clientsSessionsDuration[socket.id].start;

		// check if the client was part of the room
		if (room.activeClients[socket.id]) {
			// pick the next client from the queue
			pickNextClientInRoom(roomId);
		}

		delete room.clients[socket.id];
		delete room.activeClients[socket.id];
		const queueIdx = room.queue.indexOf(socket.id);
		if (queueIdx !== -1) {
			room.queue.splice(queueIdx, 1);
		}

		// calculate times estimations for queued users
		calculateQueuedClientsEstimations(roomId);

		// notify all the room clients of new room data
		io.emit(`new-room-data.${roomId}`, rooms[roomId]);

		// callback fn
		socket.emit(`left-room-${roomId}`, room);

		// notify the app of a new client
		socket.broadcast.to(rooms[roomId].app).emit('client-left', clients[socket.id]);

	}

	io.on('connection', function (socket) {

		console.log(`Remote stack server : New connection "${socket.id}"`);

		// listen for the client disconnection
		socket.on('disconnecting', (reason) => {
			console.log(`Remote stack server : The client "${socket.id}" has been disconnected for the following reason :`);
			console.log(`Remote stack server : --- ${reason}`);

			Object.keys(socket.rooms).forEach((roomId) => {
				onLeftRoom(socket, roomId);
			});
		});

		// announce a client
		socket.on('announce', (data, fn) => {
			console.log(`Remote stack server : Announce new client "${JSON.stringify(data)}"`);

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
			fn && fn(data);
			socket.emit('announced', data);

			// emit available rooms
			socket.emit('available-rooms', rooms);

		});

		// announce an app
		socket.on('announce-app', (data, roomId) => {
			console.log(`Remote stack server : Announce new app "${JSON.stringify(data)}"`);

			// allow only 1 app by room
			// if (rooms[roomId].app) {
			// 	throw `You cannot have multiple app announced in the same room...`;
			// 	return;
			// }


			// check if not already registered the client
			if (apps[socket.id]) {
				// the app has already been announced
				return
			}

			// add the id to the app
			data.id = socket.id;

			// save the new app
			apps[socket.id] = data;

			// save the app in the room
			rooms[roomId].app = socket.id;

			// add the app to his room
			socket.join(roomId, (response) => {
				socket.emit('joined-app', data);
			});

			// client announced
			socket.emit('announced-app', data);
		});

		// join a room
		socket.on('join', function(roomId) {

			console.log(`Remote stack server : client "${socket.id}" has asked to join the room "${roomId}"`);

			// check if the room exist
			if ( ! rooms[roomId]) {
				socket.emit('rejected', {
					room : roomId
				})
				return
			}

			const room = rooms[roomId];
			if ( ! room.clients[socket.id]) {
				room.clients[socket.id] = clients[socket.id];
			}

			// check if can join the room now or need to wait for in the queue
			const simultaneous = rooms[roomId].simultaneous;
			if (simultaneous && _size(rooms[roomId].activeClients) >= simultaneous) {

				// add the user in queue
				if (room.queue.indexOf(socket.id) !== -1) return;

				// add the user in queue
				room.queue.push(socket.id);

				// debug
				console.log(`Remote stack server : client "${socket.id}" has joined the queue of the room "${roomId}"`);

				// tell the user that he has been queued
				socket.emit(`queued-room-${roomId}`, room);

				// notify all the room clients of new room data
				io.emit(`new-room-data.${roomId}`, rooms[roomId]);

				// stop here
				return
			}

			// join the room
			socket.join(roomId, (response) => {
				onJoinedRoom(socket, roomId);
			});
		});

		socket.on('send-to-clients', function(something) {
			console.log(`Remote stack server : client "${socket.id}" send "${JSON.stringify(something)}" to the room (${something._roomId}) clients`);
			if (something._roomId) {
				socket.broadcast.to(something._roomId).emit('receive-from-client', something);
			} else {
				socket.broadcast.emit('receive-from-client', something);
			}
		});

		socket.on('send-to-app', function(something) {
			console.log(`Remote stack server : client "${socket.id}" send "${JSON.stringify(something)}" to the room (${something._roomId}) app`);
			if (something._roomId) {
				socket.broadcast.to(rooms[something._roomId].app).emit('receive-from-client', something, clients[socket.id]);
			}
		});

		// leave a room
		socket.on('leave', function(roomId) {

			console.log(`Remote stack server : client "${socket.id}" has asked to leave the room "${roomId}"`);

			// check if the room exist
			if ( ! rooms[roomId]) {
				socket.emit('rejected', {
					room : roomId
				})
				return
			}

			// leave the room
			socket.leave(roomId, (response) => {
				onLeftRoom(socket, roomId);
			});
		});
	});
}
