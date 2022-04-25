import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCompositeCameraManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeCameraManipulator';
import vtkCompositeMouseManipulator from 'vtk.js/Sources/Interaction/Manipulators/CompositeMouseManipulator';
import vtkInteractorStyleConstants from 'vtk.js/Sources/Rendering/Core/InteractorStyle/Constants';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPointPicker from 'vtk.js/Sources/Rendering/Core/PointPicker';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';

import { FieldAssociations } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';
import { mat4, vec3 } from 'gl-matrix';
import macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

const { States } = vtkInteractorStyleConstants;

// ----------------------------------------------------------------------------
// vtkMouseCameraUnicamRotateManipulator methods
// ----------------------------------------------------------------------------

function vtkMouseCameraUnicamRotateManipulator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMouseCameraUnicamRotateManipulator');

  // Setup Picker to pick points
  model.picker = vtkPointPicker.newInstance();

  model.downPoint = [0, 0, 0];
  model.isDot = false;
  model.state = States.IS_NONE;

  // Setup focus dot
  const sphereSource = vtkSphereSource.newInstance();
  sphereSource.setThetaResolution(6);
  sphereSource.setPhiResolution(6);
  const sphereMapper = vtkMapper.newInstance();
  sphereMapper.setInputConnection(sphereSource.getOutputPort());

  model.focusSphere = vtkActor.newInstance();
  model.focusSphere.setMapper(sphereMapper);
  model.focusSphere.getProperty().setColor(0.89, 0.66, 0.41);
  model.focusSphere.getProperty().setAmbient(1);
  model.focusSphere.getProperty().setDiffuse(0);
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
    const renderer = interactor.findPokedRenderer();
    const [width, height] = interactor.getView().getViewportSize(renderer);

    const nx = -1.0 + (2.0 * position.x) / width;
    const ny = -1.0 + (2.0 * position.y) / height;

    return { x: nx, y: ny };
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

    const transform = mat4.identity(new Float64Array(16));
    mat4.translate(transform, transform, [cx, cy, cz]);
    mat4.rotate(transform, transform, angle, [ax, ay, az]);
    mat4.translate(transform, transform, [-cx, -cy, -cz]);
    const newCameraPosition = [];
    const newCameraFocalPoint = [];
    vec3.transformMat4(newCameraPosition, cameraPosition, transform);
    vec3.transformMat4(newCameraFocalPoint, cameraFocalPoint, transform);

    mat4.identity(transform);
    mat4.rotate(transform, transform, angle, [ax, ay, az]);
    const newCameraViewUp = [];
    vec3.transformMat4(newCameraViewUp, cameraViewUp, transform);

    camera.setPosition(...newCameraPosition);
    camera.setFocalPoint(...newCameraFocalPoint);
    camera.setViewUp(...newCameraViewUp);
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
    vtkMath.normalize(nop);
    const noe = [oe[0], 0, loe];
    vtkMath.normalize(noe);

    const dot = vtkMath.dot(nop, noe);
    if (Math.abs(dot) > 0.0001) {
      const angle =
        -2 *
        Math.acos(vtkMath.clampValue(dot, -1.0, 1.0)) *
        Math.sign(normalizedPosition.x - normalizedPreviousPosition.x) *
        publicAPI.getRotationFactor();

      const camera = renderer.getActiveCamera();

      const upVec = model.useWorldUpVec ? model.worldUpVec : camera.getViewUp();
      vtkMath.normalize(upVec);

      rotateCamera(camera, ...center, ...upVec, angle);

      const dVec = [];
      const cameraPosition = camera.getPosition();
      vtkMath.subtract(cameraPosition, position, dVec);

      let rDist =
        (normalizedPosition.y - normalizedPreviousPosition.y) *
        publicAPI.getRotationFactor();
      vtkMath.normalize(dVec);

      const atV = camera.getViewPlaneNormal();
      const upV = camera.getViewUp();
      const rightV = [];
      vtkMath.cross(upV, atV, rightV);
      vtkMath.normalize(rightV);

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
  const placeFocusSphere = (interactor) => {
    const renderer = interactor.findPokedRenderer();
    model.focusSphere.setPosition(...model.downPoint);

    const camera = renderer.getActiveCamera();
    const cameraPosition = camera.getPosition();
    const cameraToPointVec = [];

    vtkMath.subtract(model.downPoint, cameraPosition, cameraToPointVec);
    if (camera.getParallelProjection()) {
      vtkMath.multiplyScalar(cameraToPointVec, camera.getParallelScale());
    }

    const atV = camera.getDirectionOfProjection();
    vtkMath.normalize(atV);

    // Scales the focus dot so it always appears the same size
    const scale =
      0.02 * vtkMath.dot(atV, cameraToPointVec) * model.focusSphereRadiusFactor;

    model.focusSphere.setScale(scale, scale, scale);
  };

  const placeAndDisplayFocusSphere = (interactor) => {
    placeFocusSphere(interactor);
    interactor.findPokedRenderer().addActor(model.focusSphere);
    model.isDot = true;
  };

  const hideFocusSphere = (interactor) => {
    interactor.findPokedRenderer().removeActor(model.focusSphere);
    model.isDot = false;
  };

  //----------------------------------------------------------------------------
  const pickWithPointPicker = (interactor, position) => {
    const renderer = interactor.findPokedRenderer();
    model.picker.pick([position.x, position.y, position.z], renderer);
    const pickedPositions = model.picker.getPickedPositions();

    if (pickedPositions.length === 0) {
      return model.picker.getPickPosition();
    }

    const cameraPosition = renderer.getActiveCamera().getPosition();

    pickedPositions.sort(
      (pointA, pointB) =>
        vtkMath.distance2BetweenPoints(pointA, cameraPosition) -
        vtkMath.distance2BetweenPoints(pointB, cameraPosition)
    );

    return pickedPositions[0];
  };

  //----------------------------------------------------------------------------
  const pickPoint = (interactor, position) => {
    const renderer = interactor.findPokedRenderer();
    // Finds the point under the cursor.
    // Note: If no object has been rendered to the pixel (X, Y), then
    // vtkPicker will return a z-value with depth equal
    // to the distance from the camera's position to the focal point.
    // This seems like an arbitrary, but perhaps reasonable, default value.
    let selections = null;
    if (model.useHardwareSelector) {
      const selector = interactor.getView().getSelector();
      selector.setCaptureZValues(true);
      selector.setFieldAssociation(FieldAssociations.FIELD_ASSOCIATION_POINTS);
      selector.attach(interactor.getView(), renderer);

      selector.setArea(position.x, position.y, position.x, position.y);
      selections = selector.select();
    }

    if (selections && selections.length !== 0) {
      // convert Float64Array to regular array
      return Array.from(selections[0].getProperties().worldPosition);
    }
    return pickWithPointPicker(interactor, position);
  };

  //----------------------------------------------------------------------------
  // Public API methods
  //----------------------------------------------------------------------------
  publicAPI.onButtonDown = (interactor, renderer, position) => {
    model.buttonPressed = true;
    model.startPosition = position;
    model.previousPosition = position;

    const normalizedPosition = normalize(position, interactor);
    // borderRatio defines the percentage of the screen size that is considered to be
    // the border of the screen on each side
    const borderRatio = 0.1;
    // If the user is clicking on the perimeter of the screen,
    // then we want to go into rotation mode, and there is no need to determine the downPoint
    if (
      Math.abs(normalizedPosition.x) > 1 - borderRatio ||
      Math.abs(normalizedPosition.y) > 1 - borderRatio
    ) {
      model.state = States.IS_ROTATE;
      placeAndDisplayFocusSphere(interactor);
      return;
    }

    model.downPoint = pickPoint(interactor, position);

    if (model.isDot) {
      model.state = States.IS_ROTATE;
    } else {
      model.state = States.IS_NONE;
      if (model.displayFocusSphereOnButtonDown) {
        placeAndDisplayFocusSphere(interactor);
      }
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.onMouseMove = (interactor, renderer, position) => {
    if (!model.buttonPressed) {
      return;
    }

    model.state = States.IS_ROTATE;
    rotate(interactor, position);

    model.previousPosition = position;
  };

  //--------------------------------------------------------------------------
  publicAPI.onButtonUp = (interactor) => {
    const renderer = interactor.findPokedRenderer();
    model.buttonPressed = false;

    // If rotation without a focus sphere, nothing to do
    if (model.state === States.IS_ROTATE && !model.isDot) {
      return;
    }

    if (model.state === States.IS_ROTATE) {
      hideFocusSphere(interactor);
    } else if (model.state === States.IS_NONE) {
      placeAndDisplayFocusSphere(interactor);
    }

    renderer.resetCameraClippingRange();
    updateAndRender(interactor);
  };

  publicAPI.getFocusSphereColor = () => {
    model.focusSphere.getProperty().getColor();
  };
  publicAPI.setFocusSphereColor = (r, g, b) => {
    model.focusSphere.getProperty().setColor(r, g, b);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  focusSphereRadiusFactor: 1,
  displayFocusSphereOnButtonDown: true,
  useHardwareSelector: true,
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
  macro.setGet(publicAPI, model, [
    'focusSphereRadiusFactor',
    'displayFocusSphereOnButtonDown',
    'useHardwareSelector',
    'useWorldUpVec',
  ]);
  macro.get(publicAPI, model, ['state']);
  macro.getArray(publicAPI, model, ['downPoint'], 3);
  macro.setGetArray(publicAPI, model, ['worldUpVec'], 3);

  // Object specific methods
  vtkMouseCameraUnicamRotateManipulator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkMouseCameraUnicamRotateManipulator'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
