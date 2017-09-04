# Room

Room class that represent a room getted from the socket.io server
This class is usually instanciated by the Client one


Author : Olivier Bossel <olivier.bossel@gmail.com>


## Constructor


Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
data  |  **{ [Object](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Object) }**  |  The room data object  |  required  |
socket  |  **{ SocketIo }**  |  The socket instance used to communicate with the server  |  required  |





## Properties


### id

The room id

Type : **{ [String](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/String) }**


### name

The room name

Type : **{ [String](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/String) }**


### app

The app socket id

Type : **{ [String](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/String) }**


### clients

The clients in the room

Type : **{ [Array](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Array) }**


### activeClients

The active clients

Type : **{ [Array](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Array) }**


### activeClientsCount

The active clients count

Type : **{ Integer }**


### queue

Get the queued clients ids

Type : **{ [Array](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Array) }**


### queuedClients

Get the queued clients objects

Type : **{ [Object](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Object) }**


### pickedClients

Get the picked clients objects

Type : **{ [Object](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Object) }**


### maxClients

The number of clients available for this room

Type : **{ Integer }**


### placeInQueue

The place in the queue of the current client

Type : **{ Integer }**


### waitTimeEstimation

The estimation time in which it's the current client turn

Type : **{ [Number](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Number) }**


### averageSessionDuration

The estimation of each sessions in the room

Type : **{ [Number](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Number) }**


### pickedTimeout

The picked timeout if has been picked in the room

Type : **{ [Number](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Number) }**


### pickedRemainingTimeout

The picked queue remaining timeout

Type : **{ [Number](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Number) }**


### sessionDuration

The session duration authorized in this room

Type : **{ [Number](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Number) }**


### sessionRemainingTimeout

The end session remaining timeout

Type : **{ [Number](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Number) }**


### endSessionNotificationTimeout

The end session notification timeout duration

Type : **{ [Number](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Number) }**


## Methods


### sendToClients

Send data to the other room clients


Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
data  |  **{ [Object](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Object) }**  |  THe data to send  |  required  |

#### Example
```js
	room.sendToClients({
	something : 'cool'
});
```

### sendToApp

Send data to the room application


Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
data  |  **{ [Object](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Object) }**  |  THe data to send  |  required  |

#### Example
```js
	room.sendToApp({
	something : 'cool'
});
```

### leave

Leave this room

Return **{ [Promise](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Promise) }** A promise resolved when the client has successfuly left the room

#### Example
```js
	room.leave().then(() => {
	// do something here...
});
```

### destroy

Destroy this room instance locally


### updateData

Update the room data with new ones


Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
data  |  **{ [Object](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Object) }**  |  The new room data  |  required  |

Return **{ Room }** The instance itself to maintain chainability


### isQueued

Return if the current client has been queued or not

Return **{ [Boolean](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Boolean) }** true if the client is in the queue, false if not


### isPicked

Return if the current client has been picked in the room or not

Return **{ [Boolean](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Boolean) }** true if the client has bein picked, false if not


### hasJoined

Return if the current client has joined the room or not

Return **{ [Boolean](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Boolean) }** true if the client has joined the room, false if not


### hasApp

Return if the room has an app or not

Return **{ [Boolean](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Boolean) }** true if the room has an app, false if not


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


### joined

Notify that the client has successfuly joined the room



Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
room  |  **{ Room }**  |  The joined room object  |  required  |

#### Example
```js
	myRoom.on('joined', (room) => {
	// do something here...
});
```

### client.joined

Notify that another client has successfuly joined the room



Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
room  |  **{ Room }**  |  The joined room object  |  required  |
client  |  **{ [Object](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Object) }**  |  The joined client object  |  required  |

#### Example
```js
	myRoom.on('client.joined', (room, client) => {
	// do something here...
});
```

### left

Notify that the client has successfuly left the room



Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
room  |  **{ Room }**  |  The left room object  |  required  |

#### Example
```js
	myRoom.on('left', (room) => {
	// do something here...
});
```

### client.left

Notify that another client has successfuly left the room



Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
room  |  **{ Room }**  |  The left room object  |  required  |
client  |  **{ [Object](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Object) }**  |  The left client object  |  required  |

#### Example
```js
	myRoom.on('client.left', (room, client) => {
	// do something here...
});
```

### closed

Notify that the room has been closed



Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
room  |  **{ Room }**  |  The closed room object  |  required  |

#### Example
```js
	myRoom.on('closed', (room) => {
	// do something here...
});
```

### queued

Notify that the client has been queued in a particular room



Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
room  |  **{ Room }**  |  The room object  |  required  |

#### Example
```js
	myRoom.on('queued', (room) => {
	// do something here...
});
```

### client.queued

Notify that another client has been queued in a particular room



Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
room  |  **{ Room }**  |  The room object  |  required  |
client  |  **{ [Object](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Object) }**  |  The queued client object  |  required  |

#### Example
```js
	myRoom.on('client.queued', (room, client) => {
	// do something here...
});
```

### picked

Notify that the client has been picked in a particular room



Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
room  |  **{ Room }**  |  The room object  |  required  |

#### Example
```js
	myRoom.on('picked', (room) => {
	// try to join the room again here...
	// you can be confident that the join will be a success until the picked-remaining-timeout is not finished...
});
```

### client.picked

Notify that another client has been picked in a particular room



Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
room  |  **{ Room }**  |  The room object  |  required  |
client  |  **{ [Object](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Object) }**  |  The picked client object  |  required  |

#### Example
```js
	myRoom.on('client.picked', (room) => {
	// do something here...
});
```

### picked-remaining-timeout

Notify each second of the remaining timeout left to join the room when the client has been picked



Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
room  |  **{ Room }**  |  The room object  |  required  |
remainingTimeout  |  **{ Integer }**  |  The timeout left before the client is being kicked out of the picked queue  |  required  |

#### Example
```js
	myRoom.on('picked-remaining-timeout', (room, remainingTimeout) => {
	// do something here...
});
```

### missed-turn

Notify that the client has missed his turn after being picked



Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
room  |  **{ Room }**  |  The room object  |  required  |

#### Example
```js
	myRoom.on('missed-turn', (room) => {
	// do something here...
});
```

### session-remaining-timeout

Notify each second of the remaining session timeout left. This will be fired during the "endSessionNotificationTimeout" setting in the server configuration



Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
room  |  **{ Room }**  |  The room object  |  required  |
remainingTimeout  |  **{ Integer }**  |  The timeout left before the client is being kicked out of the room  |  required  |

#### Example
```js
	myRoom.on('session-remaing-timeout', (room, remainingTimeout) => {
	// do something here...
});
```

### client.data

Notify that a client has send some data to the room



Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
data  |  **{ [Object](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Object) }**  |  The data sent by the client  |  required  |

#### Example
```js
	myRoom.on('client.data', (client, data) => {
	// do something here...
});
```

### app.data

Notify that the room app has send some data



Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
data  |  **{ [Object](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Object) }**  |  The data sent by the app  |  required  |

#### Example
```js
	myRoom.on('app.data', (data) => {
	// do something here...
});
```

### error

Notify that an error has occured with his details



Name  |  Type  |  Description  |  Status  |  Default
------------  |  ------------  |  ------------  |  ------------  |  ------------
error  |  **{ [Object](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Object) }**  |  The object that describe the error  |  required  |

#### Example
```js
	myClient.on('error', (error) => {
	// do something here...
});
```