const webpack = require('webpack');
const path = require('path');
const autoprefixer = require('autoprefixer');

const entry = path.join(__dirname, './Sources/index.js');
const sourcePath = path.join(__dirname, './Sources');
const outputPath = path.join(__dirname, './dist');

const vtkRules = require('./Utilities/config/rules.js');
const plugins = [
  new webpack.LoaderOptionsPlugin({
    options: {
      postcss: [
        autoprefixer({
          browsers: [
            'last 3 version',
            'ie >= 10',
          ],
        }),
      ],
      context: __dirname,
    },
  }),
];

module.exports = {
  plugins,
  entry,
  output: {
    path: outputPath,
    filename: 'vtk.js',
  },
  module: {
    rules: [
      { test: entry, loader: 'expose-loader?vtk' },
    ].concat(vtkRules),
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
