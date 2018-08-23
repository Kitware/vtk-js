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
// vtkPlanePointManipulator methods
// ----------------------------------------------------------------------------

function vtkPlanePointManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPlanePointManipulator');

  // --------------------------------------------------------------------------

  publicAPI.handleEvent = (callData, glRenderWindow) =>
    intersectDisplayWithPlane(
      callData.position.x,
      callData.position.y,
      model.planeOrigin,
      model.planeNormal,
      callData.pokedRenderer,
      glRenderWindow
    );
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  planeNormal: [0, 0, 1],
  planeOrigin: [0, 0, 0],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.obj(publicAPI, model);
  macro.setGetArray(publicAPI, model, ['planeNormal', 'planeOrigin'], 3);

  vtkPlanePointManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkPlanePointManipulator'
);

// ----------------------------------------------------------------------------

export default { intersectDisplayWithPlane, extend, newInstance };
