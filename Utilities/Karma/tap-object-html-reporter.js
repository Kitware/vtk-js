const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');

Handlebars.registerHelper('cleanTestName', function(str) {
  return str.replace(/^# /, '').trim();
});

Handlebars.registerHelper('equals', function(a, b) {
  return a === b;
});

// metadata json must always be preceeded by "metadata:" and end with the end of the string
function splitMetadata(name){
  const index = name.search(/ metadata:\{.*\}$/);
  if (index === -1) {
    return [name, null];
  }
  return [name.substring(0, index).trim(), JSON.parse(name.substr(index + ' metadata:'.length))];
}

var CustomTapHTMLReporter = function(baseReporterDecorator, rootConfig, logger, helper) {
  const log = logger.create('custom-tap-html-reporter');
  const config = rootConfig.customTapHTMLReporter || {};

  // config
  const templateFile = config.templateFile;
  const outputFile = config.outputFile;

  // state
  let testData = {
    browsers: [],
  };
  let browserIndex = {};
  let currentSuite = null;

  const createSuite = (name) => ({ name, specs: [] });

  baseReporterDecorator(this);

  this.onBrowserStart = function(browser) {
    const info = {
      id: browser.id,
      name: browser.name,
      tests: [],
      summary: null,
    };
    browserIndex[browser.id] = info;
    testData.browsers.push(info);
  };

  const addSpec = (browser, result) => {
    // result variable is specific to karma-tap 4.2.0 output
    if (result.skipped) {
      if (!currentSuite) {
        currentSuite = createSuite('(untitled suite)');
        browserIndex[browser.id].tests.push(currentSuite);
      }
      currentSuite.specs.push({
        description: result.description,
        skipped: true,
      });
    } else {
      // clean up test name
      const suiteName = result.suite.join(' ').replace(/^# /, '').trim();
      const details = JSON.parse(result.log[0]);

      // extract test metadata from description
      const [description, metadata] = splitMetadata(result.description);

      if (currentSuite && currentSuite.name !== suiteName) {
        currentSuite = null;
      }
      if (!currentSuite) {
        currentSuite = createSuite(suiteName);
        browserIndex[browser.id].tests.push(currentSuite);
      }

      currentSuite.specs.push({
        description: description,
        success: result.success,
        time: result.time,
        details,
        metadata,
      });
    }
  };

  this.specSuccess = addSpec;
  this.specFailure = addSpec;
  this.specSkipped = addSpec;

  this.onRunComplete = function(browsers, results) {
    browsers.forEach((browser, index) => {
      browserIndex[browser.id].summary = browser.lastResult;
    });

    let templateHTML = '';
    try {
      templateHTML = fs.readFileSync(templateFile, { encoding: 'utf8' });
    } catch (e) {
      return log.error(`error reading template file: ${e}`);
    }
    const template = Handlebars.compile(templateHTML);

    if (outputFile) {
      helper.mkdirIfNotExists(path.dirname(outputFile), (err) => {
        try {
          if (!err) {
            fs.writeFileSync(outputFile, template(testData), { encoding: 'utf8' });
            log.info(`report written to file ${outputFile}`);
          }
        } catch (e) {
          err = e;
        }
        if (err) {
          return log.error(`error writing report to file ${outputFile}: ${err}`);
        }
      });
    }
  };
};

CustomTapHTMLReporter.$inject = [
  'baseReporterDecorator',
  'config',
  'logger',
  'helper',
];

module.exports = {
  'reporter:custom-tap-html': ['type', CustomTapHTMLReporter],
};
