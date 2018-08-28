import macro from 'vtk.js/Sources/macro';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';

export function intersectDisplayWithPlane(
  x,
  y,
  planeOrigin,
  planeNormal,
  renderer,
  glRenderWindow
) {
  const near = glRenderWindow.displayToWorld(x, y, 0, renderer);
  const far = glRenderWindow.displayToWorld(x, y, 1, renderer);

  return vtkPlane.intersectWithLine(near, far, planeOrigin, planeNormal).x;
}

// ----------------------------------------------------------------------------
// vtkPlaneManipulator methods
// ----------------------------------------------------------------------------

function vtkPlaneManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPlaneManipulator');

  // --------------------------------------------------------------------------

  publicAPI.handleEvent = (callData, glRenderWindow) =>
    intersectDisplayWithPlane(
      callData.position.x,
      callData.position.y,
      model.origin,
      model.normal,
      callData.pokedRenderer,
      glRenderWindow
    );
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  normal: [0, 0, 1],
  origin: [0, 0, 0],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.obj(publicAPI, model);
  macro.setGetArray(publicAPI, model, ['normal', 'origin'], 3);

  vtkPlaneManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPlaneManipulator');

// ----------------------------------------------------------------------------

export default { intersectDisplayWithPlane, extend, newInstance };
