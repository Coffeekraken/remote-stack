module.exports = {

			 /**
				* On client connection (required)
				* @param {client} client connection
				* @param {done} callback function(err) {}
				*/
			 onConnect : function(client, done) {
				 // Faye client
				 // client.subscribe('/channel', function(message) { });

				 client.on('announced', function() {
					client.emit('join', 'tv');
				 });

				 client.on('joined-room-tv', function() {



				 	done();
				 })

				 client.emit('announce', {
				 	username : Math.round(Math.random() * 9999999)
				 });

				 // Socket.io client
				 // client.emit('test', { hello: 'world' });

				 // Primus client
				 // client.write('Sailing the seas of cheese');

				 // WAMP session
				 // client.subscribe('com.myapp.hello').then(function(args) { });

				 // done();
			 },

			 /**
				* Send a message (required)
				* @param {client} client connection
				* @param {done} callback function(err) {}
				*/
			 sendMessage : function(client, done) {
				 // Example:
				 // client.emit('test', { hello: 'world' });
				 // client.publish('/test', { hello: 'world' });
				 // client.call('com.myapp.add2', [2, 3]).then(function (res) { });

					 client.emit('send-to-app', {
					 		_roomId : 'tv',
					 		type : 'move',
					 		x : -50 + Math.round(Math.random() * 100),
					 		y : -50 + Math.round(Math.random() * 100)
					 });
					 done();
			 },

			 /**
				* WAMP connection options
				*/
			 options : {
				 // realm: 'chat'
			 }
		};
