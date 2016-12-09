import test from 'tape-catch';
import vtk from '../vtk';

import vtkDataArray       from '../Common/Core/DataArray';
import vtkPoints          from '../Common/Core/Points';
import vtkLookupTable     from '../Common/Core/LookupTable';
import vtkScalarsToColors from '../Common/Core/ScalarsToColors';

import vtkPolyData from '../Common/DataModel/PolyData';

const classToTest = [
  'vtkDataArray',
  'vtkPoints',
  'vtkLookupTable',
  'vtkScalarsToColors',
  'vtkPolyData',
];

const SERIALIZABLE_CLASSES = {
  vtkDataArray: {
    class: vtkDataArray,
    data: { values: [1.1, 2.2, 3.3, 4.4, 5.5] },
  },
  vtkPoints: {
    class: vtkPoints,
    data: {
      data: {
        vtkClass: 'vtkDataArray',
        numberOfComponents: 3,
        dataType: 'Float64Array',
        values: [0, 0, 0, 1, 0, 0, 0, 1, 0],
      },
    },
  },
  vtkLookupTable,
  vtkScalarsToColors,
  vtkPolyData: {
    class: vtkPolyData,
    data: {
      points: { vtkClass: 'vtkDataArray', values: [0, 0, 0, 1, 1, 1, 2, 2, 2], numberOfComponents: 3 },
      polys: { vtkClass: 'vtkDataArray', values: [1, 0, 1, 2], dataType: 'Uint32Array' },
    },
  },
};

function ignoreMTime(json) {
  return JSON.stringify(json).replace(/"mtime":[0-9]+/g, '"mtime":0');
}

classToTest.forEach((testName) => {
  const klass = SERIALIZABLE_CLASSES[testName].class || SERIALIZABLE_CLASSES[testName];
  const initData = SERIALIZABLE_CLASSES[testName].data;
  const debug = SERIALIZABLE_CLASSES[testName].debug;

  test(`Test ${testName} serialization/deserialization`, (t) => {
    t.ok(klass, 'Make sure the class definition exist');
    const instance = klass.newInstance(initData);
    t.ok(instance, 'Make sure the instance exist');

    const state = instance.getState();
    t.ok(instance, 'Make sure we can get serialize data');
    const instance2 = vtk(state);
    t.ok(instance, 'Make sure we can get deserialize data');
    const state2 = instance2.getState();

    if (debug) {
      console.log(state);
    }

    t.notEqual(instance, instance2, 'We have two different instances');
    t.deepEqual(ignoreMTime(state), ignoreMTime(state2), 'But same serialized content');

    t.end();
  });
});

