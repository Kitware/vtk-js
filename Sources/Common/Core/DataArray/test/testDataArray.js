import { it, expect } from 'vitest';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

it('Test vtkDataArray instance', () => {
  expect(vtkDataArray).toBeTruthy();
  const instance = vtkDataArray.newInstance({ size: 256 });
  expect(instance).toBeTruthy();
});

it('Test vtkDataArray getRange function with single-channel data.', () => {
  // create a data array with a single channel.
  const newArray = new Uint16Array(256 * 3);

  // fill the new array with the pattern 0,1,2,3,4,5, ..., 767.
  for (let i = 0; i < 256 * 3; ++i) {
    newArray[i] = i;
  }

  const da = vtkDataArray.newInstance({
    numberOfComponents: 1,
    values: newArray,
  });

  expect(da.getRange(0)[0] === 0).toBeTruthy();
  expect(da.getRange(0)[1] === 767).toBeTruthy();
});

it('Test vtkDataArray getRange function with NaN values.', () => {
  // a data array with a NaN value and max as first value
  const da = vtkDataArray.newInstance({
    numberOfComponents: 1,
    values: new Float64Array([4.0, 0, NaN, 3.0, 2.0, 1.0]),
  });

  expect(da.getRange(0)[0]).toBe(0.0);
  expect(da.getRange(0)[1]).toBe(4.0);

  // a data array with NaN as first value
  const da2 = vtkDataArray.newInstance({
    numberOfComponents: 1,
    values: new Float64Array([NaN, 0.0, 2.0, 3.0, 4.0, 1.0]),
  });

  expect(da2.getRange(0)[0]).toBe(0.0);
  expect(da2.getRange(0)[1]).toBe(4.0);

  // an empty data array
  const da3 = vtkDataArray.newInstance({
    numberOfComponents: 1,
    values: new Float64Array([]),
  });

  expect(da3.getRange(0)[0]).toBe(Number.MAX_VALUE);
  expect(da3.getRange(0)[1]).toBe(-Number.MAX_VALUE);

  // a data array with all NaN values except one in the middle
  const da4 = vtkDataArray.newInstance({
    numberOfComponents: 1,
    values: new Float64Array([NaN, NaN, 2.0, NaN]),
  });

  expect(da4.getRange(0)[0]).toBe(2.0);
  expect(da4.getRange(0)[1]).toBe(2.0);

  // a data array with all NaN values except one at the end
  const da5 = vtkDataArray.newInstance({
    numberOfComponents: 1,
    values: new Float64Array([NaN, NaN, 2.0]),
  });

  expect(da5.getRange(0)[0]).toBe(2.0);
  expect(da5.getRange(0)[1]).toBe(2.0);

  // a data array with all NaN values
  const da6 = vtkDataArray.newInstance({
    numberOfComponents: 1,
    values: new Float64Array([NaN, NaN, NaN]),
  });

  expect(da6.getRange(0)[0]).toBe(Number.MAX_VALUE);
  expect(da6.getRange(0)[1]).toBe(-Number.MAX_VALUE);

  // a data array with multiple components
  const da7 = vtkDataArray.newInstance({
    numberOfComponents: 2,
    values: new Float64Array([NaN, 1.0, 2.0, 3.0, 5.0, NaN]),
  });

  expect(da7.getRange(0)[0]).toBe(2.0);
  expect(da7.getRange(0)[1]).toBe(5.0);
  expect(da7.getRange(1)[0]).toBe(1.0);
  expect(da7.getRange(1)[1]).toBe(3.0);
});

it('Test vtkDataArray getRanges function with single-channel data.', () => {
  // create a data array with a single channel.
  const newArray = new Uint16Array(256 * 3);

  // fill the new array with the pattern 0,1,2,3,4,5, ..., 767.
  for (let i = 0; i < 256 * 3; ++i) {
    newArray[i] = i;
  }

  const da = vtkDataArray.newInstance({
    numberOfComponents: 1,
    values: newArray,
  });

  expect(da.getRanges().length === 1).toBeTruthy();
  expect(da.getRanges()[0].min === 0).toBeTruthy();
  expect(da.getRanges()[0].max === 767).toBeTruthy();
});

it('Test vtkDataArray getTuple', () => {
  const da = vtkDataArray.newInstance({
    numberOfComponents: 3,
    values: new Uint8Array([0, 1, 2, 3, 4, 5]),
  });
  const da2 = vtkDataArray.newInstance({
    numberOfComponents: 3,
    values: new Uint8Array([0, 1, 2, 3, 4, 5]),
  });

  expect(vtkMath.areEquals(da.getTuple(0), [0, 1, 2])).toBeTruthy();
  expect(vtkMath.areEquals(da.getTuple(1), [3, 4, 5])).toBeTruthy();
  expect(da.getTuple(0) !== da.getTuple(1)).toBeTruthy();
  expect(da.getTuple(0) !== da2.getTuple(0)).toBeTruthy();
  const tuple = [];
  expect(da.getTuple(0, tuple)).toBe(tuple);
  expect(tuple.length).toBe(3);
  const typedArray = new Uint8Array(3);
  expect(da.getTuple(0, typedArray)).toBe(typedArray);
  expect(vtkMath.areEquals(typedArray, [0, 1, 2])).toBeTruthy();
});

it('Test vtkDataArray getRange function with multi-channel data.', () => {
  // create a data array with 3 channel data.
  const newArray = new Uint16Array(256 * 3);

  // fill the new array with the pattern 1,2,3, 1,2,3
  // such that each channel has 1,1,1  2,2,2  3,3,3 respectively.
  for (let i = 0; i < 256; ++i) {
    newArray[i * 3] = i;
    newArray[i * 3 + 1] = i * 2;
    newArray[i * 3 + 2] = i * 3;
  }

  const da = vtkDataArray.newInstance({
    numberOfComponents: 3,
    values: newArray,
  });

  expect(da.getRange(0)[0] === 0).toBeTruthy();
  expect(da.getRange(0)[1] === 255).toBeTruthy();
  expect(da.getRange(1)[0] === 0).toBeTruthy();
  expect(da.getRange(1)[1] === 510).toBeTruthy();
  expect(da.getRange(2)[0] === 0).toBeTruthy();
  expect(da.getRange(2)[1] === 765).toBeTruthy();

  // re-fill the array with the pattern 0,0,0, 1,1,1 2,2,2 as 3d vector values
  for (let i = 0; i < 256; ++i) {
    newArray[i * 3] = i;
    newArray[i * 3 + 1] = i;
    newArray[i * 3 + 2] = i;
  }

  const compareFloat = (a, b) => Math.abs(a - b) < Number.EPSILON;
  const vecRange = da.getRange(-1);
  expect(compareFloat(vecRange[0].toFixed(2), 0.0)).toBeTruthy();
  expect(compareFloat(vecRange[1].toFixed(3), 441.673)).toBeTruthy();
});

it('Test vtkDataArray getRanges function with multi-channel data.', () => {
  // create a data array with 3 channel data.
  const numberOfPixels = 10;
  const numberOfComponents = 4;
  const newArray = new Uint16Array(numberOfPixels * numberOfComponents);

  // fill the new array with the pattern 1,2,3, 1,2,3
  // such that each channel has 1,1,1  2,2,2  3,3,3 respectively.
  for (let i = 0; i < numberOfPixels; ++i) {
    newArray[i * numberOfComponents] = i;
    newArray[i * numberOfComponents + 1] = i * 2;
    newArray[i * numberOfComponents + 2] = i * 3;
    newArray[i * numberOfComponents + 3] = i * 4;
  }

  const da = vtkDataArray.newInstance({
    numberOfComponents,
    values: newArray,
  });

  const ranges = da.getRanges();

  expect(ranges.length === numberOfComponents + 1).toBeTruthy();
  expect(ranges[0].min === 0).toBeTruthy();
  expect(ranges[0].max === 9).toBeTruthy();
  expect(ranges[1].min === 0).toBeTruthy();
  expect(ranges[1].max === 18).toBeTruthy();
  expect(ranges[2].min === 0).toBeTruthy();
  expect(ranges[2].max === 27).toBeTruthy();
  expect(ranges[2].min === 0).toBeTruthy();
  expect(ranges[3].max === 36).toBeTruthy();
});

it('Test vtkDataArray getRanges(false) (`computeRanges=false`) function with multi-channel data', () => {
  // create a data array with 3 channel data.
  const numberOfPixels = 10;
  const numberOfComponents = 4;
  const newArray = new Uint16Array(numberOfPixels * numberOfComponents);

  // fill the new array with the pattern 1,2,3, 1,2,3
  // such that each channel has 1,1,1  2,2,2  3,3,3 respectively.
  for (let i = 0; i < numberOfPixels; ++i) {
    newArray[i * numberOfComponents] = i;
    newArray[i * numberOfComponents + 1] = i * 2;
    newArray[i * numberOfComponents + 2] = i * 3;
    newArray[i * numberOfComponents + 3] = i * 4;
  }

  const da = vtkDataArray.newInstance({
    numberOfComponents,
    values: newArray,
  });

  // set `computeRanges` to false.  This will prevent the ranges from being
  // computed and will return only the ranges previously computer (if any).
  const ranges = da.getRanges(false);

  expect(ranges === undefined).toBeTruthy();

  // now fetch the range for component 0.
  da.getRange(0);

  // now fetch the ranges again with `computeRanges` set to false.
  const updatedRanges = da.getRanges(false);

  // `updatedRanges` should now be only the range for component 0. because if
  // was computed in `da.getRange(0)`
  expect(updatedRanges.length === numberOfComponents + 1).toBeTruthy();
  expect(updatedRanges[0].min === 0).toBeTruthy();
  expect(updatedRanges[0].max === 9).toBeTruthy();
  expect(updatedRanges[1] === null).toBeTruthy();
  expect(updatedRanges[2] === null).toBeTruthy();
  expect(updatedRanges[3] === null).toBeTruthy();
  expect(updatedRanges[4] === null).toBeTruthy();
});

it('Test vtkDataArray insertNextTuple', () => {
  const dataArray = vtkDataArray.newInstance({
    dataType: VtkDataTypes.UNSIGNED_CHAR,
    empty: true,
    numberOfComponents: 3,
  });
  expect(dataArray.getData().length).toBe(0);

  let idx = dataArray.insertNextTuple([1, 2, 3]);

  expect(dataArray.getData().length).toBe(3);
  expect(idx).toBe(0);

  idx = dataArray.insertNextTuple([4, 5, 6]);

  expect(dataArray.getData().length).toBe(6);
  expect(idx).toBe(1);

  // numberOfComponents forces the length of the inserted tuple to be 3
  idx = dataArray.insertNextTuple([7, 8, 9, 10]);

  expect(dataArray.getData().length).toBe(9);
  expect(dataArray.getData()[8]).toBe(9);
  expect(idx).toBe(2);

  idx = dataArray.insertNextTuple([10]);

  expect(dataArray.getData().length).toBe(12);
  expect(dataArray.getData()[11]).toBe(0);
  expect(idx).toBe(3);
});

it('Test vtkDataArray getTuples and insertTuples', () => {
  const values = Uint8Array.from([
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
  ]);

  const dataArray = vtkDataArray.newInstance({
    dataType: VtkDataTypes.UNSIGNED_CHAR,
    values,
    numberOfComponents: 3,
  });

  expect(dataArray.getTuples()).toEqual(values);

  expect(dataArray.getTuples(1, 4)).toEqual(
    Uint8Array.from([3, 4, 5, 6, 7, 8, 9, 10, 11])
  );

  expect(dataArray.getTuples(-3, -1)).toEqual(
    Uint8Array.from([6, 7, 8, 9, 10, 11])
  );

  expect(dataArray.getTuples(1, 0)).toBe(null);

  expect(dataArray.getTuples(1, 10)).toEqual(
    Uint8Array.from([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14])
  );

  const emptyDataArray = vtkDataArray.newInstance({
    dataType: VtkDataTypes.UNSIGNED_CHAR,
    empty: true,
    numberOfComponents: 3,
  });

  emptyDataArray.insertNextTuples(dataArray.getTuples());

  expect(emptyDataArray.getTuples()).toEqual(values);
});

it('Test vtkDataArray findTuple', () => {
  const values = Uint8Array.from([
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
  ]);

  const dataArray = vtkDataArray.newInstance({
    dataType: VtkDataTypes.UNSIGNED_CHAR,
    values,
    numberOfComponents: 3,
  });

  expect(dataArray.findTuple([9, 10, 11])).toBe(3);
  expect(dataArray.findTuple([3, 4, 4], 1)).toBe(1);
  expect(dataArray.findTuple(Float32Array.from([12, 13, 14]))).toBe(4);
});

it('Test vtkDataArray allocate function', () => {
  // create an empty data array with 3 channel data.
  const da = vtkDataArray.newInstance({
    numberOfComponents: 3,
    empty: true,
  });

  expect(da.getNumberOfTuples()).toBe(0);

  da.allocate(2);
  let oldData = da.getData();

  expect(da.getNumberOfTuples()).toBe(0);

  da.insertNextTuple([1, 2, 3]);
  da.insertNextTuple([1, 2, 3]);

  expect(da.getNumberOfTuples()).toBe(2);
  expect(da.getData().buffer).toBe(oldData.buffer);

  da.allocate(2);

  expect(da.getNumberOfTuples()).toBe(2);
  expect(da.getData().buffer).not.toBe(oldData.buffer);
  oldData = da.getData();

  da.insertNextTuple([1, 2, 3]);
  da.insertNextTuple([1, 2, 3]);

  expect(da.getNumberOfTuples() === 4).toBeTruthy();
  expect(da.getData().buffer).toBe(oldData.buffer);
});

it('Test vtkDataArray resize function', () => {
  // create an empty data array with 3 channel data.
  const da = vtkDataArray.newInstance({
    numberOfComponents: 3,
    empty: true,
  });

  expect(da.getNumberOfTuples() === 0).toBeTruthy();

  da.resize(2);

  expect(da.getNumberOfTuples() === 2).toBeTruthy();

  da.insertNextTuple([1, 2, 3]);
  da.insertNextTuple([1, 2, 3]);

  expect(da.getNumberOfTuples() === 4).toBeTruthy();

  const oldData = da.getData();
  da.resize(2);

  expect(da.getNumberOfTuples() === 2).toBeTruthy();
  expect(da.getData().buffer).toBe(oldData.buffer);

  da.insertNextTuple([1, 2, 3]);
  da.insertNextTuple([1, 2, 3]);

  expect(da.getNumberOfTuples() === 4).toBeTruthy();
  expect(da.getData().buffer).toBe(oldData.buffer);
});
