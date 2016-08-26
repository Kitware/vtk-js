/* eslint-disable global-require */
/* eslint-disable react/require-extension */
// => | awk -F': ' '{print $2}' | sed \"s/^'\\(.*\\)'$/\\1/\" | tap-spec",
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
    },

    webpackMiddleware: {
      noInfo: true,
    },

    reporters: [
      'coverage',
      'tap-pretty',
    ],

    tapReporter: {
      prettifier: 'tap-spec',
      separator: '\n=========================================================\n=========================================================\n',
    },

    coverageReporter: {
      dir: 'Documentation/build-tmp/public',
      reporters: [
        { type: 'html', subdir: 'coverage' },
      ],
    },

    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: false,
  });
};
