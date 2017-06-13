module.exports = {
	entry: {
		'client/assets/js/app.js' : './client/assets-src/js/app.js',
		'app/assets/js/app.js' : './app/assets-src/js/app.js'
	},
	output: {
		path: require('path').resolve(__dirname),
		filename: '[name]',
	},
	module: {
		loaders: [{
			test: /\.js$/,
			exclude: /(bower_components|node_modules)/,
			loader: 'babel-loader'
		}]
	},
	resolve : {
		alias : {
		}
	}
}
