import test from 'tape-catch';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import Constants from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import * as macro from 'vtk.js/Sources/macros';

const { DefaultDataType } = Constants;

function getPointsProperties(points) {
  return {
    size: points.get().size,
    numberOfComponents: points.get().numberOfComponents,
    dataType: points.get().dataType,
    values: points.get().values,
  };
}

test('Test vtkPoints instance', (t) => {
  t.ok(vtkPoints, 'Make sure the class definition exists');

  t.doesNotThrow(
    () => vtkPoints.newInstance({ size: 256 }),
    'Allowed to create instance with only size'
  );

  const points0 = vtkPoints.newInstance({
    empty: true,
    values: null,
  });
  t.deepEqual(
    {
      dataType: DefaultDataType,
      size: 0,
      numberOfComponents: 3,
      values: null,
    },
    getPointsProperties(points0),
    'initialValues.values = null'
  );

  const points1 = vtkPoints.newInstance({ size: 3 });
  t.deepEqual(
    {
      dataType: DefaultDataType,
      size: 3,
      numberOfComponents: 3,
      values: macro.newTypedArray(DefaultDataType, 3),
    },
    getPointsProperties(points1),
    'Give only size to create instance'
  );

  const points2 = vtkPoints.newInstance({
    values: Uint32Array.from([1, 2, 3]),
  });
  t.deepEqual(
    {
      dataType: 'Uint32Array',
      size: 3,
      numberOfComponents: 3,
      values: Uint32Array.from([1, 2, 3]),
    },
    getPointsProperties(points2),
    'Create instance with data (typed array)'
  );

  const points3 = vtkPoints.newInstance({
    values: [1, 2, 3],
  });
  t.deepEqual(
    {
      dataType: DefaultDataType,
      size: 3,
      numberOfComponents: 3,
      values: macro.newTypedArrayFrom(DefaultDataType, [1, 2, 3]),
    },
    getPointsProperties(points3),
    'Create instance with data (untyped array)'
  );

  const points4 = vtkPoints.newInstance({
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
    getPointsProperties(points4),
    'Change number of components at instanciation'
  );

  const points5 = vtkPoints.newInstance({
    values: [1, 2, 3],
    dataType: null,
  });
  t.deepEqual(
    {
      dataType: DefaultDataType,
      size: 3,
      numberOfComponents: 3,
      values: macro.newTypedArrayFrom(DefaultDataType, [1, 2, 3]),
    },
    getPointsProperties(points5),
    'Give null as dataType'
  );

  const points6 = vtkPoints.newInstance({
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
    getPointsProperties(points6),
    'Give numberOfComponents!=1 with empty array'
  );

  t.end();
});
