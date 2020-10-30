// node modules
const { merge } = require('webpack-merge');
const path = require('path');
const webpack = require('webpack');

// webpack plugins
const Dashboard = require('webpack-dashboard');
const DashboardPlugin = require('webpack-dashboard/plugin');

const dashboard = new Dashboard();

// config files
const common = require('./webpack.common.js');
const settings = require('./webpack.settings.js');

// Configure the webpack-dev-server
function configureDevServer(port) {
  return {
    contentBase: path.resolve(__dirname, settings.paths.dist.base),
    public: settings.devServerConfig.public(),
    host: settings.devServerConfig.host(),
    port: port,
    quiet: true,
    hot: true,
    hotOnly: true,
    overlay: true,
    stats: 'errors-only',
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  };
}

const port = settings.devServerConfig.port();

// Development module exports
module.exports = [
  merge(common.baseConfig, {
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: configureDevServer(port),
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
      new DashboardPlugin(dashboard.setData),
    ],
  }),
  merge(common.liteConfig, {
    mode: 'development',
    devtool: 'inline-source-map',
    devServer: configureDevServer(port + 1),
    plugins: [
      new webpack.HotModuleReplacementPlugin(),
      new DashboardPlugin(dashboard.setData),
    ],
  }),
];
