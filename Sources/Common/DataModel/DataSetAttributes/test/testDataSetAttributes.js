import { it, expect } from 'vitest';
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

it('Test vtkDataSetAttributes instance', () => {
  expect(
    vtkDataSetAttributes,
    'Make sure the class definition exists'
  ).toBeTruthy();
  const instance = vtkDataSetAttributes.newInstance();
  expect(instance, 'Make sure the newInstance method exists.').toBeTruthy();
  expect(
    instance.getNumberOfArrays(),
    'Default number of arrays should be 0'
  ).toBe(0);

  // Test that all the default active attributes are null (with -1 index)
  const ntuples = 10;
  let numArrs = 0;
  attrTypes.forEach((attType) => {
    expect(
      instance[`get${attType}`](),
      `Default ${attType} should be null`
    ).toBe(null);
    const testArray = vtkDataArray.newInstance({
      name: `Foo${attType}`,
      numberOfComponents: 1,
      values: new Float32Array(ntuples),
    });
    expect(
      instance.addArray(testArray),
      `Adding ${attType.toLowerCase()} empty DSA should return index of ${numArrs}`
    ).toBe(numArrs);
    expect(
      instance[`setActive${attType}`](`Foo${attType}`),
      `Setting ${attType.toLowerCase()} should return ${numArrs} (the index of the array).`
    ).toBe(numArrs);
    expect(
      instance[`setActive${attType}`]('xxx'),
      `Setting ${attType.toLowerCase()} with an invalid name should return -1.`
    ).toBe(-1);
    expect(
      instance[`get${attType}`](),
      `Setting ${attType.toLowerCase()} with an invalid name should reset the attribute.`
    ).toBe(null);
    ++numArrs;
  });

  // const foo = vtkDataArray.newInstance({ name: 'Foo', numberOfComponents: 1, values: new Float32Array(ntuples) });
  // expect(instance.addArray(foo)).toBe(0);
  // expect(instance.setScalars('Foo')).toBe(0);
  // instance.addArray(vtkDataArray.newInstance({ name: 'Bar', numberOfComponents: 3, values: new Float32Array(3 * ntuples) }));

  expect(instance.getNumberOfArrays()).toBe(numArrs);
  instance.removeArray('FooScalars');
  expect(instance.getNumberOfArrays()).toBe(numArrs - 1);
});
