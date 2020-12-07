/* eslint-disable global-require */
/* eslint-disable react/require-extension */
const path = require('path');

const webpack = require('webpack');
const testsRules = require('./Utilities/config/rules-tests.js');
const linterRules = require('./Utilities/config/rules-linter.js');

const sourcePath = path.join(__dirname, './Sources');

if (!process.env.NODE_ENV) process.env.NODE_ENV = 'test';

module.exports = function init(config) {
  config.set({
    plugins: [
      require('karma-webpack'),
      require('karma-tap'),
      require('karma-chrome-launcher'),
      require('karma-firefox-launcher'),
      require('karma-coverage'),
      require('karma-tap-pretty-reporter'),
      require('karma-junit-reporter'),
    ],

    basePath: '',
    frameworks: ['tap', 'webpack'],
    files: [
      'Sources/tests.js',
      { pattern: 'Data/**', watched: false, served: true, included: false },
    ],

    preprocessors: {
      'Sources/tests.js': ['webpack'],
    },

    webpack: {
      mode: 'development',
      module: {
        rules: [].concat(testsRules, linterRules),
      },
      resolve: {
        modules: [path.resolve(__dirname, 'node_modules'), sourcePath],
        alias: {
          'vtk.js': __dirname,
          stream: 'stream-browserify',
          buffer: 'buffer',
        },
        fallback: {
          path: false,
          fs: false,
        },
      },
      plugins: [
        new webpack.DefinePlugin({
          __BASE_PATH__: "'/base'",
        }),
        new webpack.ProvidePlugin({ process: ['process/browser'] }),
      ],
    },

    reporters: ['coverage', 'tap-pretty', 'junit'],

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

    junitReporter: {
      outputDir: 'Utilities/TestResults',
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
