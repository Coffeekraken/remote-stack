import __remoteStack from '../../../api/index';
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
		missedTurn : false,
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
				compression : false
				// host : 'jerome.olivierbossel.com'
			});

			// listen for rooms
			client.on('available-rooms', (rooms) => {
				_this.availableRooms = rooms;
			});

			client.on('client.missed-turn', (room) => {
				console.log('missed-turn', room);
				this.missedTurn = true;
				setTimeout(() => {
					this.missedTurn = false;
				}, 3000);
			});

			client.announce().then(() => {
				console.log('client has been announced', client);
			});
		},
		join : function(room) {

			console.log('join room', room);

			client.join(room.id).then((room) => {
				console.log('joinded the room', room.id);

				setTimeout(() => {
					const joystickElm = document.querySelector(`.joystick[for="${room.id}"]`);

					joystickManager = nipplejs.create({
						zone: joystickElm,
						fadeTime:0,
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
								x : Math.round(joystick.frontPosition.x),
								y : Math.round(joystick.frontPosition.y)
							});
						}, 1000 / 60);

					});
					joystickManager.on('end', (e, data) => {
						clearInterval(sendPositionInterval);
					});

				}, 100);

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

		}
	}
})

