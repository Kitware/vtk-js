
var path = require('path');
var loaders = require('../../../Utilities/config/webpack.loaders.js');
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  plugins: [
    new HtmlWebpackPlugin({
      inject: 'body',
    }),
  ],
  entry: './Examples/WebGL/PolyDataViewer/index.js',
  output: {
    path: path.resolve(__dirname, '../../../dist/PolyDataViewer'),
    filename: 'PolyDataViewer.js',
  },
  module: {
    preLoaders: [{
      test: /\.js$/,
      loader: 'eslint-loader',
      exclude: /node_modules/,
    }],
    loaders: [
      {
        test: /\.glsl$/i,
        loader: 'shader',
      },
    ].concat(loaders),
  },
  eslint: {
    configFile: '.eslintrc.js',
  },
  devServer: {
    contentBase: './dist/PolyDataViewer',
    port: 9999,
    hot: true,
    quiet: false,
    noInfo: false,
    stats: {
      colors: true,
    },
  },
};
