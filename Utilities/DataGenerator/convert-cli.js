#! /usr/bin/env node

var fs = require('fs');
var program = require('commander');
var shell = require('shelljs');
var path = require('path');
var paraview = process.env.PARAVIEW_HOME;

program.version('1.0.0')
  .option('-i, --input [file.vtk]', 'Input data file to convert')
  .option('-o, --output [directory]', 'Destination directory\n')
  .option('-m, --merge', 'Merge dataset')
  .option('-e, --extract-surface', 'Extract surface\n')
  .option('--paraview [path]', 'Provide the ParaView root path to use')
  .option('--sample-data [path]', 'Convert sample data from ParaViewData\n')
  .parse(process.argv);

// ----------------------------------------------------------------------------
// Need argument otherwise print help/usage
// ----------------------------------------------------------------------------

// Try to find a paraview directory inside /Applications or /opt
const pvPossibleBasePath = [];
['/Applications', '/opt', '/usr/local/opt/'].forEach(function (directoryPath) {
  shell.ls(directoryPath).forEach(function (fileName) {
    if (fileName.toLowerCase().indexOf('paraview') !== -1) {
      pvPossibleBasePath.push(path.join(directoryPath, fileName));
    }
  });
});

if(!paraview) {
    paraview = [];
    [program.paraview].concat(pvPossibleBasePath).forEach(function(directory){
        try {
            if(fs.statSync(directory).isDirectory()) {
                paraview.push(directory);
            }
        } catch(err) {
            // skip
        }
    });
}

if (!process.argv.slice(2).length || !program.help || paraview.length === 0) {
  program.outputHelp();
  process.exit(0);
}

var pvPythonExecs = shell.find(paraview).filter(function(file) { return file.match(/pvpython$/) || file.match(/pvpython.exe$/); });
if(pvPythonExecs.length < 1) {
    console.log('Could not find pvpython in your ParaView HOME directory ($PARAVIEW_HOME)');
    program.outputHelp();
} else if (program.sampleData) {
  console.log('Extract sample datasets');
  const cmdLineSample = [
    pvPythonExecs[0], '-dr',
    path.normalize(path.join(__dirname, 'vtk-data-converter.py')),
    '--sample-data', program.sampleData,
    '--output', path.normalize(path.join(__dirname, '../../Data')),,
  ];
  console.log('\n===============================================================================');
  console.log('| Execute:');
  console.log('| $', cmdLineSample.join('\n|\t'));
  console.log('===============================================================================\n');
  shell.exec(cmdLineSample.join(' '));
} else {
    const cmdLine = [
        pvPythonExecs[0], '-dr',
        path.normalize(path.join(__dirname, 'vtk-data-converter.py')),
        '--input', program.input,
        '--output', program.output,
    ];

    if (program.extractSurface) {
      cmdLine.push('--extract-surface');
    }

    if (program.merge) {
      cmdLine.push('--merge');
    }

    console.log('\n===============================================================================');
    console.log('| Execute:');
    console.log('| $', cmdLine.join('\n|\t'));
    console.log('===============================================================================\n');
    shell.exec(cmdLine.join(' '));
}
