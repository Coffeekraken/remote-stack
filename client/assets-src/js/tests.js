import __remoteStack from '../../../api/client/index';
import __Vue from 'vue/dist/vue';

__Vue.config.delimiters = ['<%', '%>']

let client;

var app = new __Vue({
	el: '#testsApp',
	delimiters: ["<%","%>"],
	data: {
		client : {},
		toPeer : null,
		username : '',
		availableRooms : []
	},
	methods : {
		join : function(room) {

			console.log('join room', room);

			client.join(room.id).then((room) => {
				console.log('joinded the room', room);
			});

		},
		click: function(room, client) {
			console.log('clicked on', room, client);

			room.say({
				message : `user ${client.username} has clicked on the user ${client.id} in the room ${room.id}`
			});

		},
		leave : function(room) {

			console.log('leave room', room);

			room.leave().then((room) => {
				console.log('leaved the room', room);
			});

		},
		hi : function(room) {

			room.say({
				message : 'hello world'
			});

		},
		announce : function(e) {
			const _this = this;

			e.preventDefault();
			if ( ! this.username) return;
			// create new client and announce it
			client = new __remoteStack.Client({
				username : this.username
			});

			// listen for rooms
			client.on('available-rooms', (rooms) => {
				_this.availableRooms = rooms;
			});

			client.announce().then(() => {
				console.log('client has been announced', client);
			});
		}
	}
})


// const client = new __remoteStack.Client({
// 	username : 'Olivier Bossel'
// });
// client.announce().then(() => {

// 	console.log('client has been announced', client);

// 	// join a room
// 	client.join('tv').then((room) => {
// 		console.log('joinded the tv room', room);
// 	});

// });

window.joinRoom = function(roomId) {
	// join a room
	client.join(roomId).then((room) => {
		console.log('joinded the room', room);
	});
}

window.leaveRoom = function(roomId) {
	// join a room
	client.leave(roomId).then((room) => {
		console.log('left the room', room);
	});
}

// const room = new __remoteStack.Room('tv');
// room.join();

// room.on('queued', (data) => {
// 	console.log('queued', data);
// });


// const socket = __socketIo('http://localhost:8181');
// socket.on('connect', function(){
// 	console.log('connected');

// 	socket.emit('join', {
// 		session : 12
// 	});
// });


// socket.on('joined', (data) => {
// 	console.log('joined', data);
// });
