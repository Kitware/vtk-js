import { mat4, vec3 } from 'gl-matrix';

import macro            from 'vtk.js/Sources/macro';
import vtkCamera        from 'vtk.js/Sources/Rendering/Core/Camera';
import vtkLight         from 'vtk.js/Sources/Rendering/Core/Light';
import vtkMath          from 'vtk.js/Sources/Common/Core/Math';
import vtkViewport      from 'vtk.js/Sources/Rendering/Core/Viewport';
import { INIT_BOUNDS }  from 'vtk.js/Sources/Common/DataModel/BoundingBox';

const { vtkDebugMacro, vtkErrorMacro, vtkWarningMacro } = macro;

function notImplemented(method) {
  return () => console.log(`vtkRenderer::${method} - NOT IMPLEMENTED`);
}

// ----------------------------------------------------------------------------
// vtkRenderer methods
// ----------------------------------------------------------------------------

function vtkRenderer(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkRenderer');

  publicAPI.updateCamera = () => {
    if (!model.activeCamera) {
      vtkDebugMacro('No cameras are on, creating one.');
      // the get method will automagically create a camera
      // and reset it since one hasn't been specified yet.
      // If is very unlikely that this can occur - if this
      // renderer is part of a vtkRenderWindow, the camera
      // will already have been created as part of the
      // DoStereoRender() method.
      publicAPI.getActiveCameraAndResetIfCreated();
    }

    // update the viewing transformation
    model.activeCamera.render(publicAPI);

    return true;
  };

  publicAPI.updateLightsGeometryToFollowCamera = () => {
    // only update the light's geometry if this Renderer is tracking
    // this lights.  That allows one renderer to view the lights that
    // another renderer is setting up.
    const camera = publicAPI.getActiveCameraAndResetIfCreated();
    const lightMatrix = camera.getCameraLightTransformMatrix();

    model.lights.forEach((light) => {
      if (light.lightTypeIsSceneLight()) {
        // Do nothing. Don't reset the transform matrix because applications
        // may have set a custom matrix. Only reset the transform matrix in
        // vtkLight::SetLightTypeToSceneLight()
      } else if (light.lightTypeIsHeadLight()) {
        // update position and orientation of light to match camera.
        light.setPosition(camera.getPosition());
        light.setFocalPoint(camera.getFocalPoint());
      } else if (light.lightTypeIsCameraLight()) {
        light.setTransformMatrix(lightMatrix);
      } else {
        vtkErrorMacro('light has unknown light type', light);
      }
    });
  };

  publicAPI.updateLightGeometry = () => {
    if (model.lightFollowCamera) {
      // only update the light's geometry if this Renderer is tracking
      // this lights.  That allows one renderer to view the lights that
      // another renderer is setting up.
      return publicAPI.updateLightsGeometryToFollowCamera();
    }
    return true;
  };

  publicAPI.allocateTime = notImplemented('allocateTime');
  publicAPI.updateGeometry = notImplemented('updateGeometry');

  publicAPI.getVTKWindow = () => model.renderWindow;

  publicAPI.setLayer = (layer) => {
    vtkDebugMacro(publicAPI.getClassName(), publicAPI, 'setting Layer to ', layer);
    if (model.layer !== layer) {
      model.layer = layer;
      publicAPI.modified();
    }
    publicAPI.setPreserveColorBuffer(!!layer);
  };

  publicAPI.setActiveCamera = (camera) => {
    if (model.activeCamera === camera) {
      return false;
    }

    model.activeCamera = camera;
    publicAPI.modified();
    publicAPI.invokeEvent({ type: 'ActiveCameraEvent', camera });
    return true;
  };

  publicAPI.makeCamera = () => {
    const camera = vtkCamera.newInstance();
    publicAPI.invokeEvent({ type: 'CreateCameraEvent', camera });
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

  publicAPI.addActor = publicAPI.addViewProp;
  publicAPI.addVolume = publicAPI.addViewProp;

  publicAPI.removeActor = (actor) => {
    model.actors = model.actors.filter(a => a !== actor);
    publicAPI.removeViewProp(actor);
  };

  publicAPI.removeVolume = (volume) => {
    model.volumes = model.volumes.filter(v => v !== volume);
    publicAPI.removeViewProp(volume);
  };

  publicAPI.addLight = (light) => {
    model.lights = [].concat(model.lights, light);
    publicAPI.modified();
  };

  publicAPI.getActors = () => {
    model.actors = [];
    model.props.forEach((prop) => {
      model.actors = model.actors.concat(prop.getActors());
    });
    return model.actors;
  };

  publicAPI.getVolumes = () => {
    model.volumes = [];
    model.props.forEach((prop) => {
      model.volumes = model.volumes.concat(prop.getVolumes());
    });
    return model.volumes;
  };

  publicAPI.removeLight = (light) => {
    model.lights = model.lights.filter(l => l !== light);
    publicAPI.modified();
  };

  publicAPI.removeAllLights = () => { model.lights = []; };

  // FIXME
  publicAPI.addCuller = notImplemented('addCuller');
  publicAPI.removeCuller = notImplemented('removeCuller');

  publicAPI.setLightCollection = (lights) => {
    model.lights = lights;
    publicAPI.modified();
  };

  publicAPI.makeLight = vtkLight.newInstance;

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

    model.createdLight.setLightTypeToHeadLight();

    // set these values just to have a good default should LightFollowCamera
    // be turned off.
    model.createdLight.setPosition(publicAPI.getActiveCamera().getPosition());
    model.createdLight.setFocalPoint(publicAPI.getActiveCamera().getFocalPoint());
  };

  publicAPI.normalizedDisplayToWorld = (x, y, z) => {
    const vpd = publicAPI.normalizedDisplayToView(x, y, z);

    return publicAPI.viewToWorld(vpd[0], vpd[1], vpd[2]);
  };

  publicAPI.worldToNormalizedDisplay = (x, y, z) => {
    const vpd = publicAPI.worldToView(x, y, z);

    return publicAPI.viewToNormalizedDisplay(vpd[0], vpd[1], vpd[2]);
  };


  publicAPI.viewToWorld = (x, y, z) => {
    if (model.activeCamera === null) {
      vtkErrorMacro('ViewToWorld: no active camera, cannot compute view to world, returning 0,0,0');
      return [0, 0, 0];
    }

    // get the perspective transformation from the active camera
    const matrix = model.activeCamera
      .getCompositeProjectionTransformMatrix(1.0, 0, 1);
//                    publicAPI.getTiledAspectRatio(), 0, 1);

    mat4.invert(matrix, matrix);
    mat4.transpose(matrix, matrix);

    // Transform point to world coordinates
    const result = vec3.fromValues(x, y, z);
    vec3.transformMat4(result, result, matrix);
    return [result[0], result[1], result[2]];
  };

  // Convert world point coordinates to view coordinates.
  publicAPI.worldToView = (x, y, z) => {
    if (model.activeCamera === null) {
      vtkErrorMacro('ViewToWorld: no active camera, cannot compute view to world, returning 0,0,0');
      return [0, 0, 0];
    }

    // get the perspective transformation from the active camera
    const matrix = model.activeCamera
      .getCompositeProjectionTransformMatrix(1.0, 0, 1);
//                    publicAPI.getTiledAspectRatio(), 0, 1);
    mat4.transpose(matrix, matrix);

    const result = vec3.fromValues(x, y, z);
    vec3.transformMat4(result, result, matrix);
    return [result[0], result[1], result[2]];
  };

  publicAPI.computeVisiblePropBounds = () => {
    const allBounds = [].concat(INIT_BOUNDS);
    let nothingVisible = true;

    publicAPI.invokeEvent({ type: 'ComputeVisiblePropBoundsEvent', renderer: publicAPI });

    // loop through all props
    model.props
      .filter(prop => prop.getVisibility() && prop.getUseBounds())
      .forEach((prop) => {
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
    const angle = vtkMath.radiansFromDegrees(model.activeCamera.getViewAngle());
    const parallelScale = radius;
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
      center[0] + (distance * vn[0]),
      center[1] + (distance * vn[1]),
      center[2] + (distance * vn[2]));

    publicAPI.resetCameraClippingRange(boundsToUse);

    // setup default parallel scale
    model.activeCamera.setParallelScale(parallelScale);

    // Here to let parallel/distributed compositing intercept
    // and do the right thing.
    publicAPI.invokeEvent({ type: 'ResetCameraEvent', renderer: publicAPI });

    return true;
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
    vn = model.activeCamera.getViewPlaneNormal();
    position = model.activeCamera.getPosition();

    const a = -vn[0];
    const b = -vn[1];
    const c = -vn[2];
    const d = -((a * position[0]) + (b * position[1]) + (c * position[2]));

    // Set the max near clipping plane and the min far clipping plane
    const range = [(a * boundsToUse[0]) + (b * boundsToUse[2]) + (c * boundsToUse[4]) + d, 1e-18];

    // Find the closest / farthest bounding box vertex
    for (let k = 0; k < 2; k++) {
      for (let j = 0; j < 2; j++) {
        for (let i = 0; i < 2; i++) {
          const dist = (a * boundsToUse[i]) + (b * boundsToUse[2 + j]) + (c * boundsToUse[4 + k]) + d;
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
    range[0] = (0.99 * range[0]) - ((range[1] - range[0]) * model.clippingRangeExpansion);
    range[1] = (1.01 * range[1]) + ((range[1] - range[0]) * model.clippingRangeExpansion);

    // Make sure near is not bigger than far
    range[0] = (range[0] >= range[1]) ? (0.01 * range[1]) : (range[0]);

    // Make sure near is at least some fraction of far - this prevents near
    // from being behind the camera or too close in front. How close is too
    // close depends on the resolution of the depth buffer
    if (!model.nearClippingPlaneTolerance) {
      model.nearClippingPlaneTolerance = 0.01;
    }

    // make sure the front clipping range is not too far from the far clippnig
    // range, this is to make sure that the zbuffer resolution is effectively
    // used
    if (range[0] < model.nearClippingPlaneTolerance * range[1]) {
      range[0] = model.nearClippingPlaneTolerance * range[1];
    }
    model.activeCamera.setClippingRange(range[0], range[1]);

    // Here to let parallel/distributed compositing intercept
    // and do the right thing.
    publicAPI.invokeEvent({ type: 'ResetCameraClippingRangeEvent', renderer: publicAPI });
    return false;
  };

  publicAPI.setRenderWindow = (renderWindow) => {
    if (renderWindow !== model.renderWindow) {
      model.vtkWindow = renderWindow;
      model.renderWindow = renderWindow;
    }
  };

  publicAPI.visibleActorCount = () => model.props.filter(prop => prop.getVisibility()).length;
  publicAPI.visibleVolumeCount = publicAPI.visibleActorCount;

  publicAPI.getMTime = () =>
    Math.max(
      model.mtime,
      model.activeCamera ? model.activeCamera.getMTime() : 0,
      model.createdLight ? model.createdLight.getMTime() : 0);


  // FIXME
  publicAPI.pickProp = notImplemented('pickProp');
  publicAPI.pickRender = notImplemented('PickRender');
  publicAPI.pickGeometry = notImplemented('PickGeometry');

  // ExpandBounds => global

  publicAPI.getTransparent = () => !!model.preserveColorBuffer;

  // FIXME
  publicAPI.getTiledAspectRatio = notImplemented('GetTiledAspectRatio');

  publicAPI.isActiveCameraCreated = () => !!model.activeCamera;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  pickedProp: null,
  activeCamera: null,

  ambient: [1, 1, 1],

  allocatedRenderTime: 100,
  timeFactor: 1,

  createdLight: null,
  automaticLightCreation: true,

  twoSidedLighting: true,
  lastRenderTimeInSeconds: -1,

  renderWindow: null,
  lights: [],
  actors: [],
  volumes: [],

  lightFollowCamera: true,

  numberOfPropsRendered: 0,

  propArray: null,

  pathArray: null,

  layer: 1,
  preserveColorBuffer: false,
  preserveDepthBuffer: false,

  computeVisiblePropBounds: vtkMath.createUninitializedBouds(),

  interactive: true,

  nearClippingPlaneTolerance: 0,
  clippingRangeExpansion: 0.05,

  erase: true,
  draw: true,

  useShadows: false,

  useDepthPeeling: false,
  occlusionRatio: 0,
  maximumNumberOfPeels: 4,

  selector: null,
  delegate: null,

  texturedBackground: false,
  backgroundTexture: null,

  pass: 0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewport.extend(publicAPI, model, initialValues);

  // Build VTK API
  macro.get(publicAPI, model, [
    'renderWindow',

    'allocatedRenderTime',
    'timeFactor',

    'lastRenderTimeInSeconds',
    'numberOfPropsRendered',
    'lastRenderingUsedDepthPeeling',

    'selector',
  ]);
  macro.setGet(publicAPI, model, [
    'twoSidedLighting',
    'lightFollowCamera',
    'automaticLightCreation',
    'erase',
    'draw',
    'nearClippingPlaneTolerance',
    'clippingRangeExpansion',
    'backingStore',
    'interactive',
    'layer',
    'preserveColorBuffer',
    'preserveDepthBuffer',
    'useDepthPeeling',
    'occlusionRatio',
    'maximumNumberOfPeels',
    'delegate',
    'backgroundTexture',
    'texturedBackground',
    'useShadows',
    'pass',
  ]);
  macro.getArray(publicAPI, model, ['actors', 'volumes', 'lights']);
  macro.setGetArray(publicAPI, model, ['background'], 3);

  // Object methods
  vtkRenderer(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkRenderer');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
