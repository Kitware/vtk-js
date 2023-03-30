import macro from 'vtk.js/Sources/macros';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';

import vtkAbstractManipulator from 'vtk.js/Sources/Widgets/Manipulators/AbstractManipulator';

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
// vtkCPRManipulator methods
// ----------------------------------------------------------------------------

function vtkCPRManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCPRManipulator');

  publicAPI.handleEvent = (callData, glRenderWindow) =>
    intersectDisplayWithPlane(
      callData.position.x,
      callData.position.y,
      publicAPI.getOrigin(callData),
      publicAPI.getNormal(callData),
      callData.pokedRenderer,
      glRenderWindow
    );
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

function defaultValues(initialValues) {
  return {
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  vtkAbstractManipulator.extend(publicAPI, model, defaultValues(initialValues));

  vtkCPRManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCPRManipulator');

// ----------------------------------------------------------------------------

export default { intersectDisplayWithPlane, extend, newInstance };
