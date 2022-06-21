import macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import { vec3 } from 'gl-matrix';

// ----------------------------------------------------------------------------

export const LIGHT_TYPES = ['HeadLight', 'CameraLight', 'SceneLight'];

// ----------------------------------------------------------------------------
// vtkLight methods
// ----------------------------------------------------------------------------

function vtkLight(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkLight');
  const tmpVec = new Float64Array(3);

  publicAPI.getTransformedPosition = () => {
    if (model.transformMatrix) {
      vec3.transformMat4(tmpVec, model.position, model.transformMatrix);
    } else {
      vec3.set(tmpVec, model.position[0], model.position[1], model.position[2]);
    }
    return tmpVec;
  };

  publicAPI.getTransformedFocalPoint = () => {
    if (model.transformMatrix) {
      vec3.transformMat4(tmpVec, model.focalPoint, model.transformMatrix);
    } else {
      vec3.set(
        tmpVec,
        model.focalPoint[0],
        model.focalPoint[1],
        model.focalPoint[2]
      );
    }
    return tmpVec;
  };

  publicAPI.getDirection = () => {
    if (model.directionMTime < model.mtime) {
      model.direction[0] = model.focalPoint[0] - model.position[0];
      model.direction[1] = model.focalPoint[1] - model.position[1];
      model.direction[2] = model.focalPoint[2] - model.position[2];
      vtkMath.normalize(model.direction);
      model.directionMTime = model.mtime;
    }
    return model.direction;
  };

  publicAPI.setDirectionAngle = (elevation, azimuth) => {
    const elevationRadians = vtkMath.radiansFromDegrees(elevation);
    const azimuthRadians = vtkMath.radiansFromDegrees(azimuth);

    publicAPI.setPosition(
      Math.cos(elevationRadians) * Math.sin(azimuthRadians),
      Math.sin(elevationRadians),
      Math.cos(elevationRadians) * Math.cos(azimuthRadians)
    );

    publicAPI.setFocalPoint(0, 0, 0);
    publicAPI.setPositional(0);
  };

  publicAPI.setLightTypeToHeadLight = () => {
    publicAPI.setLightType('HeadLight');
  };

  publicAPI.setLightTypeToCameraLight = () => {
    publicAPI.setLightType('CameraLight');
  };

  publicAPI.setLightTypeToSceneLight = () => {
    publicAPI.setTransformMatrix(null);
    publicAPI.setLightType('SceneLight');
  };

  publicAPI.lightTypeIsHeadLight = () => model.lightType === 'HeadLight';

  publicAPI.lightTypeIsSceneLight = () => model.lightType === 'SceneLight';

  publicAPI.lightTypeIsCameraLight = () => model.lightType === 'CameraLight';
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

function defaultValues(initialValues) {
  return {
    switch: true,
    intensity: 1,
    color: [1, 1, 1],
    position: [0, 0, 1],
    focalPoint: [0, 0, 0],
    positional: false,
    exponent: 1,
    coneAngle: 30,
    attenuationValues: [1, 0, 0],
    transformMatrix: null,
    lightType: 'SceneLight',
    shadowAttenuation: 1,
    direction: [0, 0, 0],
    directionMTime: 0,

    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(initialValues, defaultValues(initialValues));

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, [
    'intensity',
    'switch',
    'positional',
    'exponent',
    'coneAngle',
    'transformMatrix',
    'lightType',
    'shadowAttenuation',
    'attenuationValues',
  ]);
  macro.setGetArray(
    publicAPI,
    model,
    ['color', 'position', 'focalPoint', 'attenuationValues'],
    3
  );

  // Object methods
  vtkLight(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkLight');

// ----------------------------------------------------------------------------

export default { newInstance, extend, LIGHT_TYPES };
