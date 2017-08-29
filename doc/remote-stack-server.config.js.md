# `remote-stack-server.config.js` Reference

Here's all the available properties of the `remote-stack-server.config.js`:

```js
module.exports = {

	// server port
	port : 3030,

	// debug
	debug : true,

	// max rooms that can be created (-1 = no limit)
	maxRooms : -1,

	// allow new rooms or not
	allowNewRooms : true,

	// allow of not to override some of the default room settings
	// when create one from the front app side
	// if true, means that all settings can be overrided
	// if false, none of them can be overrided
	// if instanceof Array, specify each settings that can be overrided
	allowSettingsOverride : ['sessionDuration'],

	// specify a room id pattern to follow (optional)
	// eg : /[a-zA-Z]{3}/
	newRoomIdPattern : null,

	// default room settings
	defaultNewRoomSettings : {

		// specify the maximum clients that can connect to this room simultaneously
		maxClients : 10,

		// specify the time frame between the client picked event and the missed-turn one
		pickedTimeout : 10000,

		// specify the duration of a session in the room. At the end of this duration, the clients will
		// leave the room automatically
		sessionDuration : 10000,

		// specify the time during which an "end-session-timeout" event will be emitted each seconds
		// before the end of the session
		endSessionNotificationTimeout : 5000,

		// specify the average session duration of a client inside the room to estimate
		// how many time the queued ones have to wait. (dynamic estimations have to be coded asap)
		averageSessionDuration : 10000
	},

	// specify all the rooms that are available on this server
	rooms : [{

		// room uniq id (no special characters, etc...)
		id : 'tv',

		// room name
		name : 'Television'

		// + every setting from the "defaultNewRoomSettings" object...

	}],

	// ssl certificate
	// {
	// 	key : path-to-key
	// 	cert : path-to-cert
	// 	passphrase : 'something'
	// }
	sslCertificate : false

}
```
