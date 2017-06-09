import __socketIo from 'socket.io-client'

import __remoteStack from '../../../api/client/index';

const client = new __remoteStack.Client({
	username : 'Olivier Bossel'
});
client.announce().then(() => {

	console.log('client has been announced', client);

	// join a room
	client.join('tv').then((room) => {
		console.log('joinded the tv room', room);
	});

});

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
