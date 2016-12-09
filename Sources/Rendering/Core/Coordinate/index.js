import * as macro from '../../../macro';
import { VTK_COORDINATE } from './Constants';

// ----------------------------------------------------------------------------
// vtkActor methods
// ----------------------------------------------------------------------------

function vtkCoordinate(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCoordinate');

  publicAPI.setCoordinateSystemToDisplay = () => {
    publicAPI.setCoordinateSystem(VTK_COORDINATE.DISPLAY);
  };

  publicAPI.setCoordinateSystemToNormalizedDisplay = () => {
    publicAPI.setCoordinateSystem(VTK_COORDINATE.NORMALIZED_DISPLAY);
  };

  publicAPI.setCoordinateSystemToViewport = () => {
    publicAPI.setCoordinateSystem(VTK_COORDINATE.VIEWPORT);
  };

  publicAPI.setCoordinateSystemToNormalizedViewport = () => {
    publicAPI.setCoordinateSystem(VTK_COORDINATE.NORMALIZED_VIEWPORT);
  };

  publicAPI.setCoordinateSystemToView = () => {
    publicAPI.setCoordinateSystem(VTK_COORDINATE.VIEW);
  };

  publicAPI.setCoordinateSystemToWorld = () => {
    publicAPI.setCoordinateSystem(VTK_COORDINATE.WORLD);
  };

  publicAPI.getCoordinateSystemAsString = () => macro.enumToString(VTK_COORDINATE, model.coordinateSystem);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  coordinateSystem: VTK_COORDINATE.WORLD,
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
