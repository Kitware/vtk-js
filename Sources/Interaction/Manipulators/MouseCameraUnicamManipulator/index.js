import vtkCompositeCameraManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeCameraManipulator';
import vtkCompositeMouseManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeMouseManipulator';
import vtkInteractorStyleConstants from 'vtk.js/Sources/Rendering/Core/InteractorStyle/Constants';
import vtkMouseCameraUnicamRotateManipulator from 'vtk.js/Sources/Interaction/Manipulators/MouseCameraUnicamRotateManipulator';

import macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

const { States } = vtkInteractorStyleConstants;

// ----------------------------------------------------------------------------
// vtkMouseCameraUnicamManipulator methods
// ----------------------------------------------------------------------------

function vtkMouseCameraUnicamManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMouseCameraUnicamManipulator');

  model.state = States.IS_NONE;

  model.rotateManipulator = vtkMouseCameraUnicamRotateManipulator.newInstance({
    button: model.button,
    shift: model.shift,
    control: model.control,
    alt: model.alt,
    dragEnabled: model.dragEnabled,
    scrollEnabled: model.scrollEnabled,
    displayFocusSphereOnButtonDown: false,
  });

  //----------------------------------------------------------------------------
  const normalize = (position, interactor) => {
    const renderer = interactor.findPokedRenderer();
    const [width, height] = interactor.getView().getViewportSize(renderer);

    const nx = -1.0 + (2.0 * position.x) / width;
    const ny = -1.0 + (2.0 * position.y) / height;

    return { x: nx, y: ny };
  };

  // Given a 3D point & a vtkCamera, compute the vectors that extend
  // from the projection of the center of projection to the center of
  // the right-edge and the center of the top-edge onto the plane
  // containing the 3D point & with normal parallel to the camera's
  // projection plane.
  const getRightVAndUpV = (downPoint, interactor) => {
    // Compute the horizontal & vertical scaling ('scalex' and 'scaley')
    // factors as function of the down point & camera params.
    const camera = interactor.findPokedRenderer().getActiveCamera();
    const cameraPosition = camera.getPosition();
    const cameraToPointVec = [0, 0, 0];

    // Construct a vector from the viewing position to the picked point
    vtkMath.subtract(downPoint, cameraPosition, cameraToPointVec);
    if (camera.getParallelProjection()) {
      vtkMath.multiplyScalar(cameraToPointVec, camera.getParallelScale());
    }

    // Get shortest distance 'l' between the viewing position and
    // plane parallel to the projection plane that contains the 'downPoint'.
    const atV = camera.getViewPlaneNormal();
    vtkMath.normalize(atV);
    const l = vtkMath.dot(cameraToPointVec, atV);
    const viewAngle = vtkMath.radiansFromDegrees(camera.getViewAngle());
    const renderer = interactor.findPokedRenderer();
    const [width, height] = interactor.getView().getViewportSize(renderer);

    const scaleX = (width / height) * ((2 * l * Math.tan(viewAngle / 2)) / 2);
    const scaleY = (2 * l * Math.tan(viewAngle / 2)) / 2;

    // Construct the camera offset vector as function of delta mouse X & Y.
    const upV = camera.getViewUp();
    const rightV = [];
    vtkMath.cross(upV, atV, rightV);
    // (Make sure 'upV' is orthogonal to 'atV' & 'rightV')
    vtkMath.cross(atV, rightV, upV);
    vtkMath.normalize(rightV);
    vtkMath.normalize(upV);

    vtkMath.multiplyScalar(rightV, scaleX);
    vtkMath.multiplyScalar(upV, scaleY);

    return { rightV, upV };
  };

  //----------------------------------------------------------------------------
  const choose = (interactor, position) => {
    const normalizedPosition = normalize(position, interactor);
    const normalizedPreviousPosition = normalize(
      model.previousPosition,
      interactor
    );
    const delta = {
      x: normalizedPosition.x - normalizedPreviousPosition.x,
      y: normalizedPosition.y - normalizedPreviousPosition.y,
    };
    model.previousPosition = position;

    const deltaT = Date.now() / 1000 - model.time;
    model.dist += Math.sqrt(delta.x ** 2 + delta.y ** 2);
    const sDelta = {
      x: position.x - model.startPosition.x,
      y: position.y - model.startPosition.y,
    };
    const len = Math.sqrt(sDelta.x ** 2 + sDelta.y ** 2);
    if (Math.abs(sDelta.y) / len > 0.9 && deltaT > 0.05) {
      model.state = States.IS_DOLLY;
    } else if (deltaT >= 0.1 || model.dist >= 0.03) {
      if (Math.abs(sDelta.x) / len > 0.6) {
        model.state = States.IS_PAN;
      } else {
        model.state = States.IS_DOLLY;
      }
    }
  };

  //----------------------------------------------------------------------------
  // Transform mouse horizontal & vertical movements to a world
  // space offset for the camera that maintains pick correlation.
  const pan = (interactor, position) => {
    const renderer = interactor.findPokedRenderer();
    const normalizedPosition = normalize(position, interactor);
    const normalizedPreviousPosition = normalize(
      model.previousPosition,
      interactor
    );

    const delta = {
      x: normalizedPosition.x - normalizedPreviousPosition.x,
      y: normalizedPosition.y - normalizedPreviousPosition.y,
    };

    const camera = renderer.getActiveCamera();

    model.previousPosition = position;

    const { rightV, upV } = getRightVAndUpV(model.downPoint, interactor);
    const offset = [];

    for (let index = 0; index < 3; index++) {
      offset[index] = delta.x * rightV[index] + delta.y * upV[index];
    }

    camera.translate(...offset);

    renderer.resetCameraClippingRange();
    interactor.render();
  };

  //----------------------------------------------------------------------------
  const dolly = (interactor, position) => {
    const renderer = interactor.findPokedRenderer();
    const normalizedPosition = normalize(position, interactor);
    const normalizedPreviousPosition = normalize(
      model.previousPosition,
      interactor
    );

    const delta = {
      x: normalizedPosition.x - normalizedPreviousPosition.x,
      y: normalizedPosition.y - normalizedPreviousPosition.y,
    };

    const camera = renderer.getActiveCamera();
    const cameraPosition = camera.getPosition();

    // 1. Handle dollying
    if (camera.getParallelProjection()) {
      camera.zoom(1 - delta.y);
    } else {
      const offset1 = [];
      vtkMath.subtract(model.downPoint, cameraPosition, offset1);
      vtkMath.multiplyScalar(offset1, delta.y * -4);

      camera.translate(...offset1);
    }

    // 2. Now handle side-to-side panning
    const { rightV: offset2 } = getRightVAndUpV(model.downPoint, interactor);

    vtkMath.multiplyScalar(offset2, delta.x);

    camera.translate(...offset2);

    renderer.resetCameraClippingRange();
    interactor.render();
  };

  //----------------------------------------------------------------------------
  // Public API methods
  //----------------------------------------------------------------------------
  publicAPI.onButtonDown = (interactor, renderer, position) => {
    model.buttonPressed = true;
    model.startPosition = position;
    model.previousPosition = position;
    model.time = Date.now() / 1000.0;
    model.dist = 0;

    // Picking is delegated to the rotate manipulator
    model.rotateManipulator.onButtonDown(interactor, renderer, position);

    model.downPoint = model.rotateManipulator.getDownPoint();
  };

  //----------------------------------------------------------------------------
  publicAPI.onMouseMove = (interactor, renderer, position) => {
    if (!model.buttonPressed) {
      return;
    }

    if (model.rotateManipulator.getState() === States.IS_ROTATE) {
      model.rotateManipulator.onMouseMove(interactor, renderer, position);
    } else {
      switch (model.state) {
        case States.IS_NONE:
          choose(interactor, position);
          break;
        case States.IS_PAN:
          pan(interactor, position);
          break;
        case States.IS_DOLLY:
          dolly(interactor, position);
          break;
        default:
          break;
      }
    }

    model.previousPosition = position;
  };

  //--------------------------------------------------------------------------
  publicAPI.onButtonUp = (interactor) => {
    model.buttonPressed = false;
    if (model.state === States.IS_NONE) {
      model.rotateManipulator.onButtonUp(interactor);
    }
    model.state = States.IS_NONE;
  };

  publicAPI.getUseWorldUpVec = () => model.rotateManipulator.getUseWorldUpVec();
  publicAPI.setUseWorldUpVec = (useWorldUpVec) => {
    model.rotateManipulator.setUseWorldUpVec(useWorldUpVec);
  };
  publicAPI.getWorldUpVec = () => model.rotateManipulator.getWorldUpVec();
  publicAPI.setWorldUpVec = (x, y, z) => {
    model.rotateManipulator.setWorldUpVec(x, y, z);
  };
  publicAPI.getUseHardwareSelector = () =>
    model.rotateManipulator.getUseHardwareSelector();
  publicAPI.setUseHardwareSelector = (useHardwareSelector) => {
    model.rotateManipulator.setUseHardwareSelector(useHardwareSelector);
  };
  publicAPI.getFocusSphereColor = () => {
    model.rotateManipulator.getFocusSphereColor();
  };
  publicAPI.setFocusSphereColor = (r, g, b) => {
    model.rotateManipulator.setFocusSphereColor(r, g, b);
  };
  publicAPI.getFocusSphereRadiusFactor = () =>
    model.rotateManipulator.getFocusSphereRadiusFactor();
  publicAPI.setFocusSphereRadiusFactor = (focusSphereRadiusFactor) => {
    model.rotateManipulator.setFocusSphereRadiusFactor(focusSphereRadiusFactor);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  macro.obj(publicAPI, model);
  vtkCompositeCameraManipulator.extend(publicAPI, model, initialValues);
  vtkCompositeMouseManipulator.extend(publicAPI, model, initialValues);

  // Object specific methods
  vtkMouseCameraUnicamManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkMouseCameraUnicamManipulator'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
