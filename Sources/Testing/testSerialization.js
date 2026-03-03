import { it, expect } from 'vitest';
import vtk from 'vtk.js/Sources/vtk';
import macro from 'vtk.js/Sources/macros';

import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkLookupTable from 'vtk.js/Sources/Common/Core/LookupTable';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkScalarsToColors from 'vtk.js/Sources/Common/Core/ScalarsToColors';

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
  'vtkImageData',
  'vtkLookupTable',
  'vtkPoints',
  'vtkPolyData',
  'vtkScalarsToColors',
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
  vtkImageData,
};

function ignoreMTime(json) {
  return JSON.stringify(json).replace(/"mtime":[0-9]+/g, '"mtime":0');
}

function assertSameSerializedContent(state, state2) {
  expect(ignoreMTime(state)).toEqual(ignoreMTime(state2));
}

classToTest.forEach((testName) => {
  const klass =
    SERIALIZABLE_CLASSES[testName].class || SERIALIZABLE_CLASSES[testName];
  const initData = SERIALIZABLE_CLASSES[testName].data;
  const debug = SERIALIZABLE_CLASSES[testName].debug;

  it(`Test ${testName} serialization/deserialization`, () => {
    expect(klass).toBeTruthy();
    const instance = klass.newInstance(initData);
    expect(instance).toBeTruthy();

    const state = instance.getState();
    expect(instance).toBeTruthy();

    const instance2 = vtk(state);
    expect(instance).toBeTruthy();
    const state2 = instance2.getState();

    if (debug) {
      vtkDebugMacro(state);
    }

    expect(instance).not.toBe(instance2);
    assertSameSerializedContent(state, state2);

    // Test JSON.stringify and JSON.parse behavior
    const jsonFromStringify = JSON.stringify(instance);
    const jsonFromGetState = JSON.stringify(state);

    expect(jsonFromStringify).toBe(jsonFromGetState);

    const state3 = JSON.parse(jsonFromStringify);
    const instance3 = vtk(state3);
    const state4 = JSON.parse(jsonFromGetState);
    const instance4 = vtk(state4);

    expect(instance3).toBeTruthy();
    expect(instance3).not.toBe(instance4);
    assertSameSerializedContent(state3, state4);
  });

  it(`Test ${testName} serialization on deleted object`, () => {
    expect(klass).toBeTruthy();
    const instance = klass.newInstance(initData);
    expect(instance).toBeTruthy();
    instance.delete();
    expect(JSON.stringify(instance)).toBe('null');
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
it(`Test serialization of`, () => {
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
      const instance = factory.newInstance();
      // If an error occurs here, you may have a cyclical dependency in the JSON
      // returned by getState(). This is typically fixed by making some model
      // variables protected (prefixed with _).
      JSON.stringify(instance);
    }
  });
});
