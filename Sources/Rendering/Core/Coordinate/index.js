import macro          from 'vtk.js/Sources/macro';
import { Coordinate } from 'vtk.js/Sources/Rendering/Core/Coordinate/Constants';

// ----------------------------------------------------------------------------
// vtkActor methods
// ----------------------------------------------------------------------------

function vtkCoordinate(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCoordinate');

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

  macro.setGetArray(publicAPI, model, [
    'value',
  ], 3);

  // Object methods
  vtkCoordinate(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCoordinate');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
