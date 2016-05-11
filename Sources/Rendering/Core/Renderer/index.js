import * as macro from '../../../macro';
import * as vtkMath from '../../../Common/Core/Math';
import Camera from '../Camera';
import Light from '../Light';
import TimerLog from '../../../Common/System/TimerLog';
import { INIT_BOUNDS } from '../../../Common/DataModel/BoundingBox';
import { vec4 } from 'gl-matrix';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

function noOp() {}

function expandBounds(bounds, matrix) {
  if (!bounds) {
    vtkErrorMacro('ERROR: Invalid bounds');
    return;
  }

  if (!matrix) {
    vtkErrorMacro('ERROR: Invalid matrix');
    return;
  }

  // Expand the bounding box by model view transform matrix.
  const pt = [
    vec4.fromValues(bounds[0], bounds[2], bounds[5], 1.0),
    vec4.fromValues(bounds[1], bounds[2], bounds[5], 1.0),
    vec4.fromValues(bounds[1], bounds[2], bounds[4], 1.0),
    vec4.fromValues(bounds[0], bounds[2], bounds[4], 1.0),
    vec4.fromValues(bounds[0], bounds[3], bounds[5], 1.0),
    vec4.fromValues(bounds[1], bounds[3], bounds[5], 1.0),
    vec4.fromValues(bounds[1], bounds[3], bounds[4], 1.0),
    vec4.fromValues(bounds[0], bounds[3], bounds[4], 1.0),
  ];

  // \note: Assuming that matrix does not have projective component. Hence not
  // dividing by the homogeneous coordinate after multiplication
  for (let i = 0; i < 8; ++i) {
    vec4.transformMat4(pt[i], pt[i], matrix);
  }

  // min = mpx = pt[0]
  const min = [];
  const max = [];
  for (let i = 0; i < 4; ++i) {
    min[i] = pt[0][i];
    max[i] = pt[0][i];
  }

  for (let i = 1; i < 8; ++i) {
    for (let j = 0; j < 3; ++j) {
      if (min[j] > pt[i][j]) {
        min[j] = pt[i][j];
      }
      if (max[j] < pt[i][j]) {
        max[j] = pt[i][j];
      }
    }
  }

  // Copy values back to bounds.
  bounds[0] = min[0];
  bounds[2] = min[1];
  bounds[4] = min[2];

  bounds[1] = max[0];
  bounds[3] = max[1];
  bounds[5] = max[2];
}

// ----------------------------------------------------------------------------
// vtkRenderer methods
// ----------------------------------------------------------------------------

function renderer(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkRenderer');

  publicAPI.addActor = actor => {
    model.actors = [].concat(model.actors, actor);
    publicAPI.modified();
  };

  publicAPI.removeActor = actor => {
    model.actors = model.actors.filter(a => a !== actor);
    publicAPI.modified();
  };

  publicAPI.addVolume = volume => {
    model.volumes = [].concat(model.volumes, volume);
    publicAPI.modified();
  };

  publicAPI.removeVolume = volume => {
    model.volumes = model.volumes.filter(v => v !== volume);
    publicAPI.modified();
  };

  publicAPI.addLight = light => {
    model.lights = [].concat(model.lights, light);
    publicAPI.modified();
  };

  publicAPI.removeLight = light => {
    model.lights = model.lights.filter(l => l !== light);
    publicAPI.modified();
  };

  publicAPI.removeAllLights = () => { model.lights = []; };

  publicAPI.createLight = () => {
    if (!model.automaticLightCreation) {
      return;
    }

    if (model.createdLight) {
      publicAPI.removeLight(model.createdLight);
      model.createdLight.delete();
      model.createdLight = null;
    }

    model.createdLight = publicAPI.makeLight();
    publicAPI.addLight(model.createdLight);

    model.createdLight.setLightTypeToHeadlight();

    // set these values just to have a good default should LightFollowCamera
    // be turned off.
    model.createdLight.setPosition(publicAPI.getActiveCamera().getPosition());
    model.createdLight.setFocalPoint(publicAPI.getActiveCamera().getFocalPoint());
  };

  publicAPI.makeLight = Light.newInstance;

  publicAPI.setRenderWindow = renderWindow => {
    model.renderWindow = renderWindow;
    renderWindow.addRenderer(publicAPI);
  };

  publicAPI.isActiveCameraCreated = () => !!model.activeCamera;

  publicAPI.updateLightsGeometryToFollowCamera = () => {
    // only update the light's geometry if this Renderer is tracking
    // this lights.  That allows one renderer to view the lights that
    // another renderer is setting up.
    const camera = publicAPI.getActiveCameraAndResetIfCreated();
    const lightMatrix = camera.getCameraLightTransformMatrix();

    model.lights.forEach(light => {
      if (light.lightTypeIsSceneLight()) {
        // Do nothing. Don't reset the transform matrix because applications
        // may have set a custom matrix. Only reset the transform matrix in
        // vtkLight::SetLightTypeToSceneLight()
      } else if (light.lightTypeIsHeadlight()) {
        // update position and orientation of light to match camera.
        light.setPosition(camera.getPosition());
        light.setFocalPoint(camera.getFocalPoint());
      } else if (light.lightTypeIsCameraLight()) {
        light.setTransformMatrix(lightMatrix);
      } else {
        console.log('light has unknown light type', light);
      }
    });
  };

  publicAPI.makeCamera = () => {
    const camera = Camera.newInstance();
    publicAPI.fireEvent({ type: 'CreateCameraEvent', camera });
    return camera;
  };

  // Replace the set/get macro method
  publicAPI.getActiveCamera = () => {
    if (!model.activeCamera) {
      model.activeCamera = publicAPI.makeCamera();
    }

    return model.activeCamera;
  };

  publicAPI.getActiveCameraAndResetIfCreated = () => {
    if (!model.activeCamera) {
      publicAPI.getActiveCamera();
      publicAPI.resetCamera();
    }

    return model.activeCamera;
  };

  publicAPI.getTimeFactor = () => {
    console.log('vtkRenderer::getTimeFactor() - NOT IMPLEMENTED');
  };

  publicAPI.render = () => {
    if (model.delegate && model.delegate.getUsed()) {
      model.delegate.render(publicAPI);
      return;
    }

    // If Draw is not on, ignore the render.
    if (!model.draw) {
      vtkDebugMacro('Ignoring render because Draw is off.');
      return;
    }

    const t1 = TimerLog.getUniversalTime();
    publicAPI.fireEvent({ type: 'StartEvent' });

    // Create the initial list of visible props
    // This will be passed through AllocateTime(), where
    // a time is allocated for each prop, and the list
    // maybe re-ordered by the cullers. Also create the
    // sublists for the props that need ray casting, and
    // the props that need to be rendered into an image.
    // Fill these in later (in AllocateTime) - get a
    // count of them there too
    if (model.props.length > 0) {
      model.propArray = model.props.filter(prop => prop.getVisibility());
    }

    if (model.propArray.length === 0) {
      vtkDebugMacro('There are no visible props!');
    } else {
      // Call all the culling methods to set allocated time
      // for each prop and re-order the prop list if desired
      publicAPI.allocateTime();
    }

    // do the render library specific stuff
    publicAPI.deviceRender();

    // If we aborted, restore old estimated times
    // Setting the allocated render time to zero also sets the
    // estimated render time to zero, so that when we add back
    // in the old value we have set it correctly.
    if (model.renderWindow.getAbortRender()) {
      model.propArray.restoreEstimatedRenderTime();
    }

    // Clean up the space we allocated before. If the PropArray exists,
    // they all should exist
    model.propArray = null;

    // If we aborted, do not record the last render time.
    // Lets play around with determining the accuracy of the
    // EstimatedRenderTimes.  We can try to adjust for bad
    // estimates with the TimeFactor.
    if (!model.renderWindow.getAbortRender()) {
      // Measure the actual RenderTime
      model.lastRenderTimeInSeconds = (TimerLog.getUniversalTime() - t1) / 1000;

      if (model.lastRenderTimeInSeconds === 0.0) {
        model.lastRenderTimeInSeconds = 0.0001;
      }

      model.timeFactor = model.allocatedRenderTime / model.lastRenderTimeInSeconds;
    }

    publicAPI.fireEvent({ type: 'EndEvent' });
  };

  // NoOp: Should be overriden
  publicAPI.deviceRender = noOp;

  publicAPI.deviceRenderTranslucentPolygonalGeometry = () => {
    model.lastRenderingUsedDepthPeeling = false;
    publicAPI.updateTranslucentPolygonalGeometry();
  };

  // -------- PROTECTED API ----------
  /* eslint-disable no-underscore-dangle */
  publicAPI.__updateTranslucentPolygonalGeometry = () => {
    let result = 0;

    // loop through props and give them a chance to
    // render themselves as translucent geometry
    model.propArray.forEach(prop => {
      const rendered = prop.renderTranslucentPolygonalGeometry(publicAPI);
      model.numberOfPropsRendered += rendered;
      result += rendered;
    });

    return result;
  };
  /* eslint-enable no-underscore-dangle */

  publicAPI.clearLights = noOp;
  publicAPI.clear = noOp;

  publicAPI.visibleActorCount = () => model.props.filter(prop => prop.getVisibility()).length;
  publicAPI.visibleVolumeCount = publicAPI.visibleActorCount;

  publicAPI.computeVisiblePropBounds = () => {
    const allBounds = [].concat(INIT_BOUNDS);
    let nothingVisible = true;

    publicAPI.fireEvent({ type: 'ComputeVisiblePropBoundsEvent', renderer: publicAPI });

    // loop through all props
    model.props
      .filter(prop => prop.getVisibility() && prop.getUseBounds())
      .forEach(prop => {
        const bounds = prop.getBounds();
        if (bounds && vtkMath.areBoundsInitialized(bounds)) {
          nothingVisible = false;

          if (bounds[0] < allBounds[0]) {
            allBounds[0] = bounds[0];
          }
          if (bounds[1] > allBounds[1]) {
            allBounds[1] = bounds[1];
          }
          if (bounds[2] < allBounds[2]) {
            allBounds[2] = bounds[2];
          }
          if (bounds[3] > allBounds[3]) {
            allBounds[3] = bounds[3];
          }
          if (bounds[4] < allBounds[4]) {
            allBounds[4] = bounds[4];
          }
          if (bounds[5] > allBounds[5]) {
            allBounds[5] = bounds[5];
          }
        }
      });

    if (nothingVisible) {
      vtkMath.uninitializeBounds(allBounds);
      vtkDebugMacro('Can\'t compute bounds, no 3D props are visible');
    }

    return allBounds;
  };

  publicAPI.resetCameraClippingRange = (bounds = null) => {
    const boundsToUse = bounds || publicAPI.computeVisiblePropBounds();

    if (!vtkMath.areBoundsInitialized(boundsToUse)) {
      vtkDebugMacro('Cannot reset camera clipping range!');
      return false;
    }

    // Make sure we have an active camera
    publicAPI.getActiveCameraAndResetIfCreated();
    if (!model.activeCamera) {
      vtkErrorMacro('Trying to reset clipping range of non-existant camera');
      return false;
    }

    let vn = null; let position = null;
    if (!model.activeCamera.getUseOffAxisProjection()) {
      vn = model.activeCamera.getViewPlaneNormal();
      position = model.activeCamera.getPosition();
      expandBounds(boundsToUse, model.activeCamera.getModelTransformMatrix());
    } else {
      position = model.activeCamera.getEyePosition();
      vn = model.activeCamera.getEyePlaneNormal();
      expandBounds(boundsToUse, model.activeCamera.getModelViewTransformMatrix());
    }

    const a = -vn[0];
    const b = -vn[1];
    const c = -vn[2];
    const d = -(a * position[0] + b * position[1] + c * position[2]);

    // Set the max near clipping plane and the min far clipping plane
    const range = [a * boundsToUse[0] + b * boundsToUse[2] + c * boundsToUse[4] + d, 1e-18];

    // Find the closest / farthest bounding box vertex
    for (let k = 0; k < 2; k++) {
      for (let j = 0; j < 2; j++) {
        for (let i = 0; i < 2; i++) {
          const dist = a * boundsToUse[i] + b * boundsToUse[2 + j] + c * boundsToUse[4 + k] + d;
          range[0] = (dist < range[0]) ? (dist) : (range[0]);
          range[1] = (dist > range[1]) ? (dist) : (range[1]);
        }
      }
    }

    // do not let far - near be less than 0.1 of the window height
    // this is for cases such as 2D images which may have zero range
    let minGap = 0.0;
    if (model.activeCamera.getParallelProjection()) {
      minGap = 0.1 * model.activeCamera.getParallelScale();
    } else {
      const angle = vtkMath.radiansFromDegrees(model.activeCamera.getViewAngle());
      minGap = 0.2 * Math.tan(angle / 2.0) * range[1];
    }

    if (range[1] - range[0] < minGap) {
      minGap = minGap - range[1] + range[0];
      range[1] += minGap / 2.0;
      range[0] -= minGap / 2.0;
    }

    // Do not let the range behind the camera throw off the calculation.
    if (range[0] < 0.0) {
      range[0] = 0.0;
    }

    // Give ourselves a little breathing room
    range[0] = 0.99 * range[0] - (range[1] - range[0]) * model.clippingRangeExpansion;
    range[1] = 1.01 * range[1] + (range[1] - range[0]) * model.clippingRangeExpansion;

    // Make sure near is not bigger than far
    range[0] = (range[0] >= range[1]) ? (0.01 * range[1]) : (range[0]);

    // Make sure near is at least some fraction of far - this prevents near
    // from being behind the camera or too close in front. How close is too
    // close depends on the resolution of the depth buffer
    if (!model.nearClippingPlaneTolerance) {
      model.nearClippingPlaneTolerance = 0.01;
      if (model.renderWindow) {
        const ZBufferDepth = model.renderWindow.getDepthBufferSize();
        if (ZBufferDepth > 16) {
          model.nearClippingPlaneTolerance = 0.001;
        }
      }
    }

    // make sure the front clipping range is not too far from the far clippnig
    // range, this is to make sure that the zbuffer resolution is effectively
    // used
    if (range[0] < model.nearClippingPlaneTolerance * range[1]) {
      range[0] = model.nearClippingPlaneTolerance * range[1];
    }
    model.activeCamera.setClippingRange(range);

    // Here to let parallel/distributed compositing intercept
    // and do the right thing.
    publicAPI.fireEvent({ type: 'ResetCameraClippingRangeEvent', renderer: publicAPI });
    return false;
  };

  publicAPI.resetCamera = (bounds = null) => {
    const boundsToUse = bounds || publicAPI.computeVisiblePropBounds();
    const center = [0, 0, 0];

    if (!vtkMath.areBoundsInitialized(boundsToUse)) {
      vtkDebugMacro('Cannot reset camera!');
      return false;
    }

    let vn = null;

    if (publicAPI.getActiveCamera()) {
      vn = model.activeCamera.getViewPlaneNormal();
    } else {
      vtkErrorMacro('Trying to reset non-existant camera');
      return false;
    }

    // Reset the perspective zoom factors, otherwise subsequent zooms will cause
    // the view angle to become very small and cause bad depth sorting.
    model.activeCamera.setViewAngle(30.0);

    expandBounds(boundsToUse, model.activeCamera.getModelTransformMatrix());

    center[0] = (boundsToUse[0] + boundsToUse[1]) / 2.0;
    center[1] = (boundsToUse[2] + boundsToUse[3]) / 2.0;
    center[2] = (boundsToUse[4] + boundsToUse[5]) / 2.0;

    let w1 = boundsToUse[1] - boundsToUse[0];
    let w2 = boundsToUse[3] - boundsToUse[2];
    let w3 = boundsToUse[5] - boundsToUse[4];
    w1 *= w1;
    w2 *= w2;
    w3 *= w3;
    let radius = w1 + w2 + w3;

    // If we have just a single point, pick a radius of 1.0
    radius = (radius === 0) ? (1.0) : (radius);

    // compute the radius of the enclosing sphere
    radius = Math.sqrt(radius) * 0.5;

    // default so that the bounding sphere fits within the view fustrum

    // compute the distance from the intersection of the view frustum with the
    // bounding sphere. Basically in 2D draw a circle representing the bounding
    // sphere in 2D then draw a horizontal line going out from the center of
    // the circle. That is the camera view. Then draw a line from the camera
    // position to the point where it intersects the circle. (it will be tangent
    // to the circle at this point, this is important, only go to the tangent
    // point, do not draw all the way to the view plane). Then draw the radius
    // from the tangent point to the center of the circle. You will note that
    // this forms a right triangle with one side being the radius, another being
    // the target distance for the camera, then just find the target dist using
    // a sin.
    let angle = vtkMath.radiansFromDegrees(model.activeCamera.getViewAngle());
    let parallelScale = radius;

    publicAPI.computeAspect();
    const aspect = publicAPI.getAspect();

    if (aspect[0] >= 1.0) {
      // horizontal window, deal with vertical angle|scale
      if (model.activeCamera.getUseHorizontalViewAngle()) {
        angle = 2.0 * Math.atan(Math.tan(angle * 0.5) / aspect[0]);
      }
    } else {
      // vertical window, deal with horizontal angle|scale
      if (!model.activeCamera.getUseHorizontalViewAngle()) {
        angle = 2.0 * Math.atan(Math.tan(angle * 0.5) * aspect[0]);
      }
      parallelScale = parallelScale / aspect[0];
    }

    const distance = radius / Math.sin(angle * 0.5);

    // check view-up vector against view plane normal
    const vup = model.activeCamera.getViewUp();
    if (Math.abs(vtkMath.dot(vup, vn)) > 0.999) {
      vtkWarningMacro('Resetting view-up since view plane normal is parallel');
      model.activeCamera.setViewUp(-vup[2], vup[0], vup[1]);
    }

    // update the camera
    model.activeCamera.setFocalPoint(center[0], center[1], center[2]);
    model.activeCamera.setPosition(
      center[0] + distance * vn[0],
      center[1] + distance * vn[1],
      center[2] + distance * vn[2]);

    publicAPI.resetCameraClippingRange(boundsToUse);

    // setup default parallel scale
    model.activeCamera.setParallelScale(parallelScale);

    // Here to let parallel/distributed compositing intercept
    // and do the right thing.
    publicAPI.fireEvent({ type: 'ResetCameraEvent', renderer: publicAPI });

    return true;
  };

  publicAPI.transparent = () => !!model.preserveColorBuffer;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  actors: [],
  volumes: [],
  light: [],
  twoSidedLighting: true,
  lightFollowCamera: true,
  renderWindow: null,
  activeCamera: null, // FIXME create one by default
  erase: true,
  draw: true,
  interactive: false,
  layer: 1,
  preserveColorBuffer: false,
  preserveDepthBuffer: false,
  useDepthPeeling: false,
  occlusionRatio: 0,
  maximumNumberOfPeels: 4,
  useShadows: false,
  background: [0.2, 0.3, 0.4],
  transparent: false,
  automaticLightCreation: true,
  createdLight: null,
  allocatedRenderTime: 100,
  timeFactor: 1,
  delegate: null,
  lastRenderTimeInSeconds: 0.001,
  numberOfPropsRendered: 0,
  nearClippingPlaneTolerance: 0,
  clippingRangeExpansion: 0.5,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.event(publicAPI, model, 'event');
  macro.get(publicAPI, model, ['timeFactor', 'numberOfPropsRendered', 'lastRenderTimeInSeconds']);
  macro.setGet(publicAPI, model, [
    'twoSidedLighting',
    'lightFollowCamera',
    'activeCamera',
    'erase',
    'draw',
    'layer',
    'interactive',
    'renderWindow',
    'preserveColorBuffer',
    'preserveDepthBuffer',
    'useDepthPeeling',
    'occlusionRatio',
    'maximumNumberOfPeels',
    'useShadows',
    'transparent',
    'allocatedRenderTime',
    'delegate',
    'nearClippingPlaneTolerance',
    'clippingRangeExpansion',
  ]);
  macro.getArray(publicAPI, model, ['actors', 'volumes', 'lights']);
  macro.setGetArray(publicAPI, model, ['background'], 3);

  // Similar returned value
  publicAPI.getVTKWindow = publicAPI.getRenderWindow;

  // Object methods
  renderer(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
