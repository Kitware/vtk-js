import { mat4, vec3 } from 'gl-matrix';

import * as macro from 'vtk.js/Sources/macros';
import vtkCamera from 'vtk.js/Sources/Rendering/Core/Camera';
import vtkLight from 'vtk.js/Sources/Rendering/Core/Light';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkViewport from 'vtk.js/Sources/Rendering/Core/Viewport';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';

const { vtkDebugMacro, vtkErrorMacro, vtkWarningMacro } = macro;

function notImplemented(method) {
  return () => vtkErrorMacro(`vtkRenderer::${method} - NOT IMPLEMENTED`);
}

// ----------------------------------------------------------------------------
// vtkRenderer methods
// ----------------------------------------------------------------------------

function vtkRenderer(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkRenderer');

  // Events
  const COMPUTE_VISIBLE_PROP_BOUNDS_EVENT = {
    type: 'ComputeVisiblePropBoundsEvent',
    renderer: publicAPI,
  };
  const RESET_CAMERA_CLIPPING_RANGE_EVENT = {
    type: 'ResetCameraClippingRangeEvent',
    renderer: publicAPI,
  };
  const RESET_CAMERA_EVENT = {
    type: 'ResetCameraEvent',
    renderer: publicAPI,
  };

  publicAPI.updateCamera = () => {
    if (!model.activeCamera) {
      vtkDebugMacro('No cameras are on, creating one.');
      // the get method will automagically create a camera
      // and reset it since one hasn't been specified yet.
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

    model.lights.forEach((light) => {
      if (light.lightTypeIsSceneLight()) {
        // Do nothing. Don't reset the transform matrix because applications
        // may have set a custom matrix. Only reset the transform matrix in
        // vtkLight::SetLightTypeToSceneLight()
      } else if (light.lightTypeIsHeadLight()) {
        // update position and orientation of light to match camera.
        light.setPositionFrom(camera.getPositionByReference());
        light.setFocalPointFrom(camera.getFocalPointByReference());
        light.modified(camera.getMTime());
      } else if (light.lightTypeIsCameraLight()) {
        light.setTransformMatrix(
          camera.getCameraLightTransformMatrix(mat4.create())
        );
      } else {
        vtkErrorMacro('light has unknown light type', light.get());
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

  publicAPI.getVTKWindow = () => model._renderWindow;

  publicAPI.setLayer = (layer) => {
    vtkDebugMacro(
      publicAPI.getClassName(),
      publicAPI,
      'setting Layer to ',
      layer
    );
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

  publicAPI.getActors = () => {
    model.actors = [];
    model.props.forEach((prop) => {
      model.actors = model.actors.concat(prop.getActors());
    });
    return model.actors;
  };
  publicAPI.addActor = publicAPI.addViewProp;
  publicAPI.removeActor = (actor) => {
    model.actors = model.actors.filter((a) => a !== actor);
    publicAPI.removeViewProp(actor);
    publicAPI.modified();
  };
  publicAPI.removeAllActors = () => {
    const actors = publicAPI.getActors();
    actors.forEach((actor) => {
      publicAPI.removeViewProp(actor);
    });
    model.actors = [];
    publicAPI.modified();
  };

  publicAPI.getVolumes = () => {
    model.volumes = [];
    model.props.forEach((prop) => {
      model.volumes = model.volumes.concat(prop.getVolumes());
    });
    return model.volumes;
  };
  publicAPI.addVolume = publicAPI.addViewProp;
  publicAPI.removeVolume = (volume) => {
    model.volumes = model.volumes.filter((v) => v !== volume);
    publicAPI.removeViewProp(volume);
    publicAPI.modified();
  };
  publicAPI.removeAllVolumes = () => {
    const volumes = publicAPI.getVolumes();
    volumes.forEach((volume) => {
      publicAPI.removeViewProp(volume);
    });
    model.volumes = [];
    publicAPI.modified();
  };

  publicAPI.addLight = (light) => {
    model.lights = [].concat(model.lights, light);
    publicAPI.modified();
  };
  publicAPI.removeLight = (light) => {
    model.lights = model.lights.filter((l) => l !== light);
    publicAPI.modified();
  };
  publicAPI.removeAllLights = () => {
    model.lights = [];
    publicAPI.modified();
  };
  publicAPI.setLightCollection = (lights) => {
    model.lights = lights;
    publicAPI.modified();
  };

  publicAPI.makeLight = vtkLight.newInstance;

  publicAPI.createLight = () => {
    if (!model.automaticLightCreation) {
      return;
    }

    if (model._createdLight) {
      publicAPI.removeLight(model._createdLight);
      model._createdLight.delete();
      model._createdLight = null;
    }

    model._createdLight = publicAPI.makeLight();
    publicAPI.addLight(model._createdLight);

    model._createdLight.setLightTypeToHeadLight();

    // set these values just to have a good default should LightFollowCamera
    // be turned off.
    model._createdLight.setPosition(publicAPI.getActiveCamera().getPosition());
    model._createdLight.setFocalPoint(
      publicAPI.getActiveCamera().getFocalPoint()
    );
  };

  // requires the aspect ratio of the viewport as X/Y
  publicAPI.normalizedDisplayToWorld = (x, y, z, aspect) => {
    let vpd = publicAPI.normalizedDisplayToProjection(x, y, z);
    vpd = publicAPI.projectionToView(vpd[0], vpd[1], vpd[2], aspect);

    return publicAPI.viewToWorld(vpd[0], vpd[1], vpd[2]);
  };

  // requires the aspect ratio of the viewport as X/Y
  publicAPI.worldToNormalizedDisplay = (x, y, z, aspect) => {
    let vpd = publicAPI.worldToView(x, y, z);
    vpd = publicAPI.viewToProjection(vpd[0], vpd[1], vpd[2], aspect);

    return publicAPI.projectionToNormalizedDisplay(vpd[0], vpd[1], vpd[2]);
  };

  // requires the aspect ratio of the viewport as X/Y
  publicAPI.viewToWorld = (x, y, z) => {
    if (model.activeCamera === null) {
      vtkErrorMacro(
        'ViewToWorld: no active camera, cannot compute view to world, returning 0,0,0'
      );
      return [0, 0, 0];
    }

    // get the view matrix from the active camera
    const matrix = model.activeCamera.getViewMatrix();

    mat4.invert(matrix, matrix);
    mat4.transpose(matrix, matrix);

    // Transform point to world coordinates
    const result = new Float64Array([x, y, z]);
    vec3.transformMat4(result, result, matrix);
    return result;
  };

  publicAPI.projectionToView = (x, y, z, aspect) => {
    if (model.activeCamera === null) {
      vtkErrorMacro(
        'ProjectionToView: no active camera, cannot compute projection to view, returning 0,0,0'
      );
      return [0, 0, 0];
    }

    // get the projection transformation from the active camera
    const matrix = model.activeCamera.getProjectionMatrix(aspect, -1.0, 1.0);

    mat4.invert(matrix, matrix);
    mat4.transpose(matrix, matrix);

    // Transform point to world coordinates
    const result = new Float64Array([x, y, z]);
    vec3.transformMat4(result, result, matrix);
    return result;
  };

  // Convert world point coordinates to view coordinates.
  publicAPI.worldToView = (x, y, z) => {
    if (model.activeCamera === null) {
      vtkErrorMacro(
        'WorldToView: no active camera, cannot compute view to world, returning 0,0,0'
      );
      return [0, 0, 0];
    }

    // get the view transformation from the active camera
    const matrix = model.activeCamera.getViewMatrix();
    mat4.transpose(matrix, matrix);

    const result = new Float64Array([x, y, z]);
    vec3.transformMat4(result, result, matrix);
    return result;
  };

  // Convert world point coordinates to view coordinates.
  // requires the aspect ratio of the viewport as X/Y
  publicAPI.viewToProjection = (x, y, z, aspect) => {
    if (model.activeCamera === null) {
      vtkErrorMacro(
        'ViewToProjection: no active camera, cannot compute view to projection, returning 0,0,0'
      );
      return [0, 0, 0];
    }

    // get the projeciton transformation from the active camera
    const matrix = model.activeCamera.getProjectionMatrix(aspect, -1.0, 1.0);
    mat4.transpose(matrix, matrix);

    const result = new Float64Array([x, y, z]);
    vec3.transformMat4(result, result, matrix);
    return result;
  };

  publicAPI.computeVisiblePropBounds = () => {
    model.allBounds[0] = vtkBoundingBox.INIT_BOUNDS[0];
    model.allBounds[1] = vtkBoundingBox.INIT_BOUNDS[1];
    model.allBounds[2] = vtkBoundingBox.INIT_BOUNDS[2];
    model.allBounds[3] = vtkBoundingBox.INIT_BOUNDS[3];
    model.allBounds[4] = vtkBoundingBox.INIT_BOUNDS[4];
    model.allBounds[5] = vtkBoundingBox.INIT_BOUNDS[5];
    let nothingVisible = true;

    publicAPI.invokeEvent(COMPUTE_VISIBLE_PROP_BOUNDS_EVENT);

    // loop through all props
    for (let index = 0; index < model.props.length; ++index) {
      const prop = model.props[index];
      if (prop.getVisibility() && prop.getUseBounds()) {
        const bounds = prop.getBounds();
        if (bounds && vtkMath.areBoundsInitialized(bounds)) {
          nothingVisible = false;

          if (bounds[0] < model.allBounds[0]) {
            model.allBounds[0] = bounds[0];
          }
          if (bounds[1] > model.allBounds[1]) {
            model.allBounds[1] = bounds[1];
          }
          if (bounds[2] < model.allBounds[2]) {
            model.allBounds[2] = bounds[2];
          }
          if (bounds[3] > model.allBounds[3]) {
            model.allBounds[3] = bounds[3];
          }
          if (bounds[4] < model.allBounds[4]) {
            model.allBounds[4] = bounds[4];
          }
          if (bounds[5] > model.allBounds[5]) {
            model.allBounds[5] = bounds[5];
          }
        }
      }
    }

    if (nothingVisible) {
      vtkMath.uninitializeBounds(model.allBounds);
      vtkDebugMacro("Can't compute bounds, no 3D props are visible");
    }

    return model.allBounds;
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
      vtkErrorMacro('Trying to reset non-existent camera');
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
    radius = radius === 0 ? 1.0 : radius;

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
      center[0] + distance * vn[0],
      center[1] + distance * vn[1],
      center[2] + distance * vn[2]
    );

    publicAPI.resetCameraClippingRange(boundsToUse);

    // setup default parallel scale
    model.activeCamera.setParallelScale(parallelScale);

    // update reasonable world to physical values
    model.activeCamera.setPhysicalScale(radius);
    model.activeCamera.setPhysicalTranslation(
      -center[0],
      -center[1],
      -center[2]
    );

    // Here to let parallel/distributed compositing intercept
    // and do the right thing.
    publicAPI.invokeEvent(RESET_CAMERA_EVENT);

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
      vtkErrorMacro('Trying to reset clipping range of non-existent camera');
      return false;
    }

    // Get the exact range for the bounds
    const range = model.activeCamera.computeClippingRange(boundsToUse);

    // do not let far - near be less than 0.1 of the window height
    // this is for cases such as 2D images which may have zero range
    let minGap = 0.0;
    if (model.activeCamera.getParallelProjection()) {
      minGap = 0.2 * model.activeCamera.getParallelScale();
    } else {
      const angle = vtkMath.radiansFromDegrees(
        model.activeCamera.getViewAngle()
      );
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
    range[0] =
      0.99 * range[0] - (range[1] - range[0]) * model.clippingRangeExpansion;
    range[1] =
      1.01 * range[1] + (range[1] - range[0]) * model.clippingRangeExpansion;

    // Make sure near is not bigger than far
    range[0] = range[0] >= range[1] ? 0.01 * range[1] : range[0];

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
    publicAPI.invokeEvent(RESET_CAMERA_CLIPPING_RANGE_EVENT);
    return false;
  };

  publicAPI.setRenderWindow = (renderWindow) => {
    if (renderWindow !== model._renderWindow) {
      model._vtkWindow = renderWindow;
      model._renderWindow = renderWindow;
    }
  };

  publicAPI.visibleActorCount = () =>
    model.props.filter((prop) => prop.getVisibility()).length;
  publicAPI.visibleVolumeCount = publicAPI.visibleActorCount;

  publicAPI.getMTime = () => {
    let m1 = model.mtime;
    const m2 = model.activeCamera ? model.activeCamera.getMTime() : 0;
    if (m2 > m1) {
      m1 = m2;
    }
    const m3 = model._createdLight ? model._createdLight.getMTime() : 0;
    if (m3 > m1) {
      m1 = m3;
    }
    return m1;
  };

  publicAPI.getTransparent = () => !!model.preserveColorBuffer;

  publicAPI.isActiveCameraCreated = () => !!model.activeCamera;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  pickedProp: null,
  activeCamera: null,

  allBounds: [],
  ambient: [1, 1, 1],

  allocatedRenderTime: 100,
  timeFactor: 1,

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

  layer: 0,
  preserveColorBuffer: false,
  preserveDepthBuffer: false,

  computeVisiblePropBounds: vtkMath.createUninitializedBounds(),

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

  // make sure background has 4 entries. Default to opaque black
  if (!model.background) model.background = [0, 0, 0, 1];
  while (model.background.length < 3) model.background.push(0);
  if (model.background.length === 3) model.background.push(1);

  // Build VTK API
  macro.get(publicAPI, model, [
    '_renderWindow',

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
  macro.setGetArray(publicAPI, model, ['background'], 4, 1.0);
  macro.moveToProtected(publicAPI, model, ['renderWindow']);

  // Object methods
  vtkRenderer(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkRenderer');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
