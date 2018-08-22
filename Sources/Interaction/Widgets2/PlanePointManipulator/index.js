import macro from 'vtk.js/Sources/macro';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';

function displayToPlane(displayCoords, planePoint, planeNormal, interactor) {
  const view = interactor.getView();
  const renderer = interactor.getCurrentRenderer();
  const camera = renderer.getActiveCamera();

  const cameraFocalPoint = camera.getFocalPoint();
  const cameraPos = camera.getPosition();

  // Adapted from vtkPicker
  const focalPointDispCoords = view.worldToDisplay(
    ...cameraFocalPoint,
    renderer
  );
  const worldCoords = view.displayToWorld(
    displayCoords[0],
    displayCoords[1],
    focalPointDispCoords[2], // Use focal point for z coord
    renderer
  );

  // compute ray from camera to selection
  const ray = [0, 0, 0];
  for (let i = 0; i < 3; ++i) {
    ray[i] = worldCoords[i] - cameraPos[i];
  }

  const dop = camera.getDirectionOfProjection();
  vtkMath.normalize(dop);

  const p2World = [0, 0, 0];

  if (camera.getParallelProjection()) {
    for (let i = 0; i < 3; i++) {
      p2World[i] = planePoint[i] + 99999 * dop[i];
    }
  } else {
    for (let i = 0; i < 3; i++) {
      p2World[i] = cameraPos[i] + 99999 * ray[i];
    }
  }

  const r = vtkPlane.intersectWithLine(
    cameraPos,
    p2World,
    planePoint,
    planeNormal
  );
  return r.intersection ? r.x : null;
}

// ----------------------------------------------------------------------------
// vtkPlanePointManipulator methods
// ----------------------------------------------------------------------------

function vtkPlanePointManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPlanePointManipulator');

  let subscription = null;

  function listenInteractor() {
    if (subscription) {
      subscription.unsubscribe();
      subscription = null;
    }

    if (model.interactor) {
      subscription = model.interactor.onMouseMove(publicAPI.onMouseMove);
    }
  }

  // --------------------------------------------------------------------------

  publicAPI.onMouseMove = (callData) => {
    const displayCoords = [callData.position.x, callData.position.y];
    const worldCoords = displayToPlane(
      displayCoords,
      model.planeOrigin,
      model.planeNormal,
      model.interactor
    );
    if (worldCoords) {
      publicAPI.setWorldCoords(...worldCoords);
    }
  };

  // --------------------------------------------------------------------------

  publicAPI.setInteractor = (interactor) => {
    if (model.interactor !== interactor) {
      if (subscription) {
        subscription.unsubscribe();
        subscription = null;
      }

      model.interactor = interactor;

      listenInteractor();
    }
  };

  // --------------------------------------------------------------------------

  listenInteractor();
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  interactor: null,
  planeNormal: [1, 0, 0],
  planeOrigin: [0, 0, 0],
  worldCoords: [0, 0, 0],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['interactor']);
  macro.setGetArray(
    publicAPI,
    model,
    ['worldCoords', 'planeNormal', 'planeOrigin'],
    3
  );

  vtkPlanePointManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkPlanePointManipulator'
);

// ----------------------------------------------------------------------------

export default { extend, newInstance };
