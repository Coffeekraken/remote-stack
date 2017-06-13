import __socketIo from 'socket.io-client'

import __remoteStackApp from '../../../api/app/index';

const app = new __remoteStackApp.App({
	name : 'Ultra cool remotely controlled app'
}, {
	host : 'jerome.olivierbossel.com'
});

const clients = {};

app.on('new-client', (client) => {
	// console.log('new client', client);

	// create new client
	clients[client.id] = new Player(client.username, client.color);

});

app.on('client-left', (client) => {
	if ( ! clients[client.id]) return;
	clients[client.id].destroy();
});

app.on('receive-from-client', (data, from) => {
	// console.log('data', data);

	if ( ! clients[from.id]) return;

	clients[from.id].move(data.x, data.y);

});

app.announce('tv').then(() => {
	// console.log('app has been announced', app);
});


class Player {
	_elm = null;
	_top = window.innerHeight * .5;
	_left = window.innerWidth * .5;
	constructor(username, color) {
		this._elm = document.createElement('div');
		this._elm.classList.add('player');
		this._elm.style.position = 'absolute';
		this._elm.style.transform = 'translateX(-50%) translateY(-50%)';
		this._elm.style.top = this._top + 'px';
		this._elm.style.left = this._left + 'px';

		const usernameElm = document.createElement('div');
		usernameElm.style.position = 'absolute';
		usernameElm.style.bottom = '100%';
		usernameElm.style.left = '50%';
		usernameElm.style.transform = 'translateX(-50%)';
		usernameElm.innerHTML = username;
		usernameElm.style.fontSize = '12px';
		this._elm.appendChild(usernameElm);

		// this._elm.style.transition = 'all 0.03s linear 0s';
		this._elm.style.backgroundColor = color;
		this._elm.style.width = '20px';
		this._elm.style.height = '20px';

		document.body.appendChild(this._elm);
	}

	move(x, y) {

		this._top += y * .3;
		this._left += x * .3;

		if (this._top < 0) this._top = 0;
		else if (this._top > window.innerHeight) this._top = window.innerHeight;
		if (this._left < 0) this._left = 0;
		else if (this._left > window.innerWidth) this._left = window.innerWidth;


		this._elm.style.top = this._top + 'px';
		this._elm.style.left = this._left + 'px';

		// if (0 <= angle <= 90) {

		// } else if (90 < angle <= 180) {

		// } else if (180 < angle <= 270) {

		// } else if (270 < angle <= 360) {

		// }
	}

	destroy() {
		this._elm.parentNode.removeChild(this._elm);
	}

}
