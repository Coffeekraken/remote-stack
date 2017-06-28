# `remote-stack-server.config.js` Reference

Here's all the available properties of the `remote-stack-server.config.js`:

```js
module.exports = {

	// server port
	port : 3030,

	// specify all the rooms that are available on this server
	rooms : [{

		// room uniq id (no special characters, etc...)
		id : 'tv',

		// room name
		name : 'Television',

		// specify the maximum clients that can connect to this room simultaneously
		simultaneous : 2,

		// specify the time frame between the client picked event and the missed-turn one
		pickedTimeout : 10000,

		// specify the average session duration of a client inside the room to estimate
		// how many time the queued ones have to wait. (dynamic estimations have to be coded asap)
		averageSessionDuration : 20000

	}]
}
```
