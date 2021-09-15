// node modules
const { merge } = require('webpack-merge');
const path = require('path');
const webpack = require('webpack');

// config files
const common = require('./webpack.common.js');
const settings = require('./webpack.settings.js');

// Configure the webpack-dev-server
function configureDevServer(port) {
  return {
    static: {
      directory: path.resolve(__dirname, settings.paths.dist.base),
    },
    client: {
      overlay: true,
      webSocketURL: settings.devServerConfig.ws,
    },
    host: settings.devServerConfig.host(),
    port: port,
    hot: 'only',
    devMiddleware: {
      stats: 'errors-only',
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  };
}

const port = settings.devServerConfig.port();

// Development module exports
module.exports = merge(common.baseConfig, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: configureDevServer(port),
});
