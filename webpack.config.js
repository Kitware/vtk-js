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
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      { test: entry, loader: 'expose-loader?vtk' },
    ].concat(linterRules, vtkRules),
  },
  resolve: {
    modules: [
      path.resolve(__dirname, 'node_modules'),
      sourcePath,
    ],
    alias: {
      'vtk.js': __dirname,
    },
  },
};
