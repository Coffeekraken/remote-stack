module.exports = {
	entry: {
		'client/assets/js/app.js' : './client/assets-src/js/app.js',
		'client/assets/js/tests.js' : './client/assets-src/js/tests.js',
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
