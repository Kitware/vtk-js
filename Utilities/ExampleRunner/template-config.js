var path = require('path');
var vtkBasePath = path.resolve('.');

const settings = require('../../webpack.settings.js');

module.exports = function buildConfig(
  name,
  relPath,
  destPath,
  root,
  exampleBasePath
) {
  return `
var rules = [].concat(require('../config/rules-vtk.js'), require('../config/rules-examples.js'), require('../config/rules-linter.js'));
var HtmlWebpackPlugin = require('html-webpack-plugin');
var webpack = require('webpack');
var path = require('path');

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  plugins: [
    new HtmlWebpackPlugin({
      template: '${root.replace(
        /\\/g,
        '\\\\'
      )}/Utilities/ExampleRunner/template.html',
    }),
    new webpack.DefinePlugin({
      __BASE_PATH__: "''",
    }),
  ],
  entry: path.join('${exampleBasePath.replace(
    /\\/g,
    '\\\\'
  )}', '${relPath.replace(/\\/g, '\\\\')}'),
  output: {
    path: '${destPath.replace(/\\/g, '\\\\')}',
    filename: '${name}.js',
  },
  module: {
    rules: rules,
  },
  resolve: {
    alias: {
      'vtk.js': '${vtkBasePath.replace(/\\/g, '\\\\')}',
    },
    fallback: {
      fs: false,
    },
  },

  devServer: {
    contentBase: '${root.replace(/\\/g, '\\\\')}',
    port: ${settings.devServerConfig.port()},
    host: '${settings.devServerConfig.host()}',
    disableHostCheck: true,
    hot: false,
    quiet: false,
    noInfo: false,
    stats: {
      colors: true,
    },
    proxy: {
      '/data/**': {
        target: 'http://${settings.devServerConfig.host()}:${settings.devServerConfig.port()}/Data',
        pathRewrite: {
          '^/data': ''
        },
      },
    },
  },
};
`;
};
