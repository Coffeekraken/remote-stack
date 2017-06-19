# Client

Client proxy to connect and control a remote application from any device through a socket.io server

### Example
```js
	import __remoteStack from 'coffeekraken-remote-stack'
const client = new __remoteStack.api.client.Client({
	username : 'Cool client'
});
client.announce().then(() => {
	// do something when the client has been announced correctly
	// join a room
 client.join('cool-room').then(() => {
 	// do something when the client has joined the wanted room...
 });
});

// listen for some events
client.on('client.queued', (room) => {
	// client has been queued in the passed room after client.join('cool-room') call...
});
client.on('client.picked', (room) => {
 // client has been picked in the passed room...
 // you can at this point be confident that the client.join('cool-room') will succeed
 // but you need to call it again yourself...
});
client.on('client.picked-timeout', (room, remainingTimeout) => {
	// do something on each tick of the picked timeout...
});
```
Author : Olivier Bossel <olivier.bossel@gmail.com>


## Constructor


Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
data  |  **{ [Object](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Object) }**  |  The data you want to assign to the client  |  optional  |  {}
settings  |  **{ [Object](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Object) }**  |  Configure the app socket through this settings  |  optional  |  {}





## Properties


### availableRooms

All the rooms available to join

Type : **{ Object<Room> }**


### joinedRooms

All the rooms in which the client is in

Type : **{ Object<Room> }**


## Methods


### announce

Announce the client to the socket.io server.

Return **{ [Promise](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Promise) }** A promise


### join

Ask to join a room
This request can lead to a "client.queued" event if the requested room is full. You will need to
call this method again when you receive the "client.picked" event



Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
roomId  |  **{ [String](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/String) }**  |  The room id you want the client to join  |  required  |

Return **{ [Promise](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Promise) }** A promise that will be resolved only if the client is accepted directly in the room


### leave

Leave the passed room


Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
roomId  |  **{ [String](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/String) }**  |  The room id you want the client to leave  |  required  |

Return **{ [Promise](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Promise) }** A promise that will be resolved when the client has successfuly left the room


### isAnnounced

Return if the client has been annouced to the server

Return **{ [Boolean](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Boolean) }** true if announced, false if not


### on

Listen to a particular event


Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
name  |  **{ [String](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/String) }**  |  The event name to listen to  |  required  |
cb  |  **{ [Function](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Function) }**  |  The callback function to to call  |  required  |


### once

Listen to a particular event only once


Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
name  |  **{ [String](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/String) }**  |  The event name to listen to  |  required  |
cb  |  **{ [Function](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Function) }**  |  The callback function to to call  |  required  |


### off

Remove a particular event listener


Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
name  |  **{ [String](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/String) }**  |  The event name to listen to  |  required  |


## Events


### client.announced

Notify that the client has been announced to the server


#### Example
```js
	myClient.on('client.annouced', () => {
	// do something here...
});
```

### client.joined

Notify that the client has successfuly joined a room



Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
room  |  **{ Room }**  |  The joined room object  |  required  |

#### Example
```js
	myClient.on('client.joined', (room) => {
	// do something here...
});
```

### client.left

Notify that the client has successfuly left a room



Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
room  |  **{ Room }**  |  The left room object  |  required  |

#### Example
```js
	myClient.on('client.left', (room) => {
	// do something here...
});
```

### client.queued

Notify that the client has been queued in a particular room



Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
room  |  **{ Room }**  |  The room object  |  required  |

#### Example
```js
	myClient.on('client.queued', (room) => {
	// do something here...
});
```

### client.picked

Notify that the client has been picked in a particular room



Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
room  |  **{ Room }**  |  The room object  |  required  |

#### Example
```js
	myClient.on('client.picked', (room) => {
	// try to join the room again here...
	// you can be confident that the join will be a success until the picked-timeout is not finished...
});
```

### client.picked-timeout

Notify each second of the remaining timeout left to join the room when the client has been picked



Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
room  |  **{ Room }**  |  The room object  |  required  |
remainingTimeout  |  **{ Integer }**  |  The timeout left before the client is being kicked of the picked queue  |  required  |

#### Example
```js
	myClient.on('client.picked-timeout', (room, remainingTimeout) => {
	// do something here...
});
```

### client.missed-turn

Notify that the client has missed his turn after being picked



Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
room  |  **{ Room }**  |  The room object  |  required  |

#### Example
```js
	myClient.on('client.missed-turn', (room) => {
	// do something here...
});
```