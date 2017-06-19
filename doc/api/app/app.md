# App

Application proxy to connect into a room and be remotely controlled from any devices through sockets

### Example
```js
	import __remoteStack from 'coffeekraken-remote-stack'
const app = new __remoteStack.App({
 	name : 'My cool app'
});
app.announce('my-cool-room').then(() => {
 	// listen for some events, etc...
 	app.on('')
});
```
Author : Olivier Bossel <olivier.bossel@gmail.com>


## Constructor


Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
data  |  **{ [Object](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Object) }**  |  The data you want to assign to the app  |  optional  |  {}
settings  |  **{ [Object](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Object) }**  |  Configure the app socket through this settings  |  optional  |  {}






## Methods


### announce

Announce the app in a particular room available on the server side.
One room can contain only one app.


Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
roomId  |  **{ [String](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/String) }**  |  The id of the room to join  |  required  |

Return **{ [Promise](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Promise) }** A promise


### isAnnounced

Return if the app has been annouced in a room or not

Return **{ [Boolean](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Boolean) }** true if announced, false if not


### sendToClients

Send something to all or some clients that are connected to this app through a room


Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
data  |  **{ [Object](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Object) }**  |  The data to send  |  required  |
clientIds  |  **{ [Array](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Array) , [String](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/String) }**  |  The id's of the clients to send the data to  |  optional  |  null


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


### app.announced

Notify that the app has been announced inside his room


#### Example
```js
	myApp.on('app.annouced', () => {
	// do something here...
});
```

### app.joined

Notify that the app has joined his room


#### Example
```js
	myApp.on('app.joined', () => {
	// do something here...
});
```

### client.data

Notify that the app has received some data from a client


Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
data  |  **{ [Object](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Object) }**  |  The data sent by the client  |  required  |
from  |  **{ [Object](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Object) }**  |  The client object that has sent the data  |  required  |

#### Example
```js
	myApp.on('client.data', (data, from) => {
	// do something here...
});
```

### client.joined

Notify that a client has joined the app


Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
from  |  **{ [Object](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Object) }**  |  The client object that has sent the data  |  required  |

#### Example
```js
	myApp.on('client.joined', (client) => {
	// do something here...
});
```

### client.left

Notify that a client has left the app


Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
from  |  **{ [Object](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Object) }**  |  The client object that has sent the data  |  required  |

#### Example
```js
	myApp.on('client.left', (client) => {
	// do something here...
});
```