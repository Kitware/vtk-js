import test from 'tape-catch';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

test('Test vtkDataArray instance', (t) => {
  t.ok(vtkDataArray, 'Make sure the class definition exists');
  const instance = vtkDataArray.newInstance({ size: 256 });
  t.ok(instance);
  t.end();
});

test('Test vtkDataArray getRange function with single-channel data.', (t) => {
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

  t.ok(da.getRange(0)[0] === 0, 'getRange minimum value should be 0');
  t.ok(da.getRange(0)[1] === 767, 'getRange maximum value should be 767');

  t.end();
});

test('Test vtkDataArray getTuple', (t) => {
  const da = vtkDataArray.newInstance({
    numberOfComponents: 3,
    values: new Uint8Array([0, 1, 2, 3, 4, 5]),
  });
  const da2 = vtkDataArray.newInstance({
    numberOfComponents: 3,
    values: new Uint8Array([0, 1, 2, 3, 4, 5]),
  });

  t.ok(vtkMath.areEquals(da.getTuple(0), [0, 1, 2]), 'get first tuple');
  t.ok(vtkMath.areEquals(da.getTuple(1), [3, 4, 5]), 'get 2nd tuple');
  t.ok(da.getTuple(0) !== da.getTuple(1), 'getTuple twice');
  t.ok(da.getTuple(0) !== da2.getTuple(0), 'getTuple twice');
  const tuple = [];
  t.equal(da.getTuple(0, tuple), tuple, 'getTuple with tupleToFill');
  t.equal(tuple.length, 3, 'getTuple length');
  const typedArray = new Uint8Array(3);
  t.equal(
    da.getTuple(0, typedArray),
    typedArray,
    'getTuple with typed tupleToFill'
  );
  t.ok(vtkMath.areEquals(typedArray, [0, 1, 2]), 'get typed first tuple');
  t.end();
});

test('Test vtkDataArray getRange function with multi-channel data.', (t) => {
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

  t.ok(da.getRange(0)[0] === 0, 'component:0 minimum value should be 0');
  t.ok(da.getRange(0)[1] === 255, 'component:0 maximum value should be 255');
  t.ok(da.getRange(1)[0] === 0, 'component:1 minimum value should be 0');
  t.ok(da.getRange(1)[1] === 510, 'component:1 maximum value should be 510');
  t.ok(da.getRange(2)[0] === 0, 'component:2 minimum value should be 0');
  t.ok(da.getRange(2)[1] === 765, 'component:2 maximum value should be 765');

  // re-fill the array with the pattern 0,0,0, 1,1,1 2,2,2 as 3d vector values
  for (let i = 0; i < 256; ++i) {
    newArray[i * 3] = i;
    newArray[i * 3 + 1] = i;
    newArray[i * 3 + 2] = i;
  }

  const compareFloat = (a, b) => Math.abs(a - b) < Number.EPSILON;
  const vecRange = da.getRange(-1);
  t.ok(
    compareFloat(vecRange[0].toFixed(2), 0.0),
    'vector magnitude min value should be be 0.0'
  );
  t.ok(
    compareFloat(vecRange[1].toFixed(3), 441.673),
    'vector magnitude max value should be 441.673'
  );
  t.end();
});

test('Test vtkDataArray insertNextTuple', (t) => {
  const dataArray = vtkDataArray.newInstance({
    dataType: VtkDataTypes.UNSIGNED_CHAR,
    empty: true,
    numberOfComponents: 3,
  });
  t.equal(dataArray.getData().length, 0, 'dataArray.getData() starts empty');

  let idx = dataArray.insertNextTuple([1, 2, 3]);

  t.equal(dataArray.getData().length, 3, 'dataArray after first insert');
  t.equal(idx, 0, 'idx after first insert');

  idx = dataArray.insertNextTuple([4, 5, 6]);

  t.equal(dataArray.getData().length, 6, 'dataArray after second insert');
  t.equal(idx, 1, 'idx after second insert');

  // numberOfComponents forces the length of the inserted tuple to be 3
  idx = dataArray.insertNextTuple([7, 8, 9, 10]);

  t.equal(dataArray.getData().length, 9, 'dataArray after long insert');
  t.equal(dataArray.getData()[8], 9, 'dataArray last value is 9');
  t.equal(idx, 2, 'idx after third insert');

  idx = dataArray.insertNextTuple([10]);

  t.equal(dataArray.getData().length, 12, 'dataArray after short insert');
  t.equal(dataArray.getData()[11], 0, 'dataArray has default value');
  t.equal(idx, 3, 'idx after fourth insert');

  t.end();
});

test('Test vtkDataArray getTuples and insertTuples', (t) => {
  const values = Uint8Array.from([
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
  ]);

  const dataArray = vtkDataArray.newInstance({
    dataType: VtkDataTypes.UNSIGNED_CHAR,
    values,
    numberOfComponents: 3,
  });

  t.deepEqual(
    dataArray.getTuples(),
    values,
    'getTuples without parameters returns the whole array'
  );

  t.deepEqual(
    dataArray.getTuples(1, 4),
    Uint8Array.from([3, 4, 5, 6, 7, 8, 9, 10, 11]),
    'check tuples between two indices'
  );

  t.deepEqual(
    dataArray.getTuples(-3, -1),
    Uint8Array.from([6, 7, 8, 9, 10, 11]),
    'check tuples between two negative indices'
  );

  t.equal(dataArray.getTuples(1, 0), null, 'invalid range returns null');

  t.deepEqual(
    dataArray.getTuples(1, 10),
    Uint8Array.from([3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]),
    'to > numberOfTuples returns array until numberOfTuples'
  );

  const emptyDataArray = vtkDataArray.newInstance({
    dataType: VtkDataTypes.UNSIGNED_CHAR,
    empty: true,
    numberOfComponents: 3,
  });

  emptyDataArray.insertNextTuples(dataArray.getTuples());

  t.deepEqual(
    emptyDataArray.getTuples(),
    values,
    'to.insertTuples(from.getTuples()) copies all the values'
  );

  t.end();
});
