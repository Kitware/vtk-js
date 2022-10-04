/* eslint-disable global-require */
const path = require('path');

const webpack = require('webpack');
const ESLintPlugin = require('eslint-webpack-plugin');
const testsRules = require('./Utilities/config/rules-tests');

const sourcePath = path.join(__dirname, './Sources');

if (!process.env.NODE_ENV) process.env.NODE_ENV = 'test';

module.exports = function init(config) {
  config.set({
    plugins: [
      require('karma-webpack'),
      require('karma-chrome-launcher'),
      require('karma-firefox-launcher'),
      require('karma-coverage'),
      require('karma-junit-reporter'),
      require('./Utilities/Karma/tape-object-stream'),
      require('./Utilities/Karma/tape-html-reporter'),
    ],

    basePath: '',
    frameworks: ['tape-object-stream', 'webpack'],
    files: [
      'Sources/Testing/setupTestEnv.js',
      'Sources/**/test*.js',
      { pattern: 'Data/**', watched: false, served: true, included: false },
    ],

    preprocessors: {
      'Sources/Testing/setupTestEnv.js': ['webpack'],
      'Sources/**/test*.js': ['webpack'],
    },

    webpack: {
      mode: 'development',
      module: {
        rules: [].concat(testsRules),
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
        new ESLintPlugin(),
        new webpack.DefinePlugin({
          __BASE_PATH__: "'/base'",
        }),
        new webpack.ProvidePlugin({ process: ['process/browser'] }),
      ],
    },

    reporters: ['coverage', 'junit', 'tape-html'],

    tapeHTMLReporter: {
      templateFile: 'Utilities/Karma/reporting-template.html',
      outputFile: 'Utilities/TestResults/Test-Report.html',
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
      ChromeWebGPU: {
        base: 'ChromeCanary',
        flags: ['--enable-unsafe-webgpu'],
      },
    },
    // browserNoActivityTimeout: 600000,
    browserDisconnectTimeout: 10000,
    browserDisconnectTolerance: 3,

    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ['Chrome'],
    singleRun: true,
  });
};
