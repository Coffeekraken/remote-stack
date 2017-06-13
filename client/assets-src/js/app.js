import __remoteStack from '../../../api/client/index';
import __Vue from 'vue/dist/vue';

import nipplejs from 'nipplejs';

__Vue.config.delimiters = ['<%', '%>']

let client;
let joystickManager;

var app = new __Vue({
	el: '#testsApp',
	delimiters: ["<%","%>"],
	data: {
		color : '#ff0000',
		client : {},
		toPeer : null,
		username : '',
		availableRooms : []
	},
	methods : {
		announce : function(e) {
			const _this = this;

			e.preventDefault();
			if ( ! this.username) return;
			// create new client and announce it
			client = new __remoteStack.Client({
				username : this.username,
				color : this.color
			}, {
				host : 'jerome.olivierbossel.com'
			});

			// listen for rooms
			client.on('available-rooms', (rooms) => {
				_this.availableRooms = rooms;
			});

			client.announce().then(() => {
				console.log('client has been announced', client);
			});
		},
		join : function(room) {

			console.log('join room', room);

			client.join(room.id).then((room) => {
				console.log('joinded the room', room.id);

				const joystickElm = document.querySelector(`.joystick[for="${room.id}"]`);


				joystickManager = nipplejs.create({
					zone: joystickElm,
					color: 'blue'
				});

				let start = {
					x : 0,
					y : 0
				};

				let sendPositionInterval = null;
				let joystick = null

				joystickManager.on('start', (e, data) => {

					joystick = data;

					// console.log('start', e, data);
					// start.x = data.position.x;
					// start.y = data.position.y;


					sendPositionInterval = setInterval(() => {
						// console.log(joystick.get(joystick.id));
						this.availableRooms[room.id].sendToApp({
							type : 'move',
							x : joystick.frontPosition.x,
							y : joystick.frontPosition.y
						});
					}, 1000 / 60);

				});
				joystickManager.on('end', (e, data) => {
					clearInterval(sendPositionInterval);
				});
		// 		joystick.on('move', (e, data) => {

		// 			this.availableRooms[room.id].sendToApp({
		// 				type : 'move',
		// 				angle : data.angle.degree,
		// 				distance : data.distance,
		// 				x : data.position.x - start.x,
		// 				y : data.position.y - start.y
		// 			});

		// // 			console.log('move', e, data);
		// 		});

			});

		},
		click: function(room, client) {
			console.log('clicked on', room, client);

			room.sendToClients({
				message : `user ${client.username} has clicked on the user ${client.id} in the room ${room.id}`
			});

		},
		leave : function(room) {

			console.log('leave room', room);

			if (joystickManager) {
				joystickManager.destroy();
			}

			room.leave().then((room) => {
				console.log('leaved the room', room.id);
			});

		},
		hi : function(room) {

			room.sendToClients({
				message : 'hello world'
			});

		},
		hiApp : function(room) {
			room.sendToApp({
				message : 'hello app'
			});
		}
	}
})

