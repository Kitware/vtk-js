#! /usr/bin/env node

// Regression test for the shelljs-exec-injection fix in convert-cli.js.
//
// Verifies that shell metacharacters passed via --input/--output reach the
// pvpython invocation as a single literal argument (via execFileSync),
// instead of being interpreted by a shell (which is what shell.exec() used
// to do via cmdLine.join(' ')).
//
// Run with: node Utilities/DataGenerator/convert-cli.security-test.js

var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');
var spawnSync = require('child_process').spawnSync;

var CONVERT_CLI = path.join(__dirname, 'convert-cli.js');

var PAYLOADS = [
  'foo.vtk; touch {marker}',
  'foo.vtk && touch {marker}',
  '`touch {marker}`',
  '$(touch {marker})',
];

function makeFakeParaviewHome(tmpRoot, argvCapturePath) {
  var paraviewHome = path.join(tmpRoot, 'paraview');
  var binDir = path.join(paraviewHome, 'bin');
  fs.mkdirSync(binDir, { recursive: true });

  var fakePvPython = path.join(binDir, 'pvpython');
  fs.writeFileSync(
    fakePvPython,
    '#!/usr/bin/env node\n' +
      'require("fs").writeFileSync(' +
      JSON.stringify(argvCapturePath) +
      ', JSON.stringify(process.argv.slice(2)));\n'
  );
  fs.chmodSync(fakePvPython, 0o755);

  return paraviewHome;
}

function runPayload(payloadTemplate) {
  var tmpRoot = fs.mkdtempSync(
    path.join(os.tmpdir(), 'vtkjs-convert-cli-security-')
  );

  try {
    var markerPath = path.join(tmpRoot, 'injected.marker');
    var argvCapturePath = path.join(tmpRoot, 'pvpython-argv.json');
    var outputDir = path.join(tmpRoot, 'out');
    fs.mkdirSync(outputDir);

    var paraviewHome = makeFakeParaviewHome(tmpRoot, argvCapturePath);
    var maliciousInput = payloadTemplate.replace('{marker}', markerPath);
    var maliciousOutput = path.join(outputDir, maliciousInput);

    var result = spawnSync(
      process.execPath,
      [CONVERT_CLI, '--input', maliciousInput, '--output', maliciousOutput],
      {
        env: Object.assign({}, process.env, { PARAVIEW_HOME: paraviewHome }),
        encoding: 'utf8',
      }
    );

    assert.strictEqual(
      result.status,
      0,
      'convert-cli.js exited with an error for payload: ' +
        payloadTemplate +
        '\nstdout: ' +
        result.stdout +
        '\nstderr: ' +
        result.stderr
    );

    assert.strictEqual(
      fs.existsSync(markerPath),
      false,
      'Shell metacharacters were executed (marker file created) for payload: ' +
        payloadTemplate
    );

    var capturedArgv = JSON.parse(fs.readFileSync(argvCapturePath, 'utf8'));
    assert.ok(
      capturedArgv.indexOf(maliciousInput) !== -1,
      'pvpython did not receive --input as a literal argument for payload: ' +
        payloadTemplate
    );
    assert.ok(
      capturedArgv.indexOf(maliciousOutput) !== -1,
      'pvpython did not receive --output as a literal argument for payload: ' +
        payloadTemplate
    );
  } finally {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
}

PAYLOADS.forEach(function (payloadTemplate) {
  runPayload(payloadTemplate);
  console.log('PASS:', payloadTemplate);
});

console.log(
  '\nAll payloads passed: shell metacharacters in --input/--output are not interpreted by a shell.'
);
