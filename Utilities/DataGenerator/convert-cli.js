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

if (!process.argv.slice(2).length) {
  program.outputHelp();
  return 0;
}

if(!paraview) {
    paraview = [];
    [ program.paraview, '/Applications/paraview.app/Contents', '/opt/paraview'].forEach(function(directory){
        try {
            if(fs.statSync(directory).isDirectory()) {
                paraview.push(directory);
            }
        } catch(err) {
            // skip
        }
    });
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
