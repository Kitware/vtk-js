import test from 'tape-catch';
import vtk from 'vtk.js/Sources/vtk';
import macro from 'vtk.js/Sources/macros';

import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkLookupTable from 'vtk.js/Sources/Common/Core/LookupTable';
import vtkScalarsToColors from 'vtk.js/Sources/Common/Core/ScalarsToColors';

import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

const { vtkDebugMacro } = macro;

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
      values: [0, 0, 0, 1, 0, 0, 0, 1, 0],
    },
  },
  vtkLookupTable,
  vtkScalarsToColors,
  vtkPolyData: {
    class: vtkPolyData,
    data: {
      points: {
        vtkClass: 'vtkPoints',
        values: [0, 0, 0, 1, 1, 1, 2, 2, 2],
        numberOfComponents: 3,
      },
      polys: {
        vtkClass: 'vtkDataArray',
        values: [1, 0, 1, 2],
        dataType: 'Uint32Array',
      },
    },
  },
};

function ignoreMTime(json) {
  return JSON.stringify(json).replace(/"mtime":[0-9]+/g, '"mtime":0');
}

function assertSameSerializedContent(t, state, state2) {
  t.deepEqual(
    ignoreMTime(state),
    ignoreMTime(state2),
    'But same serialized content'
  );
}

classToTest.forEach((testName) => {
  const klass =
    SERIALIZABLE_CLASSES[testName].class || SERIALIZABLE_CLASSES[testName];
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
      vtkDebugMacro(state);
    }

    t.notEqual(instance, instance2, 'We have two different instances');
    assertSameSerializedContent(t, state, state2);

    // Test JSON.stringify and JSON.parse behavior
    const jsonFromStringify = JSON.stringify(instance);
    const jsonFromGetState = JSON.stringify(state);

    t.equal(
      jsonFromStringify,
      jsonFromGetState,
      'We have the same json string.'
    );

    const state3 = JSON.parse(jsonFromStringify);
    const instance3 = vtk(state3);
    const state4 = JSON.parse(jsonFromGetState);
    const instance4 = vtk(state4);

    t.ok(instance3, 'Make sure we get a valid instance');
    t.notEqual(instance3, instance4, 'We have two different instances');
    assertSameSerializedContent(t, state3, state4);

    t.end();
  });

  test(`Test ${testName} serialization on deleted object`, (t) => {
    t.ok(klass, 'Make sure the class definition exist');
    const instance = klass.newInstance(initData);
    t.ok(instance, 'Make sure the instance exist');
    instance.delete();
    t.equal(JSON.stringify(instance), 'null');
    t.end();
  });
});
