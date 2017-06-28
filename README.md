# Coffeekraken Remote Stack <img src=".resources/coffeekraken-logo.jpg" height="25px" />

<p>
	<a href="https://travis-ci.org/coffeekraken/remote-stack">
		<img src="https://img.shields.io/travis/coffeekraken/remote-stack.svg?style=flat-square" />
	</a>
	<a href="https://www.npmjs.com/package/coffeekraken-remote-stack">
		<img src="https://img.shields.io/npm/v/coffeekraken-remote-stack.svg?style=flat-square" />
	</a>
	<a href="https://github.com/coffeekraken/remote-stack/blob/master/LICENSE.txt">
		<img src="https://img.shields.io/npm/l/coffeekraken-remote-stack.svg?style=flat-square" />
	</a>
	<!-- <a href="https://github.com/coffeekraken/remote-stack">
		<img src="https://img.shields.io/npm/dt/coffeekraken-remote-stack.svg?style=flat-square" />
	</a>
	<a href="https://github.com/coffeekraken/remote-stack">
		<img src="https://img.shields.io/github/forks/coffeekraken/remote-stack.svg?style=social&label=Fork&style=flat-square" />
	</a>
	<a href="https://github.com/coffeekraken/remote-stack">
		<img src="https://img.shields.io/github/stars/coffeekraken/remote-stack.svg?style=social&label=Star&style=flat-square" />
	</a> -->
	<a href="https://twitter.com/coffeekrakenio">
		<img src="https://img.shields.io/twitter/url/http/coffeekrakenio.svg?style=social&style=flat-square" />
	</a>
	<a href="http://coffeekraken.io">
		<img src="https://img.shields.io/twitter/url/http/shields.io.svg?style=flat-square&label=coffeekraken.io&colorB=f2bc2b&style=flat-square" />
	</a>
</p>

Provide a nice and simple way to handle remote connections from any devices (phones, tablets, etc...)

## Table of content

1. [Install](#readme-install)
2. [Get Started](#readme-get-started)
3. [Client API](#readme-client-api)
4. [Room API](doc/api/client/room.md)
5. [App API](#readme-app-api)
4. [Server](#readme-server)
6. [CLI](#readme-cli)
7. [Contribute](#readme-contribute)
8. [Who are Coffeekraken?](#readme-who-are-coffeekraken)
9. [Licence](#readme-license)

<a name="readme-install"></a>
## Install

```
npm install coffeekraken-remote-stack --save-dev
```

<a name="readme-get-started"></a>
## Get Started

This package expose multiple entry points to cover each parts of a remote client/app structure. Here's the list of entries that you will have access to:

1. API
	1. ```Client``` : The client js api that helps you connect, announce and send instructions to the app
	2. ```App``` : The app js api that helps you to announce your app into a specific room and receive the clients instructions
	3. ```Room``` : The room js api that let you send data to the room app or clients
2. Server : The nodejs that is responsible for:
	1. Connect the client and the app
	2. Expose some rooms to connect to
	3. Handle room's clients queue and picking strategy

<a name="readme-client-api"></a>
### Client API

Here's how to start with the client api:

```js
import remoteStack from 'coffeekraken-remote-stack'
const myClient = new remoteStack.Client({
	username : 'John'
});
myClient.announce().then(() => {
	return myClient.join('cool-room');
}).then((room) => {
	// the client has joiend the room.
	// use now the passed "room" instance to send data to app, etc...
	room.sendToApp({
		someValue : 'Somehting...'
	});
});
// listen for some events
myClient.on('joined', (room) => {
	// do something here...
})
myClient.on('picked', (room) => {
	// do something here...
})
```

<a name="readme-app-api"></a>
### App API

Here's how to start with the app api:

```js
import remoteStack from 'coffeekraken-remote-stack'
const myApp = new remoteStack.App({
	name : 'My cool app'
});
myApp.announce('cool-room').then(() => {
	// the app has been annouced in the "cool-room"
});
// listen for some events
myApp.on('client.joined', (client) => {
	// handle new client...
})
myApp.on('client.left', (client) => {
	// handle the left client...
})
myApp.on('client.data', (data, client) => {
	// client has sent the data...
})
```

<a name="readme-server"></a>
### Server

For the server, you will need a `remote-stack-server.config.js` file at the root of your project.

[See the remote-stack-server.config.js file reference](doc/remote-stack-server.config.js.md)

```js
module.exports = {
	// server port
	port : 3030,

	// rooms
	rooms : [{
		id : 'cool-room',
		name : 'My cool room',
		simultaneous : 2,
		pickedTimeout : 10000,
		averageSessionDuration : 20000
	}]
}
```

Then, add a script into your `package.json` file like so:

```js
{
	"scripts": {
		"server": "coffeekraken-remote-stack-server"
	}
}
```

And finaly, launch your server like so:

```
npm run server
```

<a id="readme-cli"></a>
## CLI

This package expose a simple CLI that you can use to start the server.

```
coffeekraken-remote-stack-server [options]
```

#### Arguments

- ```-p --port``` : The port on which the server will run. Default **3030**
- ```-c --config``` : A path to a config file to load. Default **./remote-stack-server.config.js**

<a id="readme-contribute"></a>
## Contribute

This is an open source project and will ever be! You are more that welcomed to contribute to his development and make it more awesome every day.
To do so, you have several possibilities:

1. [Share the love ❤️](https://github.com/Coffeekraken/coffeekraken/blob/master/contribute.md#contribute-share-the-love)
2. [Declare issues](https://github.com/Coffeekraken/coffeekraken/blob/master/contribute.md#contribute-declare-issues)
3. [Fix issues](https://github.com/Coffeekraken/coffeekraken/blob/master/contribute.md#contribute-fix-issues)
4. [Add features](https://github.com/Coffeekraken/coffeekraken/blob/master/contribute.md#contribute-add-features)
5. [Build web component](https://github.com/Coffeekraken/coffeekraken/blob/master/contribute.md#contribute-build-web-component)

<a id="readme-who-are-coffeekraken"></a>
## Who are Coffeekraken

We try to be **some cool guys** that build **some cool tools** to make our (and yours hopefully) **every day life better**.  

#### [More on who we are](https://github.com/Coffeekraken/coffeekraken/blob/master/who-are-we.md)

<a id="readme-license"></a>
## License

The code is available under the [MIT license](LICENSE.txt). This mean that you can use, modify, or do whatever you want with it. This mean also that it is shipped to you for free, so don't be a hater and if you find some issues, etc... feel free to [contribute](https://github.com/Coffeekraken/coffeekraken/blob/master/contribute.md) instead of sharing your frustrations on social networks like an asshole...
