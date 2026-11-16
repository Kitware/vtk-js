import { it, expect } from 'vitest';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkTransform from 'vtk.js/Sources/Common/Transform/Transform';

function makeArrays() {
  const input = vtkDataArray.newInstance({
    numberOfComponents: 3,
    values: new Float32Array([1, 0, 0]),
  });
  const output = vtkDataArray.newInstance({
    numberOfComponents: 3,
    values: new Float32Array(3),
  });
  return { input, output };
}

it('transformNormals marks the output array as modified', () => {
  const transform = vtkTransform.newInstance();
  transform.rotateZ(90);
  const { input, output } = makeArrays();
  expect(output.getRange(1)).toEqual([0, 0]);
  const time = output.getMTime();

  transform.transformNormals(input, output);

  expect(output.getMTime()).toBeGreaterThan(time);
  expect(output.getRange(1)).toEqual([1, 1]);
});

it('transformVectors marks the output array as modified', () => {
  const transform = vtkTransform.newInstance();
  transform.rotateZ(90);
  const { input, output } = makeArrays();
  const time = output.getMTime();

  transform.transformVectors(input, output);

  expect(output.getMTime()).toBeGreaterThan(time);
  expect(output.getRange(1)).toEqual([1, 1]);
});

it('an identity transform does not mark the output arrays as modified', () => {
  const transform = vtkTransform.newInstance();
  // A translation does not change the 3x3 part of the matrix.
  transform.translate(1, 2, 3);
  const { input, output } = makeArrays();
  const time = output.getMTime();

  transform.transformNormals(input, output);
  expect(output.getMTime()).toBe(time);

  transform.transformVectors(input, output);
  expect(output.getMTime()).toBe(time);
});
