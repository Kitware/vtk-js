import test from 'tape-catch';

import vtkDataSetAttributes from 'vtk.js/Sources/Common/DataModel/DataSetAttributes';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';

const attrTypes = [
  'Scalars',
  'Vectors',
  'Normals',
  'TCoords',
  'Tensors',
  'GlobalIds',
  'PedigreeIds',
];

test('Test vtkDataSetAttributes instance', (t) => {
  t.ok(vtkDataSetAttributes, 'Make sure the class definition exists');
  const instance = vtkDataSetAttributes.newInstance();
  t.ok(instance, 'Make sure the newInstance method exists.');
  t.equal(
    instance.getNumberOfArrays(),
    0,
    'Default number of arrays should be 0'
  );

  // Test that all the default active attributes are null (with -1 index)
  const ntuples = 10;
  let numArrs = 0;
  attrTypes.forEach((attType) => {
    t.equal(
      instance[`get${attType}`](),
      null,
      `Default ${attType} should be null`
    );
    const testArray = vtkDataArray.newInstance({
      name: `Foo${attType}`,
      numberOfComponents: 1,
      values: new Float32Array(ntuples),
    });
    t.equal(
      instance.addArray(testArray),
      numArrs,
      `Adding ${attType.toLowerCase()} empty DSA should return index of ${numArrs}`
    );
    t.equal(
      instance[`setActive${attType}`](`Foo${attType}`),
      numArrs,
      `Setting ${attType.toLowerCase()} should return ${numArrs} (the index of the array).`
    );
    t.equal(
      instance[`setActive${attType}`]('xxx'),
      -1,
      `Setting ${attType.toLowerCase()} with an invalid name should return -1.`
    );
    t.equal(
      instance[`get${attType}`](),
      null,
      `Setting ${attType.toLowerCase()} with an invalid name should reset the attribute.`
    );
    ++numArrs;
  });

  // const foo = vtkDataArray.newInstance({ name: 'Foo', numberOfComponents: 1, values: new Float32Array(ntuples) });
  // t.equal(instance.addArray(foo), 0, `Adding ${attType.toLowerCase()} empty DSA should return index of 0`);
  // t.equal(instance.setScalars('Foo'), 0, 'Setting scalars should return index of array');
  // instance.addArray(vtkDataArray.newInstance({ name: 'Bar', numberOfComponents: 3, values: new Float32Array(3 * ntuples) }));

  t.end();
});
