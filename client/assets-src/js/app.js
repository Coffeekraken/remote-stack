import __remoteStack from '../../../api/index';
import __Vue from 'vue/dist/vue';

import nipplejs from 'nipplejs';

navigator.getUserMedia  = navigator.getUserMedia ||
                          navigator.webkitGetUserMedia ||
                          navigator.mozGetUserMedia ||
                          navigator.msGetUserMedia;

__Vue.config.delimiters = ['<%', '%>']

let client;
let joystickManager;

var app = new __Vue({
	el: '#testsApp',
	delimiters: ["<%","%>"],
	data: {
		color : '#ff0000',
		missedTurn : false,
		room : null,
		client : null,
		roomId : null,
		username : '',
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
				compression : false,
				debug : true
				// host : 'jerome.olivierbossel.com'
			});

			client.on('missed-turn', (room) => {
				this.missedTurn = true;
				setTimeout(() => {
					this.missedTurn = false;
				}, 3000);
			});

			client.announce().then(() => {
				console.log('client has been announced', client);
				this.client = client
			});
		},
		join : function(e = null) {

			if (e) e.preventDefault();

			client.join(this.roomId).then((room) => {

				this.room = room;

				room.on('closed', (room) => {
					this.room = null
					this.roomId = null
				})

				setTimeout(() => {
					const joystickElm = document.querySelector(`.joystick[for="${this.roomId}"]`);

					console.log('joystickElm', joystickElm)

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
						sendPositionInterval = setInterval(() => {
							this.room.sendToApp({
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

			}, (error) => {
				console.error(error);
			});

		},
		leave : function(room) {

			if (joystickManager) {
				joystickManager.destroy();
			}

			room.leave().then((room) => {
				console.log('leaved the room', room.id);
			});

		}
	}
})

