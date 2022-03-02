import test from 'tape-catch';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';

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
