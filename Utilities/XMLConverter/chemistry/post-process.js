function convert(value, type) {
  if (['xsd:Integer', 'xsd:float'].indexOf(type) !== -1) {
    return Number(value);
  }
  return value;
}

module.exports = function (xml) {
  var atomsXML = xml.list.atom;
  var outputAtoms = [];

  atomsXML.forEach(function (atomXML) {
    var atom = {};
    outputAtoms.push(atom);

    // Fill atom with information
    atom.id = atomXML.$.id;

    // scalars
    atomXML.scalar.forEach(function (scalar) {
      var key = scalar.$.dictRef.split(':')[1];
      var value = convert(scalar._, scalar.$.dataType);
      atom[key] = value;
    });

    // label
    atomXML.label.forEach(function (label) {
      var key = label.$.dictRef.split(':')[1];
      var value = label.$.value;
      atom[key] = value;
    });
    // array
    atomXML.array.forEach(function (array) {
      var key = array.$.dictRef.split(':')[1];
      var delimiter = array.$.delimiter || ' ';
      var type = array.$.dataType;
      var value = array._.split(delimiter).map(function (v) { return convert(v, type); });
      atom[key] = value;
    });
  });

  return { atoms: outputAtoms };
}
