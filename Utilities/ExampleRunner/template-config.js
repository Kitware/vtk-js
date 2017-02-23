var path = require('path');
var vtkBasePath = path.resolve('.');
var pathSepa = (path.sep === '\\') ? '\\\\' : '/';

module.exports = function buildConfig(name, relPath, destPath, root) {
  return `
var loaders = require('../config/webpack.loaders.js');
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
  entry: '${relPath}',
  output: {
    path: '${destPath}',
    filename: '${name}.js',
  },
  module: {
    preLoaders: [{
      test: /\.js$/,
      loader: 'eslint-loader',
      exclude: /node_modules/,
    }],
    loaders: loaders,
  },
  resolve: {
    alias: {
      'vtk.js': '${vtkBasePath}',
    },
  },
  eslint: {
    configFile: '${root}${pathSepa}.eslintrc.js',
  },

  devServer: {
    contentBase: '${root}',
    port: 9999,
    host: '0.0.0.0',
    hot: true,
    quiet: false,
    noInfo: false,
    stats: {
      colors: true,
    },
    proxy: {
      '${pathSepa}data${pathSepa}**': {
        target: 'http://0.0.0.0:9999/Data',
        pathRewrite: {
          '^/data': ''
        },
      },
    },
  },
};
`;
};

