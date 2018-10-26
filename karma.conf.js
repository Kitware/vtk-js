/* eslint-disable global-require */
/* eslint-disable react/require-extension */
var path = require('path');

const testsRules = require('./Utilities/config/rules-tests.js');
const linterRules = require('./Utilities/config/rules-linter.js');

var webpack = require('webpack');

var sourcePath = path.join(__dirname, './Sources');

if (!process.env.NODE_ENV) process.env.NODE_ENV = 'test';

module.exports = function init(config) {
  config.set({
    plugins: [
      require('karma-webpack'),
      require('karma-tap'),
      require('karma-chrome-launcher'),
      require('karma-coverage'),
      require('karma-tap-pretty-reporter'),
    ],

    basePath: '',
    frameworks: ['tap'],
    files: [
      // './node_modules/babel-polyfill/dist/polyfill.min.js',
      'Sources/tests.js',
      { pattern: 'Data/**', watched: false, served: true, included: false },
    ],

    preprocessors: {
      'Sources/tests.js': ['webpack'],
    },

    webpack: {
      mode: 'development',
      node: {
        fs: 'empty',
      },
      module: {
        rules: [].concat(testsRules, linterRules),
      },
      resolve: {
        modules: [path.resolve(__dirname, 'node_modules'), sourcePath],
        alias: {
          'vtk.js': __dirname,
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

    reporters: ['coverage', 'tap-pretty'],

    tapReporter: {
      outputFile: 'Documentation/content/coverage/tests.md',
      prettifier: 'tap-markdown',
      separator:
        '\n=========================================================\n=========================================================\n',
    },

    coverageReporter: {
      dir: 'Documentation/build-tmp/public',
      reporters: [{ type: 'html', subdir: 'coverage' }],
    },

    client: {
      useIframe: true,
    },

    customLaunchers: {
      ChromeHeadlessNoSandbox: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox', '--ignore-gpu-blacklist'],
      },
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
