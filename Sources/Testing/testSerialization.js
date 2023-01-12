import test from 'tape-catch';
import vtk from 'vtk.js/Sources/vtk';
import macro from 'vtk.js/Sources/macros';

import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkLookupTable from 'vtk.js/Sources/Common/Core/LookupTable';
import vtkScalarsToColors from 'vtk.js/Sources/Common/Core/ScalarsToColors';

import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import Common from 'vtk.js/Sources/Common';
import Filters from 'vtk.js/Sources/Filters';
import Imaging from 'vtk.js/Sources/Imaging';
import Interaction from 'vtk.js/Sources/Interaction';
import IO from 'vtk.js/Sources/IO';
import Rendering from 'vtk.js/Sources/Rendering';
import VTKProxy from 'vtk.js/Sources/Proxy';
import Widgets from 'vtk.js/Sources/Widgets';

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

function findVTKObjects(objects) {
  return Object.entries(objects).reduce((res, [className, object]) => {
    if (typeof object !== 'object' || object == null) {
      return res;
    }
    if (object.newInstance) {
      res[className] = object;
      return res;
    }

    return Object.assign(res, findVTKObjects(object));
  }, {});
}

// If this test is hanging, it is due to a problem in `getState()`.
test(`Test serialization of`, (t) => {
  const VTK = {
    Common,
    Filters,
    Imaging,
    Interaction,
    IO,
    Rendering,
    VTKProxy,
    Widgets,
  };
  // List of classes that can't be instantiated with default arguments.
  const classesToIgnore = [
    'vtkDataArray',
    'vtkStringArray',
    'vtkVariantArray',
    'vtkITKImageReader',
    'vtkITKPolyDataReader',
    'vtkFullScreenRenderWindow',
    'vtkAbstractWidget',
  ];
  const onlyClasses = [];
  const allObjects = findVTKObjects(VTK);

  Object.entries(allObjects).forEach(([className, factory]) => {
    if (
      !classesToIgnore.includes(className) &&
      (onlyClasses.length === 0 || onlyClasses.includes(className))
    ) {
      t.comment(`${className}.newInstance()`);
      const instance = factory.newInstance();
      // If an error occurs here, you may have a cyclical dependency in the JSON
      // returned by getState(). This is typically fixed by making some model
      // variables protected (prefixed with _).
      JSON.stringify(instance);
    }
  });
  t.end();
});
