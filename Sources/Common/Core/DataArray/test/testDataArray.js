import { it, expect } from 'vitest';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

it('Test vtkDataArray instance', () => {
  expect(vtkDataArray, 'Make sure the class definition exists').toBeTruthy();
  const instance = vtkDataArray.newInstance({ size: 256 });
  expect(instance, 'newInstance should create an instance').toBeTruthy();
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

  expect(
    da.getRange(0)[0] === 0,
    'getRange minimum value should be 0'
  ).toBeTruthy();
  expect(
    da.getRange(0)[1] === 767,
    'getRange maximum value should be 767'
  ).toBeTruthy();
});

it('Test vtkDataArray getRange function with NaN values.', () => {
  // a data array with a NaN value and max as first value
  const da = vtkDataArray.newInstance({
    numberOfComponents: 1,
    values: new Float64Array([4.0, 0, NaN, 3.0, 2.0, 1.0]),
  });

  expect(da.getRange(0)[0], 'getRange minimum value should be 0').toBe(0.0);
  expect(da.getRange(0)[1], 'getRange maximum value should be 4').toBe(4.0);

  // a data array with NaN as first value
  const da2 = vtkDataArray.newInstance({
    numberOfComponents: 1,
    values: new Float64Array([NaN, 0.0, 2.0, 3.0, 4.0, 1.0]),
  });

  expect(da2.getRange(0)[0], 'getRange minimum value should be 0').toBe(0.0);
  expect(da2.getRange(0)[1], 'getRange maximum value should be 4').toBe(4.0);

  // an empty data array
  const da3 = vtkDataArray.newInstance({
    numberOfComponents: 1,
    values: new Float64Array([]),
  });

  expect(da3.getRange(0)[0], 'getRange minimum value should be MAX_VALUE').toBe(
    Number.MAX_VALUE
  );
  expect(
    da3.getRange(0)[1],
    'getRange maximum value should be -MAX_VALUE'
  ).toBe(-Number.MAX_VALUE);

  // a data array with all NaN values except one in the middle
  const da4 = vtkDataArray.newInstance({
    numberOfComponents: 1,
    values: new Float64Array([NaN, NaN, 2.0, NaN]),
  });

  expect(da4.getRange(0)[0], 'getRange minimum value should be 2').toBe(2.0);
  expect(da4.getRange(0)[1], 'getRange maximum value should be 2').toBe(2.0);

  // a data array with all NaN values except one at the end
  const da5 = vtkDataArray.newInstance({
    numberOfComponents: 1,
    values: new Float64Array([NaN, NaN, 2.0]),
  });

  expect(da5.getRange(0)[0], 'getRange minimum value should be 2').toBe(2.0);
  expect(da5.getRange(0)[1], 'getRange maximum value should be 2').toBe(2.0);

  // a data array with all NaN values
  const da6 = vtkDataArray.newInstance({
    numberOfComponents: 1,
    values: new Float64Array([NaN, NaN, NaN]),
  });

  expect(da6.getRange(0)[0], 'getRange minimum value should be MAX_VALUE').toBe(
    Number.MAX_VALUE
  );
  expect(
    da6.getRange(0)[1],
    'getRange maximum value should be -MAX_VALUE'
  ).toBe(-Number.MAX_VALUE);

  // a data array with multiple components
  const da7 = vtkDataArray.newInstance({
    numberOfComponents: 2,
    values: new Float64Array([NaN, 1.0, 2.0, 3.0, 5.0, NaN]),
  });

  expect(
    da7.getRange(0)[0],
    'component:0 getRange minimum value should be 2'
  ).toBe(2.0);
  expect(
    da7.getRange(0)[1],
    'component:0 getRange maximum value should be 5'
  ).toBe(5.0);
  expect(
    da7.getRange(1)[0],
    'component:1 getRange minimum value should be 1'
  ).toBe(1.0);
  expect(
    da7.getRange(1)[1],
    'component:1 getRange maximum value should be 3'
  ).toBe(3.0);
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

  expect(
    da.getRanges().length === 1,
    'getRanges should return an array of 1 vtkRange objects'
  ).toBeTruthy();
  expect(
    da.getRanges()[0].min === 0,
    'the first component returned by getRanges minimum value should be 0'
  ).toBeTruthy();
  expect(
    da.getRanges()[0].max === 767,
    'the first component returned by getRanges maximum value should be 767'
  ).toBeTruthy();
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

  expect(
    vtkMath.areEquals(da.getTuple(0), [0, 1, 2]),
    'get first tuple'
  ).toBeTruthy();
  expect(
    vtkMath.areEquals(da.getTuple(1), [3, 4, 5]),
    'get 2nd tuple'
  ).toBeTruthy();
  expect(da.getTuple(0) !== da.getTuple(1), 'getTuple twice').toBeTruthy();
  expect(
    da.getTuple(0) !== da2.getTuple(0),
    'getTuple returns a new array for each instance'
  ).toBeTruthy();
  const tuple = [];
  expect(da.getTuple(0, tuple), 'getTuple with tupleToFill').toBe(tuple);
  expect(tuple.length, 'getTuple length').toBe(3);
  const typedArray = new Uint8Array(3);
  expect(da.getTuple(0, typedArray), 'getTuple with typed tupleToFill').toBe(
    typedArray
  );
  expect(
    vtkMath.areEquals(typedArray, [0, 1, 2]),
    'get typed first tuple'
  ).toBeTruthy();
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

  expect(
    da.getRange(0)[0] === 0,
    'component:0 minimum value should be 0'
  ).toBeTruthy();
  expect(
    da.getRange(0)[1] === 255,
    'component:0 maximum value should be 255'
  ).toBeTruthy();
  expect(
    da.getRange(1)[0] === 0,
    'component:1 minimum value should be 0'
  ).toBeTruthy();
  expect(
    da.getRange(1)[1] === 510,
    'component:1 maximum value should be 510'
  ).toBeTruthy();
  expect(
    da.getRange(2)[0] === 0,
    'component:2 minimum value should be 0'
  ).toBeTruthy();
  expect(
    da.getRange(2)[1] === 765,
    'component:2 maximum value should be 765'
  ).toBeTruthy();

  // re-fill the array with the pattern 0,0,0, 1,1,1 2,2,2 as 3d vector values
  for (let i = 0; i < 256; ++i) {
    newArray[i * 3] = i;
    newArray[i * 3 + 1] = i;
    newArray[i * 3 + 2] = i;
  }

  const compareFloat = (a, b) => Math.abs(a - b) < Number.EPSILON;
  const vecRange = da.getRange(-1);
  expect(
    compareFloat(vecRange[0].toFixed(2), 0.0),
    'vector magnitude min value should be be 0.0'
  ).toBeTruthy();
  expect(
    compareFloat(vecRange[1].toFixed(3), 441.673),
    'vector magnitude max value should be 441.673'
  ).toBeTruthy();
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

  expect(
    ranges.length === numberOfComponents + 1,
    'getRanges should return an array of 5 vtkRange objects'
  ).toBeTruthy();
  expect(
    ranges[0].min === 0,
    'component:0 minimum value should be 0'
  ).toBeTruthy();
  expect(
    ranges[0].max === 9,
    'component:0 maximum value should be 9'
  ).toBeTruthy();
  expect(
    ranges[1].min === 0,
    'component:1 minimum value should be 0'
  ).toBeTruthy();
  expect(
    ranges[1].max === 18,
    'component:1 maximum value should be 18'
  ).toBeTruthy();
  expect(
    ranges[2].min === 0,
    'component:2 minimum value should be 0'
  ).toBeTruthy();
  expect(
    ranges[2].max === 27,
    'component:2 maximum value should be 27'
  ).toBeTruthy();
  expect(
    ranges[3].min === 0,
    'component:-1 vector magnitude minimum should be 0'
  ).toBeTruthy();
  expect(
    ranges[3].max === 36,
    'component:-1 vector magnitude maximum should be 36'
  ).toBeTruthy();
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

  expect(
    ranges === undefined,
    'getRanges should return undefined'
  ).toBeTruthy();

  // now fetch the range for component 0.
  da.getRange(0);

  // now fetch the ranges again with `computeRanges` set to false.
  const updatedRanges = da.getRanges(false);

  // `updatedRanges` should now be only the range for component 0. because if
  // was computed in `da.getRange(0)`
  expect(
    updatedRanges.length === numberOfComponents + 1,
    'getRanges should return an array of 5 vtkRange objects'
  ).toBeTruthy();
  expect(
    updatedRanges[0].min === 0,
    'component:0 minimum value should be 0'
  ).toBeTruthy();
  expect(
    updatedRanges[0].max === 9,
    'component:0 maximum value should be 9'
  ).toBeTruthy();
  expect(updatedRanges[1] === null, 'component:1 should be null').toBeTruthy();
  expect(updatedRanges[2] === null, 'component:2 should be null').toBeTruthy();
  expect(updatedRanges[3] === null, 'component:3 should be null').toBeTruthy();
  expect(updatedRanges[4] === null, 'component:-1 should be null').toBeTruthy();
});

it('Test vtkDataArray insertNextTuple', () => {
  const dataArray = vtkDataArray.newInstance({
    dataType: VtkDataTypes.UNSIGNED_CHAR,
    empty: true,
    numberOfComponents: 3,
  });
  expect(dataArray.getData().length, 'dataArray.getData() starts empty').toBe(
    0
  );

  let idx = dataArray.insertNextTuple([1, 2, 3]);

  expect(dataArray.getData().length, 'dataArray after first insert').toBe(3);
  expect(idx, 'idx after first insert').toBe(0);

  idx = dataArray.insertNextTuple([4, 5, 6]);

  expect(dataArray.getData().length, 'dataArray after second insert').toBe(6);
  expect(idx, 'idx after second insert').toBe(1);

  // numberOfComponents forces the length of the inserted tuple to be 3
  idx = dataArray.insertNextTuple([7, 8, 9, 10]);

  expect(dataArray.getData().length, 'dataArray after long insert').toBe(9);
  expect(dataArray.getData()[8], 'dataArray last value is 9').toBe(9);
  expect(idx, 'idx after third insert').toBe(2);

  idx = dataArray.insertNextTuple([10]);

  expect(dataArray.getData().length, 'dataArray after short insert').toBe(12);
  expect(dataArray.getData()[11], 'dataArray has default value').toBe(0);
  expect(idx, 'idx after fourth insert').toBe(3);
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

  expect(
    dataArray.getTuples(),
    'getTuples without parameters returns the whole array'
  ).toEqual(values);

  expect(dataArray.getTuples(1, 4), 'check tuples between two indices').toEqual(
    Uint8Array.from([3, 4, 5, 6, 7, 8, 9, 10, 11])
  );

  expect(
    dataArray.getTuples(-3, -1),
    'check tuples between two negative indices'
  ).toEqual(Uint8Array.from([6, 7, 8, 9, 10, 11]));

  expect(dataArray.getTuples(1, 0), 'invalid range returns null').toBe(null);

  expect(
    dataArray.getTuples(1, 10),
    'to > numberOfTuples returns array until numberOfTuples'
  ).toEqual(Uint8Array.from([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]));

  const emptyDataArray = vtkDataArray.newInstance({
    dataType: VtkDataTypes.UNSIGNED_CHAR,
    empty: true,
    numberOfComponents: 3,
  });

  emptyDataArray.insertNextTuples(dataArray.getTuples());

  expect(
    emptyDataArray.getTuples(),
    'to.insertTuples(from.getTuples()) copies all the values'
  ).toEqual(values);
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

  expect(
    dataArray.findTuple([9, 10, 11]),
    'findTuple should find tuple [9, 10, 11] at index 3'
  ).toBe(3);
  expect(
    dataArray.findTuple([3, 4, 4], 1),
    'findTuple should find tuple [3, 4, 4] from offset 1 at index 1'
  ).toBe(1);
  expect(
    dataArray.findTuple(Float32Array.from([12, 13, 14])),
    'findTuple should accept typed arrays'
  ).toBe(4);
});

it('Test vtkDataArray allocate function', () => {
  // create an empty data array with 3 channel data.
  const da = vtkDataArray.newInstance({
    numberOfComponents: 3,
    empty: true,
  });

  expect(da.getNumberOfTuples(), 'empty').toBe(0);

  da.allocate(2);
  let oldData = da.getData();

  expect(
    da.getNumberOfTuples(),
    'allocate does not change number of tuples'
  ).toBe(0);

  da.insertNextTuple([1, 2, 3]);
  da.insertNextTuple([1, 2, 3]);

  expect(da.getNumberOfTuples(), 'inserted 2 tuples').toBe(2);
  expect(da.getData().buffer, 'no array allocation on insert').toBe(
    oldData.buffer
  );

  da.allocate(2);

  expect(
    da.getNumberOfTuples(),
    'allocate does not change number of tuples'
  ).toBe(2);
  expect(da.getData().buffer, 'reallocate array on allocate').not.toBe(
    oldData.buffer
  );
  oldData = da.getData();

  da.insertNextTuple([1, 2, 3]);
  da.insertNextTuple([1, 2, 3]);

  expect(da.getNumberOfTuples() === 4, '2 more tuples').toBeTruthy();
  expect(da.getData().buffer, 'no array allocation on insert').toBe(
    oldData.buffer
  );
});

it('Test vtkDataArray resize function', () => {
  // create an empty data array with 3 channel data.
  const da = vtkDataArray.newInstance({
    numberOfComponents: 3,
    empty: true,
  });

  expect(da.getNumberOfTuples() === 0, 'empty').toBeTruthy();

  da.resize(2);

  expect(
    da.getNumberOfTuples() === 2,
    'resize does change the number of tuples'
  ).toBeTruthy();

  da.insertNextTuple([1, 2, 3]);
  da.insertNextTuple([1, 2, 3]);

  expect(da.getNumberOfTuples() === 4, 'inserted 2 tuples').toBeTruthy();

  const oldData = da.getData();
  da.resize(2);

  expect(
    da.getNumberOfTuples() === 2,
    'resize reduces the number of tuples'
  ).toBeTruthy();
  expect(da.getData().buffer, 'no array allocation on shrink').toBe(
    oldData.buffer
  );

  da.insertNextTuple([1, 2, 3]);
  da.insertNextTuple([1, 2, 3]);

  expect(da.getNumberOfTuples() === 4, '2 more tuples').toBeTruthy();
  expect(da.getData().buffer, 'no array allocation on shrink').toBe(
    oldData.buffer
  );
});
