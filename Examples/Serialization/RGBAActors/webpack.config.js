
var path = require('path');
var loaders = require('../../../Utilities/config/webpack.loaders.js');
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  plugins: [
    new HtmlWebpackPlugin({
      inject: 'body',
    }),
  ],
  entry: './Examples/Serialization/RGBAActors/index.js',
  output: {
    path: path.resolve(__dirname, '../../../dist/RGBAActors'),
    filename: 'RGBAActors.js',
  },
  module: {
    preLoaders: [{
      test: /\.js$/,
      loader: 'eslint-loader',
      exclude: /node_modules/,
    }],
    loaders: loaders,
  },
  eslint: {
    configFile: '.eslintrc.js',
  },
  devServer: {
    contentBase: './dist/RGBAActors',
    port: 9999,
    host: '0.0.0.0',
    hot: true,
    quiet: false,
    noInfo: false,
    stats: {
      colors: true,
    },
  },
};
