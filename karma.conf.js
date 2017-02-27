/* eslint-disable global-require */
/* eslint-disable react/require-extension */
var path = require('path');
var loaders = require('./Utilities/config/webpack.loaders.js');
var webpack = require('webpack');

if (!process.env.NODE_ENV) process.env.NODE_ENV = 'test';

module.exports = function init(config) {
  config.set({
    plugins: [
      require('karma-webpack'),
      require('karma-tap'),
      require('karma-chrome-launcher'),
      require('karma-electron'),
      require('karma-coverage'),
      require('karma-tap-pretty-reporter'),
    ],

    basePath: '',
    frameworks: ['tap'],
    files: [
      './node_modules/babel-polyfill/dist/polyfill.min.js',
      'Sources/tests.js',
      { pattern: 'Data/**', watched: false, served: true, included: false },
    ],

    preprocessors: {
      'Sources/tests.js': ['webpack'],
    },

    webpack: {
      node: {
        fs: 'empty',
      },
      module: {
        loaders: [].concat(loaders),
      },
      resolve: {
        alias: {
          'vtk.js': path.resolve('.'),
        },
      },
      plugins: [
        new webpack.DefinePlugin({
          __BASE_PATH__: "'/base'",
        }),
      ],
    },

    webpackMiddleware: {
      noInfo: true,
    },

    reporters: [
      'coverage',
      'tap-pretty',
    ],

    tapReporter: {
      outputFile: 'Documentation/content/coverage/tests.md',
      prettifier: 'tap-markdown',
      separator: '\n=========================================================\n=========================================================\n',
    },

    coverageReporter: {
      dir: 'Documentation/build-tmp/public',
      reporters: [
        { type: 'html', subdir: 'coverage' },
      ],
    },

    client: {
      useIframe: true,
    },

    // browserNoActivityTimeout: 600000,
    // browserDisconnectTimeout: 600000,

    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: true,
  });
};
