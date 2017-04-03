import macro          from 'vtk.js/Sources/macro';
import { Coordinate } from 'vtk.js/Sources/Rendering/Core/Coordinate/Constants';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkActor methods
// ----------------------------------------------------------------------------

function vtkCoordinate(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCoordinate');

  publicAPI.setValue = (...args) => {
    if (model.deleted) {
      vtkErrorMacro('instance deleted - cannot call any method');
      return false;
    }

    let array = args;
    // allow an array passed as a single arg.
    if (array.length === 1 && Array.isArray(array[0])) {
      array = array[0];
    }

    if (array.length === 2) {
      publicAPI.setValue(array[0], array[1], 0.0);
      return true;
    }
    if (array.length !== 3) {
      throw new RangeError('Invalid number of values for array setter');
    }
    let changeDetected = false;
    model.values.forEach((item, index) => {
      if (item !== array[index]) {
        if (changeDetected) {
          return;
        }
        changeDetected = true;
      }
    });

    if (changeDetected) {
      model.values = [].concat(array);
      publicAPI.modified();
    }
    return true;
  };

  publicAPI.setCoordinateSystemToDisplay = () => {
    publicAPI.setCoordinateSystem(Coordinate.DISPLAY);
  };

  publicAPI.setCoordinateSystemToNormalizedDisplay = () => {
    publicAPI.setCoordinateSystem(Coordinate.NORMALIZED_DISPLAY);
  };

  publicAPI.setCoordinateSystemToViewport = () => {
    publicAPI.setCoordinateSystem(Coordinate.VIEWPORT);
  };

  publicAPI.setCoordinateSystemToNormalizedViewport = () => {
    publicAPI.setCoordinateSystem(Coordinate.NORMALIZED_VIEWPORT);
  };

  publicAPI.setCoordinateSystemToView = () => {
    publicAPI.setCoordinateSystem(Coordinate.VIEW);
  };

  publicAPI.setCoordinateSystemToWorld = () => {
    publicAPI.setCoordinateSystem(Coordinate.WORLD);
  };

  publicAPI.getCoordinateSystemAsString = () => macro.enumToString(Coordinate, model.coordinateSystem);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  coordinateSystem: Coordinate.WORLD,
  value: [0.0, 0.0, 0.0],
  viewport: null,
  referenceCoordinate: null,
  computing: 0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);


  // Build VTK API
  macro.set(publicAPI, model, ['property']);
  macro.setGet(publicAPI, model, [
    'coordinateSystem',
    'referenceCoordinate',
    'viewport',
  ]);

  macro.getArray(publicAPI, model, [
    'value',
  ], 3);

  // Object methods
  vtkCoordinate(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCoordinate');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
