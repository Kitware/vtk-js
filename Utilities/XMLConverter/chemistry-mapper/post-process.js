var preProcessing = require('../chemistry/post-process.js');

const valueToExtract = ['atomicNumber'];

module.exports = function (xml) {
  var atoms = {};
  var fullJSON = preProcessing(xml);
  fullJSON.atoms.forEach(function (a) {
    var values = valueToExtract.map(function (key) {
      return a[key];
    });
    // Remove atoms that have no radiusCovalent
    if (values[0]) {
      atoms[a.id] = values;
    }
  });
  return atoms;
};
