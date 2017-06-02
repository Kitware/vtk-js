const webpack = require('webpack');
const path = require('path');

const entry = path.join(__dirname, './Sources/index.js');
const sourcePath = path.join(__dirname, './Sources');
const outputPath = path.join(__dirname, './dist');

const vtkRules = require('./Utilities/config/rules-vtk.js');
const linterRules = require('./Utilities/config/rules-linter.js');

module.exports = {
  entry,
  output: {
    path: outputPath,
    filename: 'vtk.js',
  },
  module: {
    rules: [
      { test: entry, loader: 'expose-loader?vtk' },
    ].concat(linterRules, vtkRules),
  },
  resolve: {
    extensions: ['.webpack-loader.js', '.web-loader.js', '.loader.js', '.js', '.jsx'],
    modules: [
      path.resolve(__dirname, 'node_modules'),
      sourcePath,
    ],
    alias: {
      'vtk.js': __dirname,
    },
  },
};
