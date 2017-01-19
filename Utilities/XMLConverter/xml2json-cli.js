#! /usr/bin/env node

var fs = require('fs');
var program = require('commander');
var xml2js = require('xml2js');

program.version('1.0.0')
  .option('-i, --input [file.xml]', 'Input file to convert')
  .option('-o, --output [file.json]', 'Destination file\n')
  .parse(process.argv);

var parser = new xml2js.Parser();
fs.readFile(program.input, function (err, data) {
    parser.parseString(data, function (err, result) {
        fs.writeFile(program.output, JSON.stringify(result, null, 2), function(err) {
          if(err) {
              return console.log(err);
          }

          console.log("Success");
        });
    });
});
