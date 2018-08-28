import macro from 'vtk.js/Sources/macro';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkInteractorObserver from 'vtk.js/Sources/Rendering/Core/InteractorObserver';
import vtkStateObserver from 'vtk.js/Sources/Interaction/Widgets2/StateObserver';

import Constants from './Constants';

// ----------------------------------------------------------------------------
// vtkAbstractWidget methods
// ----------------------------------------------------------------------------

function vtkAbstractWidget(publicAPI, model) {
  model.classHierarchy.push('vtkAbstractWidget');

  model.representation = null;

  //----------------------------------------------------------------------------
  // Public API methods
  //----------------------------------------------------------------------------

  // Virtual method
  // This is called whenever widget is enabled.
  // You should either create default reps here or
  // no-op if a user supplied reps for you.
  publicAPI.createDefaultRepresentation = () => {};

  //----------------------------------------------------------------------------

  // Invoke superclass setEnabled first
  publicAPI.setEnabled = macro.chain(publicAPI.setEnabled, (enable) => {
    if (!model.interactor) {
      return;
    }

    if (enable) {
      const renderer = model.interactor.getCurrentRenderer();
      if (!renderer) {
        return;
      }

      const rep = publicAPI.createDefaultRepresentation();
      if (rep) {
        model.representation = rep;
        rep.setRenderer(renderer);
        rep.setWidgetState(publicAPI.getWidgetState());
        renderer.addViewProp(rep);
      }
    } else {
      const renderer = model.interactor.getCurrentRenderer();
      if (renderer && model.representation) {
        renderer.removeViewProp(model.representation);
      }
    }
  });

  //----------------------------------------------------------------------------

  // Given display coordinates and a plane, returns the
  // point on the plane that corresponds to display coordinates.
  publicAPI.displayToPlane = (displayCoords, planePoint, planeNormal) => {
    const view = publicAPI.getInteractor().getView();
    const renderer = publicAPI.getInteractor().getCurrentRenderer();
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
    const rayLength = vtkMath.dot(dop, ray);

    const clipRange = camera.getClippingRange();

    const p1World = [0, 0, 0];
    const p2World = [0, 0, 0];

    // get line segment coords from ray based on clip range
    if (camera.getParallelProjection()) {
      const tF = clipRange[0] - rayLength;
      const tB = clipRange[1] - rayLength;
      for (let i = 0; i < 3; i++) {
        p1World[i] = planePoint[i] + tF * dop[i];
        p2World[i] = planePoint[i] + tB * dop[i];
      }
    } else {
      const tF = clipRange[0] / rayLength;
      const tB = clipRange[1] / rayLength;
      for (let i = 0; i < 3; i++) {
        p1World[i] = cameraPos[i] + tF * ray[i];
        p2World[i] = cameraPos[i] + tB * ray[i];
      }
    }

    const r = vtkPlane.intersectWithLine(
      p1World,
      p2World,
      planePoint,
      planeNormal
    );
    return r.intersection ? r.x : null;
  };

  //----------------------------------------------------------------------------

  publicAPI.render = () => {
    if (!model.parent && model.interactor) {
      model.interactor.render();
    }
  };

  //----------------------------------------------------------------------------

  // start off disabled
  publicAPI.setEnabled(false);
  publicAPI.setPriority(Constants.WIDGET_PRIORITY);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkInteractorObserver.extend(publicAPI, model, initialValues);

  macro.get(publicAPI, model, ['parent']);
  macro.setGet(publicAPI, model, ['representation']);

  // mixin
  vtkStateObserver(publicAPI, model);

  // Object methods
  vtkAbstractWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkAbstractWidget');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, Constants);
