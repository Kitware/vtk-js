/* eslint-disable global-require */
/* eslint-disable react/require-extension */
var path = require('path');
var loaders = require('./Utilities/config/webpack.loaders.js');

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
      useIframe: false,
    },

    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: true,
  });
};
