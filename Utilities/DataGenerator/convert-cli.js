#! /usr/bin/env node

var fs = require('fs');
var { execSync } = require('child_process');
var { program } = require('commander');
var path = require('path');

function lsDir(dirPath) {
  try { return fs.readdirSync(dirPath); } catch (e) { return []; }
}

function findAll(dirs) {
  var results = [];
  dirs.forEach(function (dir) {
    try {
      fs.readdirSync(dir).forEach(function (entry) {
        var full = path.join(dir, entry);
        results.push(full);
        try {
          if (fs.statSync(full).isDirectory()) {
            findAll([full]).forEach(function (p) { results.push(p); });
          }
        } catch (e) {}
      });
    } catch (e) {}
  });
  return results;
}
var paraview = process.env.PARAVIEW_HOME;

program.version('1.0.0')
  .option('-i, --input [file.vtk]', 'Input data file to convert')
  .option('-o, --output [directory]', 'Destination directory\n')
  .option('-m, --merge', 'Merge dataset')
  .option('-e, --extract-surface', 'Extract surface\n')
  .option('--paraview [path]', 'Provide the ParaView root path to use')
  .option('--sample-data [path]', 'Convert sample data from ParaViewData\n')
  .parse(process.argv);

const options = program.opts();

// ----------------------------------------------------------------------------
// Need argument otherwise print help/usage
// ----------------------------------------------------------------------------

// Try to find a paraview directory inside /Applications or /opt
const pvPossibleBasePath = [];
['/Applications', '/opt', '/usr/local/opt/'].forEach(function (directoryPath) {
  lsDir(directoryPath).forEach(function (fileName) {
    if (fileName.toLowerCase().indexOf('paraview') !== -1) {
      pvPossibleBasePath.push(path.join(directoryPath, fileName));
    }
  });
});

if(!paraview) {
    paraview = [];
    [options.paraview].concat(pvPossibleBasePath).forEach(function(directory){
        try {
            if(fs.statSync(directory).isDirectory()) {
                paraview.push(directory);
            }
        } catch(err) {
            // skip
        }
    });
}

if (!process.argv.slice(2).length || !options.help || paraview.length === 0) {
  program.outputHelp();
  process.exit(0);
}

var pvPythonExecs = findAll(paraview).filter(function(file) { return file.match(/pvpython$/) || file.match(/pvpython.exe$/); });
if(pvPythonExecs.length < 1) {
    console.log('Could not find pvpython in your ParaView HOME directory ($PARAVIEW_HOME)');
    program.outputHelp();
} else if (options.sampleData) {
  console.log('Extract sample datasets');
  const cmdLineSample = [
    pvPythonExecs[0], '-dr',
    path.normalize(path.join(__dirname, 'vtk-data-converter.py')),
    '--sample-data', options.sampleData,
    '--output', path.normalize(path.join(__dirname, '../../Data')),,
  ];
  console.log('\n===============================================================================');
  console.log('| Execute:');
  console.log('| $', cmdLineSample.join('\n|\t'));
  console.log('===============================================================================\n');
  execSync(cmdLineSample.join(' '), { stdio: 'inherit' });
} else {
    const cmdLine = [
        pvPythonExecs[0], '-dr',
        path.normalize(path.join(__dirname, 'vtk-data-converter.py')),
        '--input', options.input,
        '--output', options.output,
    ];

    if (options.extractSurface) {
      cmdLine.push('--extract-surface');
    }

    if (options.merge) {
      cmdLine.push('--merge');
    }

    console.log('\n===============================================================================');
    console.log('| Execute:');
    console.log('| $', cmdLine.join('\n|\t'));
    console.log('===============================================================================\n');
    execSync(cmdLine.join(' '), { stdio: 'inherit' });
}
