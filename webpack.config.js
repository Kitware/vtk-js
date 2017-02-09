var entry = require.resolve('./Sources/index.js');

var path = require('path');
var webpack = require('webpack');
var loaders = require('./Utilities/config/webpack.loaders.js');
var pluginList = [];

if (process.env.NODE_ENV === 'production') {
  console.log('==> Production build');
  pluginList.push(new webpack.DefinePlugin({
    'process.env': {
      NODE_ENV: JSON.stringify('production'),
    },
  }));
}

module.exports = {
  plugins: pluginList,
  entry: entry,
  output: {
    path: './dist',
    filename: 'vtk.js',
  },
  module: {
    preLoaders: [{
      test: /\.js$/,
      loader: 'eslint-loader',
      exclude: /node_modules/,
    }],
    loaders: [
      { test: entry, loader: 'expose?vtk' },
    ].concat(loaders),
  },
  postcss: [
    require('autoprefixer')({ browsers: ['last 2 versions'] }),
  ],
  eslint: {
    configFile: '.eslintrc.js',
  },
  resolve: {
    alias: {
      'vtk.js': path.resolve('.'),
    },
  },
};
