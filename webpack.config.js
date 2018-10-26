const path = require('path');

const entry = path.join(__dirname, './Sources/index.js');
const sourcePath = path.join(__dirname, './Sources');
const outputPath = path.join(__dirname, './dist');

const vtkRules = require('./Utilities/config/rules-vtk.js');
const linterRules = require('./Utilities/config/rules-linter.js');

const plugins = [];

// ----------------------------------------------------------------------------
// Notifier
// => Uncomment if you want notification when error or done
// ----------------------------------------------------------------------------
// const WebpackNotifierPlugin = require('webpack-notifier');
// plugins.push(
//   new WebpackNotifierPlugin({
//     title: 'Webpack',
//     excludeWarnings: true,
//     alwaysNotify: true,
//   })
// );
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Only for dev
// => Nice dashboard when dev
// ----------------------------------------------------------------------------
// const Dashboard = require('webpack-dashboard');
// const DashboardPlugin = require('webpack-dashboard/plugin');
// const dashboard = new Dashboard();
// plugins.push(new DashboardPlugin(dashboard.setData));
// ----------------------------------------------------------------------------

module.exports = {
  entry,
  plugins,
  output: {
    path: outputPath,
    filename: 'vtk.js',
    libraryTarget: 'umd',
  },
  module: {
    rules: [].concat(linterRules, vtkRules),
  },
  resolve: {
    modules: [path.resolve(__dirname, 'node_modules'), sourcePath],
    alias: {
      'vtk.js': __dirname,
    },
  },
};
