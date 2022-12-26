const path = require('path');

module.exports = {
	publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
	devServer: {
		disableHostCheck: true
	},
	configureWebpack: {
		entry: './src/renderer/main.js',
		output: {
			filename: '[name].[hash].js'
		},
		devServer: {
			headers: {
				'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
				'ETag': ''
			},
			injectClient: false,
			liveReload: false,
		},
		resolve: {
			alias: {
				"@": path.resolve('src/renderer')
			}
		}
	},
	css: {
		loaderOptions: {
			less: {
				javascriptEnabled: true
			}
		}
	},
	chainWebpack: (config) => {
		config.plugins.delete('preload');
		config
			.plugin('html')
			.tap(args => {
				args[0].template = __dirname + '/src/renderer/public/index.html'
				return args
			})
	}
}