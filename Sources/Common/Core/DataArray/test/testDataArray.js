import test from 'tape-catch';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import Constants from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import * as macro from 'vtk.js/Sources/macros';

const { DefaultDataType } = Constants;

function getDataArrayProperties(dataArray) {
  return {
    size: dataArray.get().size,
    numberOfComponents: dataArray.get().numberOfComponents,
    dataType: dataArray.get().dataType,
    values: dataArray.get().values,
  };
}

test('Test vtkDataArray instance', (t) => {
  t.ok(vtkDataArray, 'Make sure the class definition exists');

  t.throws(
    () => vtkDataArray.newInstance({}),
    'Not allowed to create instance without initialValues'
  );

  t.doesNotThrow(
    () => vtkDataArray.newInstance({ empty: true }),
    'Allowed to create instance with empty true, no data'
  );

  t.throws(
    () => vtkDataArray.newInstance({ empty: false }),
    'Not allowed to create instance with empty false, no data'
  );

  t.doesNotThrow(
    () => vtkDataArray.newInstance({ size: 256 }),
    'Allowed to create instance with only size'
  );

  const dataArray0 = vtkDataArray.newInstance({
    empty: true,
    values: null,
  });
  t.deepEqual(
    {
      dataType: DefaultDataType,
      size: 0,
      numberOfComponents: 1,
      values: null,
    },
    getDataArrayProperties(dataArray0),
    'initialValues.values = null'
  );

  const dataArray1 = vtkDataArray.newInstance({ size: 256 });
  t.deepEqual(
    {
      dataType: DefaultDataType,
      size: 256,
      numberOfComponents: 1,
      values: macro.newTypedArray(DefaultDataType, 256),
    },
    getDataArrayProperties(dataArray1),
    'Give only size to create instance'
  );

  const dataArray2 = vtkDataArray.newInstance({
    values: Uint32Array.from([1, 2, 3]),
  });
  t.deepEqual(
    {
      dataType: 'Uint32Array',
      size: 3,
      numberOfComponents: 1,
      values: Uint32Array.from([1, 2, 3]),
    },
    getDataArrayProperties(dataArray2),
    'Create instance with data (typed array)'
  );

  const dataArray3 = vtkDataArray.newInstance({
    values: [1, 2, 3],
  });
  t.deepEqual(
    {
      dataType: DefaultDataType,
      size: 3,
      numberOfComponents: 1,
      values: macro.newTypedArrayFrom(DefaultDataType, [1, 2, 3]),
    },
    getDataArrayProperties(dataArray3),
    'Create instance with data (untyped array)'
  );

  const dataArray4 = vtkDataArray.newInstance({
    values: [1, 2, 3, 4, 5, 6, 7, 8, 9],
    numberOfComponents: 3,
  });
  t.deepEqual(
    {
      dataType: DefaultDataType,
      size: 9,
      numberOfComponents: 3,
      values: macro.newTypedArrayFrom(
        DefaultDataType,
        [1, 2, 3, 4, 5, 6, 7, 8, 9]
      ),
    },
    getDataArrayProperties(dataArray4),
    'Change number of components at instanciation'
  );

  const dataArray5 = vtkDataArray.newInstance({
    values: [1, 2, 3],
    dataType: null,
  });
  t.deepEqual(
    {
      dataType: DefaultDataType,
      size: 3,
      numberOfComponents: 1,
      values: macro.newTypedArrayFrom(DefaultDataType, [1, 2, 3]),
    },
    getDataArrayProperties(dataArray5),
    'Give null as dataType'
  );

  const dataArray6 = vtkDataArray.newInstance({
    empty: true,
    values: null,
    numberOfComponents: 3,
  });
  t.deepEqual(
    {
      dataType: DefaultDataType,
      size: 0,
      numberOfComponents: 3,
      values: null,
    },
    getDataArrayProperties(dataArray6),
    'Give numberOfComponents!=1 with empty array'
  );

  const dataArray7 = vtkDataArray.newInstance({
    size: 3,
    numberOfComponents: 3,
  });
  t.deepEqual(
    {
      dataType: DefaultDataType,
      size: 3,
      numberOfComponents: 3,
      values: macro.newTypedArray(DefaultDataType, 3),
    },
    getDataArrayProperties(dataArray7),
    'Give only size to create instance'
  );

  t.end();
});

test('Test vtkDataArray setData', (t) => {
  const dataArray = vtkDataArray.newInstance({ empty: true });

  dataArray.setData([4, 5, 6, 7]);
  t.deepEqual(
    {
      dataType: DefaultDataType,
      size: 4,
      numberOfComponents: 1,
      values: macro.newTypedArrayFrom(DefaultDataType, [4, 5, 6, 7]),
    },
    getDataArrayProperties(dataArray),
    'Change data of existing instance'
  );

  dataArray.setData([1, 2, 3, 4, 5, 6], 2);
  t.deepEqual(
    {
      dataType: DefaultDataType,
      size: 6,
      numberOfComponents: 2,
      values: macro.newTypedArrayFrom(DefaultDataType, [1, 2, 3, 4, 5, 6]),
    },
    getDataArrayProperties(dataArray),
    'Change number of components with setData'
  );

  dataArray.setData([1, 2, 3, 4], 3);
  t.deepEqual(
    {
      dataType: DefaultDataType,
      size: 4,
      numberOfComponents: 1,
      values: macro.newTypedArrayFrom(DefaultDataType, [1, 2, 3, 4]),
    },
    getDataArrayProperties(dataArray),
    'Change number of components with setData but wrong numberOfComponents'
  );

  dataArray.setData([]);
  t.deepEqual(
    {
      dataType: DefaultDataType,
      size: 0,
      numberOfComponents: 1,
      values: macro.newTypedArray(DefaultDataType),
    },
    getDataArrayProperties(dataArray),
    'Empty an instance (pass [] array)'
  );

  // Fill the DataArray before so that we are sure the size and the numberOfComponents are updated
  dataArray.setData([1, 2, 3], 3);
  dataArray.setData(null);
  t.deepEqual(
    {
      dataType: DefaultDataType,
      size: 0,
      numberOfComponents: 3,
      values: null,
    },
    getDataArrayProperties(dataArray),
    'Call setData with typedArray = null'
  );

  // Fill the DataArray before so that we are sure the size and the numberOfComponents are updated
  dataArray.setData([1, 2, 3], 3);
  dataArray.setData();
  t.deepEqual(
    {
      dataType: DefaultDataType,
      size: 0,
      numberOfComponents: 3,
      values: null,
    },
    getDataArrayProperties(dataArray),
    'Call setData with typedArray = undefined'
  );

  dataArray.setData(macro.newTypedArrayFrom('Uint32Array', [4, 5, 6, 7]));
  t.deepEqual(
    {
      dataType: 'Uint32Array',
      size: 4,
      numberOfComponents: 1,
      values: macro.newTypedArrayFrom('Uint32Array', [4, 5, 6, 7]),
    },
    getDataArrayProperties(dataArray),
    'Change data of existing instance with another type'
  );
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
