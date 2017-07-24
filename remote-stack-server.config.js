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
	allowSettingsOverride : true,

	// specify a room id pattern to follow (optional)
	newRoomIdPattern : null,

	// default room settings
	defaultNewRoomSettings : {
		maxClients : 10,
		pickedTimeout : 10000,
		sessionDuration : 10000,
		endSessionNotificationTimeout : 5000,
		averageSessionDuration : 10000
	},

	// rooms
	rooms : []
}
