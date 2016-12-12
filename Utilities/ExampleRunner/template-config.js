module.exports = function buildConfig(name, relPath, destPath, root) {
  return `
var loaders = require('../config/webpack.loaders.js');
var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  plugins: [
    new HtmlWebpackPlugin({
      inject: 'body',
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
  eslint: {
    configFile: '${root}/.eslintrc.js',
  },
  devServer: {
    contentBase: '${destPath}',
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
`;
};

