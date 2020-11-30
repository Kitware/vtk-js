import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCompositeCameraManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeCameraManipulator';
import vtkCompositeMouseManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeMouseManipulator';
import vtkInteractorStyleConstants from 'vtk.js/Sources/Rendering/Core/InteractorStyle/Constants';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkOpenGLHardwareSelector from 'vtk.js/Sources/Rendering/OpenGL/HardwareSelector';
import vtkPicker from 'vtk.js/Sources/Rendering/Core/Picker';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';

import { FieldAssociations } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';
import { mat4, vec3 } from 'gl-matrix';
import macro from 'vtk.js/Sources/macro';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

const { States } = vtkInteractorStyleConstants;

// ----------------------------------------------------------------------------
// vtkMouseCameraUnicamManipulator methods
// ----------------------------------------------------------------------------

function vtkMouseCameraUnicamManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMouseCameraUnicamManipulator');

  // Setup HardwareSelector and Picker to pick points
  model.selector = vtkOpenGLHardwareSelector.newInstance({
    captureZValues: true,
  });
  model.selector.setFieldAssociation(
    FieldAssociations.FIELD_ASSOCIATION_POINTS
  );
  model.picker = vtkPicker.newInstance();

  model.isDot = false;
  model.state = States.IS_NONE;

  // Setup focus dot
  const sphereSource = vtkSphereSource.newInstance();
  sphereSource.setThetaResolution(6);
  sphereSource.setPhiResolution(6);
  const sphereMapper = vtkMapper.newInstance();
  sphereMapper.setInputConnection(sphereSource.getOutputPort());

  // XXX - Would like to make the focus sphere not be affected by
  // XXX - the lights-- i.e., always be easily easily seen.  i'm not sure
  // XXX - how to do that.
  model.focusSphere = vtkActor.newInstance();
  model.focusSphere.setMapper(sphereMapper);
  model.focusSphere.getProperty().setColor(0.89, 0.66, 0.41);
  model.focusSphere.getProperty().setRepresentationToWireframe();

  //----------------------------------------------------------------------------
  const updateAndRender = (interactor) => {
    if (!interactor) {
      return;
    }

    if (model.useWorldUpVec) {
      const camera = interactor.findPokedRenderer().getActiveCamera();
      if (!vtkMath.areEquals(model.worldUpVec, camera.getViewPlaneNormal())) {
        camera.setViewUp(model.worldUpVec);
      }
    }
    interactor.render();
  };

  //----------------------------------------------------------------------------
  const normalize = (position, interactor) => {
    const [width, height] = interactor.getView().getSize();

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
    vtkMath.normalize(atV, interactor);
    const l = vtkMath.dot(cameraToPointVec, atV);
    const viewAngle = vtkMath.radiansFromDegrees(camera.getViewAngle());
    const [width, height] = interactor.getView().getSize();

    const scaleX = (width / height) * ((2 * l * Math.tan(viewAngle / 2)) / 2);
    const scaleY = (2 * l * Math.tan(viewAngle / 2)) / 2;

    // Construct the camera offset vector as function of delta mouse X & Y.
    const upV = camera.getViewUp();
    const rightV = [];
    vtkMath.cross(upV, atV, rightV);
    // (Make sure 'upV' is orthogonal to 'atV' & 'rightV')
    vtkMath.cross(atV, rightV, upV);
    vtkMath.normalize(rightV, interactor);
    vtkMath.normalize(upV, interactor);

    vtkMath.multiplyScalar(rightV, scaleX);
    vtkMath.multiplyScalar(upV, scaleY);

    return { rightV, upV };
  };

  //----------------------------------------------------------------------------
  // Rotate the camera by 'angle' degrees about the point <cx, cy, cz>
  // and around the vector/axis <ax, ay, az>.
  const rotateCamera = (camera, cx, cy, cz, ax, ay, az, angle) => {
    const cameraPosition = camera.getPosition();
    const cameraFocalPoint = camera.getFocalPoint();
    const cameraViewUp = camera.getViewUp();

    cameraPosition[3] = 1.0;
    cameraFocalPoint[3] = 1.0;
    cameraViewUp[3] = 0.0;

    const transform = mat4.create();
    mat4.identity(transform);
    mat4.translate(transform, transform, vec3.fromValues(cx, cy, cz));
    mat4.rotate(transform, transform, angle, vec3.fromValues(ax, ay, az));
    mat4.translate(transform, transform, vec3.fromValues(-cx, -cy, -cz));
    const newCameraPosition = [];
    const newCameraFocalPoint = [];
    vec3.transformMat4(newCameraPosition, cameraPosition, transform);
    vec3.transformMat4(newCameraFocalPoint, cameraFocalPoint, transform);

    mat4.identity(transform);
    mat4.rotate(transform, transform, angle, vec3.fromValues(ax, ay, az));
    const newCameraViewUp = [];
    vec3.transformMat4(newCameraViewUp, cameraViewUp, transform);

    camera.setPosition(...newCameraPosition);
    camera.setFocalPoint(...newCameraFocalPoint);
    camera.setViewUp(...newCameraViewUp);
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
  const rotate = (interactor, position) => {
    const renderer = interactor.findPokedRenderer();
    const normalizedPosition = normalize(position, interactor);
    const normalizedPreviousPosition = normalize(
      model.previousPosition,
      interactor
    );

    const center = model.focusSphere.getPosition();
    let normalizedCenter = interactor
      .getView()
      .worldToDisplay(...center, renderer);
    // let normalizedCenter = publicAPI.computeWorldToDisplay(renderer, ...center);
    normalizedCenter = normalize({ x: center[0], y: center[1] }, interactor);
    normalizedCenter = [normalizedCenter.x, normalizedCenter.y, center[2]];

    // Squared rad of virtual cylinder
    const radsq = (1.0 + Math.abs(normalizedCenter[0])) ** 2.0;
    const op = [normalizedPreviousPosition.x, 0, 0];
    const oe = [normalizedPosition.x, 0, 0];

    const opsq = op[0] ** 2;
    const oesq = oe[0] ** 2;

    const lop = opsq > radsq ? 0 : Math.sqrt(radsq - opsq);
    const loe = oesq > radsq ? 0 : Math.sqrt(radsq - oesq);

    const nop = [op[0], 0, lop];
    vtkMath.normalize(nop, interactor);
    const noe = [oe[0], 0, loe];
    vtkMath.normalize(noe, interactor);

    const dot = vtkMath.dot(nop, noe);
    if (Math.abs(dot) > 0.0001) {
      const angle =
        -2 *
        Math.acos(vtkMath.clampValue(dot, -1.0, 1.0)) *
        Math.sign(normalizedPosition.x - normalizedPreviousPosition.x) *
        publicAPI.getRotationFactor();

      const camera = renderer.getActiveCamera();

      const upVec = model.useWorldUpVec ? model.worldUpVec : camera.getViewUp();
      vtkMath.normalize(upVec, interactor);

      rotateCamera(camera, ...center, ...upVec, angle);

      const dVec = [];
      const cameraPosition = camera.getPosition();
      vtkMath.subtract(cameraPosition, position, dVec);

      let rDist =
        (normalizedPosition.y - normalizedPreviousPosition.y) *
        publicAPI.getRotationFactor();
      vtkMath.normalize(dVec, interactor);

      const atV = camera.getViewPlaneNormal();
      const upV = camera.getViewUp();
      const rightV = [];
      vtkMath.cross(upV, atV, rightV);
      vtkMath.normalize(rightV, interactor);

      //
      // The following two tests try to prevent chaotic camera movement
      // that results from rotating over the poles defined by the
      // "WorldUpVector".  The problem is the constraint to keep the
      // camera's up vector in line w/ the WorldUpVector is at odds with
      // the action of rotating over the top of the virtual sphere used
      // for rotation.  The solution here is to prevent the user from
      // rotating the last bit required to "go over the top"-- as a
      // consequence, you can never look directly down on the poles.
      //
      // The "0.99" value is somewhat arbitrary, but seems to produce
      // reasonable results.  (Theoretically, some sort of clamping
      // function could probably be used rather than a hard cutoff, but
      // time constraints prevent figuring that out right now.)
      //
      if (model.useWorldUpVec) {
        const OVER_THE_TOP_THRESHOLD = 0.99;
        if (vtkMath.dot(upVec, atV) > OVER_THE_TOP_THRESHOLD && rDist < 0) {
          rDist = 0;
        }
        if (vtkMath.dot(upVec, atV) < -OVER_THE_TOP_THRESHOLD && rDist > 0) {
          rDist = 0;
        }
      }

      rotateCamera(camera, ...center, ...rightV, rDist);

      if (
        model.useWorldUpVec &&
        !vtkMath.areEquals(upVec, camera.getViewPlaneNormal())
      ) {
        camera.setViewUp(...upVec);
      }

      model.previousPosition = position;

      renderer.resetCameraClippingRange();
      updateAndRender(interactor);
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
    updateAndRender(interactor);
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
    updateAndRender(interactor);
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

    // Finds the point under the cursor.
    // Note: If no object has been rendered to the pixel (X, Y), then
    // vtkPicker will return a z-value with depth equal
    // to the distance from the camera's position to the focal point.
    // This seems like an arbitrary, but perhaps reasonable, default value.
    model.selector.attach(interactor.getView(), renderer);

    model.selector.setArea(position.x, position.y, position.x, position.y);

    const selections = model.selector.select();
    if (selections && selections.length !== 0) {
      model.downPoint = selections[0].getProperties().worldPosition;
    } else {
      model.picker.pick([position.x, position.y, position.z], renderer);
      model.downPoint = model.picker.getPickPosition();
    }

    const normalizedPosition = normalize(position, interactor);
    // borderRatio defines the percentage of the screen size that is considered to be
    // the border of the screen on each side
    const borderRatio = 0.1;
    // If someone has already clicked to make a dot and they're not clicking
    // on it now, OR if the user is clicking on the perimeter of the screen,
    // then we want to go into rotation mode.
    if (
      Math.abs(normalizedPosition.x) > 1 - borderRatio ||
      Math.abs(normalizedPosition.y) > 1 - borderRatio ||
      model.isDot
    ) {
      model.state = States.IS_ROTATE;
    } else {
      model.state = States.IS_NONE;
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.onMouseMove = (interactor, renderer, position) => {
    if (!model.buttonPressed) {
      return;
    }

    switch (model.state) {
      case States.IS_NONE:
        choose(interactor, position);
        // publicAPI.invokeInteractionEvent({ type: 'InteractionEvent' });
        break;
      case States.IS_ROTATE:
        rotate(interactor, position);
        // publicAPI.invokeInteractionEvent({ type: 'InteractionEvent' });
        break;
      case States.IS_PAN:
        pan(interactor, position);
        // publicAPI.invokeInteractionEvent({ type: 'InteractionEvent' });
        break;
      case States.IS_DOLLY:
        dolly(interactor, position);
        // publicAPI.invokeInteractionEvent({ type: 'InteractionEvent' });
        break;
      default:
        break;
    }

    model.previousPosition = position;
  };

  //--------------------------------------------------------------------------
  publicAPI.onButtonUp = (interactor) => {
    const renderer = interactor.findPokedRenderer();
    model.buttonPressed = false;

    if (model.state === States.IS_ROTATE && model.isDot) {
      renderer.removeActor(model.focusSphere);
      model.isDot = false;
    } else if (model.state === States.IS_NONE) {
      if (model.isDot) {
        renderer.removeActor(model.focusSphere);
        model.isDot = false;
      } else {
        model.focusSphere.setPosition(...model.downPoint);

        const camera = renderer.getActiveCamera();
        const cameraPosition = camera.getPosition();
        const cameraToPointVec = [];

        vtkMath.subtract(model.downPoint, cameraPosition, cameraToPointVec);
        if (camera.getParallelProjection()) {
          vtkMath.multiplyScalar(cameraToPointVec, camera.getParallelScale());
        }

        const atV = camera.getDirectionOfProjection();
        vtkMath.normalize(atV, interactor);

        // Scales the focus dot so it always appears the same size
        const scale = 0.02 * vtkMath.dot(atV, cameraToPointVec);

        model.focusSphere.setScale(scale, scale, scale);

        renderer.addActor(model.focusSphere);

        model.isDot = true;
      }
    }

    renderer.resetCameraClippingRange();
    updateAndRender(interactor);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  useWorldUpVec: true,
  // set WorldUpVector to be z-axis by default
  worldUpVec: [0, 0, 1],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  macro.obj(publicAPI, model);
  vtkCompositeCameraManipulator.extend(publicAPI, model, initialValues);
  vtkCompositeMouseManipulator.extend(publicAPI, model, initialValues);

  // Create get-set macros
  macro.setGet(publicAPI, model, ['useWorldUpVec']);
  macro.setGetArray(publicAPI, model, ['worldUpVec'], 3);

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
