import macro from 'vtk.js/Sources/macro';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';

export function intersectDisplayWithPlane({
  displayCoords,
  planeOrigin,
  planeNormal,
  renderer,
  renderWindow,
}) {
  const p1 = renderWindow.displayToWorld(
    displayCoords[0],
    displayCoords[1],
    -100,
    renderer
  );

  const p2 = renderWindow.displayToWorld(
    displayCoords[0],
    displayCoords[1],
    100,
    renderer
  );

  const r = vtkPlane.intersectWithLine(p1, p2, planeOrigin, planeNormal);
  return r.intersection ? r.x : null;
}

// ----------------------------------------------------------------------------
// vtkPlanePointManipulator methods
// ----------------------------------------------------------------------------

function vtkPlanePointManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPlanePointManipulator');

  // --------------------------------------------------------------------------

  publicAPI.handleEvent = (callData, renderWindow) => {
    const displayCoords = [callData.position.x, callData.position.y];
    return intersectDisplayWithPlane({
      displayCoords,
      planeOrigin: model.planeOrigin,
      planeNormal: model.planeNormal,
      renderer: callData.pokedRenderer,
      renderWindow,
    });
  };
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
