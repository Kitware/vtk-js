const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

Handlebars.registerHelper('equals', function(a, b) {
  return a === b;
});

Handlebars.registerHelper('json', function(obj) {
  return JSON.stringify(obj);
});

var TapeHTMLReporter = function(baseReporterDecorator, rootConfig, logger) {
  const log = logger.create('tape-html-reporter');
  const config = rootConfig.tapeHTMLReporter || {};

  // config
  const templateFile = config.templateFile;
  const outputFile = config.outputFile;

  // state
  let testData = {
    browsers: [],
  };
  let browserIndex = {};
  let currentSuite = null;

  const createSuite = (name) => ({ name, success: false, specs: [] });

  baseReporterDecorator(this);

  this.onBrowserStart = function(browser) {
    const info = {
      id: browser.id,
      name: browser.name,
      tests: [],
      summary: {
        failed: 0,
        passed: 0,
        skipped: 0,
        total: 0,
      },
    };
    browserIndex[browser.id] = info;
    testData.browsers.push(info);
  };

  const addSpec = (browser, result) => {
    const suiteName = result.suite.join(' ').trim() || '(untitled suite)';
    const browserInfo = browserIndex[browser.id];

    if (!currentSuite || (currentSuite && currentSuite.name !== suiteName)) {
      currentSuite = createSuite(suiteName);
      browserInfo.tests.push(currentSuite);
    }

    // result has a shape defined in tape-object-stream/adapter.js
    currentSuite.specs.push(result);

    if (result.skipped) {
      browserInfo.summary.skipped += 1;
    } else if (result.success) {
      browserInfo.summary.passed += 1;
    } else {
      browserInfo.summary.failed += 1;
    }
    browserInfo.summary.total += 1;
  };

  this.specSuccess = addSpec;
  this.specFailure = addSpec;
  this.specSkipped = addSpec;

  this.onRunComplete = function(browsers, results) {
    // fill in test success flag
    testData.browsers.forEach((browser) => {
      browser.tests.forEach((test) => {
        test.success = test.specs.reduce((yn, spec) => yn && spec.success, true);
      });

      console.info(`Browser: ${browser.name}`);
      console.info(`\tSuccess:\t${browser.summary.passed}`);
      console.info(`\tSkipped:\t${browser.summary.skipped}`);
      console.info(`\tFailed:\t${browser.summary.failed}`);
      console.info(`\tTotal:\t${browser.summary.total}`);
    });

    // render out html
    let templateHTML = '';
    try {
      templateHTML = fs.readFileSync(templateFile, { encoding: 'utf8' });
    } catch (e) {
      return log.error(`error reading template file: ${e}`);
    }
    const template = Handlebars.compile(templateHTML);

    if (outputFile) {
      try {
        fs.mkdirSync(path.dirname(outputFile), { recursive: true });
      } catch (e) {
        if (e.code !== 'EEXIST') {
          log.error(`error creating test results folder: ${e}`);
          return;
        }
      }

      try {
        fs.writeFileSync(outputFile, template(testData), { encoding: 'utf8' });
        log.info(`report written to file ${outputFile}`);
      } catch (e) {
        log.error(`error writing report to file ${outputFile}: ${e}`);
      }
    }
  };
};

TapeHTMLReporter.$inject = [
  'baseReporterDecorator',
  'config',
  'logger',
];

module.exports = {
  'reporter:tape-html': ['type', TapeHTMLReporter],
};
