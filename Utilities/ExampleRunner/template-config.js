const path = require('path');

const vtkBasePath = path.resolve('.');

const settings = require('../../webpack.settings.js');

module.exports = function buildConfig(
  name,
  relPath,
  destPath,
  root,
  exampleBasePath
) {
  return `
var rules = [].concat(require('../config/rules-vtk.js'), require('../config/rules-examples.js'));
var HtmlWebpackPlugin = require('html-webpack-plugin');
var ESLintPlugin = require('eslint-webpack-plugin');
var webpack = require('webpack');
var path = require('path');

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  plugins: [
    new ESLintPlugin(),
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
      stream: require.resolve('stream-browserify')
    },
  },

  devServer: {
    static: {
      directory: '${root.replace(/\\/g, '\\\\')}',
    },
    port: ${settings.devServerConfig.port()},
    host: '${settings.devServerConfig.host()}',
    allowedHosts: 'all',
    hot: false,
    devMiddleware: {
      stats: {
        colors: true,
      },
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
