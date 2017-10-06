var path = require('path');
var vtkBasePath = path.resolve('.');

module.exports = function buildConfig(name, relPath, destPath, root, exampleBasePath) {
  return `
var rules = [].concat(require('../config/rules-vtk.js'), require('../config/rules-examples.js'), require('../config/rules-linter.js'));
var HtmlWebpackPlugin = require('html-webpack-plugin');
var webpack = require('webpack');
var path = require('path');

module.exports = {
  plugins: [
    new HtmlWebpackPlugin({
      inject: 'body',
    }),
    new webpack.DefinePlugin({
      __BASE_PATH__: "''",
    }),
  ],
  entry: path.join('${exampleBasePath.replace(/\\/g, '\\\\')}', '${relPath.replace(/\\/g, '\\\\')}'),
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
  },

  devServer: {
    contentBase: '${root.replace(/\\/g, '\\\\')}',
    port: 9999,
    host: '0.0.0.0',
    disableHostCheck: true,
    hot: false,
    quiet: false,
    noInfo: false,
    stats: {
      colors: true,
    },
    proxy: {
      '/data/**': {
        target: 'http://localhost:9999/Data',
        pathRewrite: {
          '^/data': ''
        },
      },
    },
  },
};
`;
};

