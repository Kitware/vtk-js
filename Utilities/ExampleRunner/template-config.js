var path = require('path');
var vtkBasePath = path.resolve('.');
var eslintrc = path.join(vtkBasePath, '.eslintrc.js');

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
  entry: '${relPath.replace(/\\/g, '\\\\')}',
  output: {
    path: '${destPath.replace(/\\/g, '\\\\')}',
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
      'vtk.js': '${vtkBasePath.replace(/\\/g, '\\\\')}',
    },
  },
  eslint: {
    configFile: '${eslintrc.replace(/\\/g, '\\\\')}',
  },

  devServer: {
    contentBase: '${root.replace(/\\/g, '\\\\')}',
    port: 9999,
    host: 'localhost',
    hot: true,
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

