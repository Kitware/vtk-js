#! /usr/bin/env node

/* eslint-disable */
var program = require('commander');
var path = require('path');
var shell = require('shelljs');
var fs = require('fs');
var examples = {};
var basePath = path.resolve('./Documentation');
var webpackConfigPath = path.join(__dirname, 'webpack.config.js');
var distDir = path.join(__dirname, 'dist');
var buildConfig = require('./template-config.js');
const rootPath = path.resolve(path.join(__dirname, '../..'));

program
  .option('-c, --config [file.js]', 'Configuration file')
  .parse(process.argv);

var configFilePath = path.join(process.cwd(), program.config.replace(/\//g, path.sep));
var configuration = require(configFilePath);

function getSplitedPath(filePath) {
  var a = filePath.split('/');
  var b = filePath.split('\\');
  return a.length > b.length ? a : b;
}

function validPath(str) {
  return str.replace(/\//g, path.sep);
}

// ----------------------------------------------------------------------------
// Find examples
// ----------------------------------------------------------------------------

if (configuration.examples) {
  var filterExamples = [].concat(program.args).filter(i => !!i);
  var buildExample = filterExamples.length === 1;
  var exampleCount = 0;

  console.log('\n=> Extract examples\n');
  configuration.examples.forEach(function (entry) {
    const regexp = entry.regexp ? new RegExp(entry.regexp) : /example\/index.js$/;
    var fullPath = path.join(basePath, entry.path ? entry.path : entry);

    // Single example use case
    examples[fullPath] = {};
    var currentExamples = examples[fullPath];
    shell.cd(fullPath);
    shell.find('.')
      .filter( function(file) {
        return file.match(regexp);
      })
      .forEach( function(file) {
        var fullPath = getSplitedPath(file),
          exampleName = fullPath.pop();

        while (['index.js', 'example'].indexOf(exampleName) !== -1) {
          exampleName = fullPath.pop();
        }

        if (!buildExample || filterExamples.indexOf(exampleName) !== -1) {
          currentExamples[exampleName] = './' + file;
          console.log(' -', exampleName, ':', file);
          exampleCount++;
        } else {
          console.log(' -', exampleName, ': SKIPPED');
        }
      });
  });
  console.log();

  if (exampleCount === 0) {
    examples = null;
  }

  if (buildExample) {
    var exBasePath = null;
    const exampleName = filterExamples[0];
    Object.keys(examples).forEach((exampleBasePath) => {
      if (examples[exampleBasePath][exampleName]) {
        exBasePath = exampleBasePath;
      }
    });

    // console.log(exampleName, ' => ', exBasePath, examples[exBasePath][exampleName]);
    const conf = buildConfig(exampleName, validPath(examples[exBasePath][exampleName]), distDir, validPath(rootPath), validPath(exBasePath));
    shell.ShellString(conf).to(webpackConfigPath);
    shell.cd(exBasePath);
    shell.exec(`webpack-dev-server --progress --open --config ${webpackConfigPath}`)
  } else {
    console.log('=> To run an example:')
    console.log('  $ npm run example -- PUT_YOUR_EXAMPLE_NAME_HERE\n');
  }

}
