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


### clients

The clients in the room

Type : **{ Array<Client> }**


### activeClients

The active clients

Type : **{ Array<Client> }**


### activeClientsCount

The active clients count

Type : **{ Integer }**


### queue

Get the queued clients ids

Type : **{ [Array](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Array) }**


### queuedClients

Get the queued clients objects

Type : **{ Object<Object> }**


### pickedClients

Get the picked clients objects

Type : **{ Object<Object> }**


### places

The number of places available for this room

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

### join

Ask to join the room
This request can lead to a "client.queued" event if this room is full. You will need to
call this method again when you receive the "client.picked" event


Return **{ [Promise](https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Promise) }** A promise that will be resolved only if the client is accepted directly in the room


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