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
const __socketIo = require('socket.io');


module.exports = function(config) {

	// creating the app
	const app = __express();

	// handlebars
	app.engine('handlebars', __expressHandlebars({
		layoutsDir : __dirname + '/views/layouts',
		defaultLayout : 'main'
	}));
	app.set('views',__dirname + '/views');
	app.set('view engine', 'handlebars');

	// parser body
	app.use(__bodyParser.json());
	app.use(__bodyParser.urlencoded({ extended: true }));

	// cors
	app.use(__cors());

	// attach config to request
	app.use((req, res, next) => {
		req.config = Object.assign({}, config);
		next();
	});

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
	const io = __socketIo.listen(app.listen(config.port, function () {
		console.log('Remote queue server : ✓ running on port ' + config.port + '!');
	}));

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
			socket.emit('rooms', rooms);

		});

		// join a room
		socket.on('join', function(roomId, fn) {

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

				// callback fn
				fn(room);
				socket.emit('joined', room);

				// notify all the room clients of new room data
				io.to(roomId).emit(`new-room-data.${roomId}`, rooms[roomId]);
			});
		});

		// leave a room
		socket.on('leave', function(roomId, fn) {

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
				fn(room);
				socket.emit('left', room);

				// notify all the room clients of new room data
				io.to(roomId).emit(`new-room-data.${roomId}`, rooms[roomId]);
			});
		});
	});
}
