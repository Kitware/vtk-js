import * as macro from '../../../macro';
import Light from '../Light';
import Camera from '../Camera';
import TimerLog from '../../../Common/System/TimerLog';
import { INIT_BOUNDS } from '../../../Common/DataModel/BoundingBox';
import { areBoundsInitialized, uninitializeBounds, radiansFromDegrees } from '../../../Common/Core/Math';
function noOp() {}

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
        if (bounds && areBoundsInitialized(bounds)) {
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
      uninitializeBounds(allBounds);
      vtkDebugMacro('Can\'t compute bounds, no 3D props are visible');
    }

    return allBounds;
  };

  publicAPI.resetCameraClippingRange = (bounds = null) => {
    const boundsToUse = bounds || publicAPI.computeVisiblePropBounds();

    if (!areBoundsInitialized(boundsToUse)) {
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
      publicAPI.expandBounds(boundsToUse, model.activeCamera.getModelTransformMatrix());
    } else {
      position = model.activeCamera.getEyePosition();
      vn = model.activeCamera.getEyePlaneNormal();
      publicAPI.expandBounds(boundsToUse, model.activeCamera.getModelViewTransformMatrix());
    }

    const a = -vn[0];
    const b = -vn[1];
    const c = -vn[2];
    const d = -(a * position[0] + b * position[1] + c * position[2]);

    // Set the max near clipping plane and the min far clipping plane
    const range = [a * bounds[0] + b * bounds[2] + c * bounds[4] + d, 1e-18];

    // Find the closest / farthest bounding box vertex
    for (let k = 0; k < 2; k++) {
      for (let j = 0; j < 2; j++) {
        for (let i = 0; i < 2; i++) {
          const dist = a * bounds[i] + b * bounds[2 + j] + c * bounds[4 + k] + d;
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
      const angle = radiansFromDegrees(model.activeCamera.getViewAngle());
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
  numberOfPropsRendered: 0,
  nearClippingPlaneTolerance: 0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.event(publicAPI, model, 'event');
  macro.get(publicAPI, model, ['timeFactor']);
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
  ]);
  macro.getArray(publicAPI, model, ['actors', 'volumes', 'lights']);
  macro.setGetArray(publicAPI, model, ['background'], 3);

  // Object methods
  renderer(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
