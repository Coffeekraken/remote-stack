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

	// store the rooms
	const rooms = {};
	config.rooms.forEach((room) => {
		rooms[room.id] = room;
		room.clients = {};
		room.activeClients = {};
		room.queue = [];
	});



	// start demo server
	__server.listen(config.port, function () {
		console.log('Remote queue server : ✓ running on port ' + config.port + '!');
	});

	// io.use(__socketIoP2pServer);

	io.on('connection', function (socket) {

		console.log(`Remote stack server : New connection "${socket.id}"`);

		// listen for the user disconnection
		socket.on('disconnecting', (reason) => {
			console.log(`Remote stack server : The user "${socket.id}" has been disconnected for the following reason :`);
			console.log(`Remote stack server : --- ${reason}`);

			Object.keys(socket.rooms).forEach((roomId) => {
				// remove the user from the actual room object
				const room = rooms[roomId];
				if ( ! room) return;
				delete room.clients[socket.id];
				delete room.activeClients[socket.id];
				const queueIdx = room.queue.indexOf(socket.id);
				if (queueIdx !== -1) {
					room.queue.splice(queueIdx, 1);
				}
				// notify all the room clients of new room data
				io.to(roomId).emit(`new-room-data.${roomId}`, rooms[roomId]);
			});
		});

		// announce a user
		socket.on('announce', (data, fn) => {
			console.log(`Remote stack server : Announce new client "${JSON.stringify(data)}"`);

			// check if not already registered the user
			if (clients[socket.id]) {
				// the client has already been announced
				return
			}

			// save the new client
			clients[socket.id] = data;

			// client announced
			fn && fn(data);
			socket.emit('announced', data);

			// emit available rooms
			socket.emit('available-rooms', rooms);

		});

		// join a room
		socket.on('join', function(roomId) {

			console.log(`Remote stack server : user "${socket.id}" has asked to join the room "${roomId}"`);

			// check if the room exist
			if ( ! rooms[roomId]) {
				socket.emit('rejected', {
					room : roomId
				})
				return
			}

			// join the room
			socket.join(roomId, (response) => {
				console.log(`Remote stack server : user "${socket.id}" has joined the room "${roomId}"`);

					// add the user to the room
				const room = rooms[roomId];
				if ( ! room.clients[socket.id]) {
					room.clients[socket.id] = clients[socket.id];
				}

				// socket.emit('numClients', _size(room.clients));

				// callback fn
				socket.emit(`joined-room-${roomId}`, room);

				// notify all the room clients of new room data
				io.emit(`new-room-data.${roomId}`, rooms[roomId]);

			});

		});

		socket.on('say', function(something) {
			console.log(`Remote stack server : client "${socket.id}" say "${JSON.stringify(something)}" to the room "${something._roomId}`);

			if (something._roomId) {
				socket.broadcast.to(something._roomId).emit('say', something);
			} else {
				socket.broadcast.emit('say', something);
			}

		});

		// leave a room
		socket.on('leave', function(roomId) {

			console.log(`Remote stack server : user "${socket.id}" has asked to leave the room "${roomId}"`);

			// check if the room exist
			if ( ! rooms[roomId]) {
				socket.emit('rejected', {
					room : roomId
				})
				return
			}

			// leave the room
			socket.leave(roomId, (response) => {
				console.log(`Remote stack server : user "${socket.id}" has leaved the room "${roomId}"`);

				// add the user to the room
				const room = rooms[roomId];
				delete rooms[roomId].clients[socket.id];
				delete rooms[roomId].activeClients[socket.id];
				const queueIdx = rooms[roomId].queue.indexOf(socket.id);
				if (queueIdx !== -1) {
					rooms[roomId].queue.splice(queueIdx, 1);
				}

				// callback fn
				socket.emit(`left-room-${roomId}`);

				// notify all the room clients of new room data
				io.emit(`new-room-data.${roomId}`, rooms[roomId]);
			});
		});
	});
}
