import * as macro from '../../../macro';
import { mat4 } from 'gl-matrix';

// ----------------------------------------------------------------------------

const GET_FIELDS = [
  'isIdentity',
];

const ARRAY_3 = [
  'origin',
  'position',
  'orientation',
  'scale',
];

const GET_ARRAY = [
  'center',
];

// ----------------------------------------------------------------------------
// Property methods
// ----------------------------------------------------------------------------

export function prop(publicAPI, model) {
  function updateIdentityFlag() {
    if (!model.isIdentity) {
      return;
    }

    [model.origin, model.position, model.orientation].forEach(array => {
      if (model.isIdentity) {
        return;
      }
      if (array.filter(v => v !== 0).length) {
        model.isIdentity = false;
        return;
      }
    });

    // if (model.userMatrix || model.userTransform) {
    //   model.isIdentity = false;
    //   return;
    // }

    if (model.scale.filter(v => v !== 1).length) {
      model.isIdentity = false;
      return;
    }
  }

  publicAPI.onModified(updateIdentityFlag);

  publicAPI.addPosition = (deltaXYZ) => {
    model.position = model.position.map((value, index) => value + deltaXYZ[index]);
    publicAPI.modified();
  };

  publicAPI.getBounds = () => model.bounds;

  publicAPI.computeMatrix = () => {
    console.log('Not implemented computeMatrix');
  };

  publicAPI.getMatrix = () => {
    publicAPI.computeMatrix();
    return model.matrix;
  };

  publicAPI.getXRange = () => model.bounds.filter((value, index) => index < 2);
  publicAPI.getYRange = () => model.bounds.filter((value, index) => index > 1 && index < 4);
  publicAPI.getZRange = () => model.bounds.filter((value, index) => index > 3);

  publicAPI.getLength = () => {
    const dx = model.bounds[1] - model.bounds[0];
    const dy = model.bounds[3] - model.bounds[2];
    const dz = model.bounds[5] - model.bounds[4];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  };

  publicAPI.rotateX = angle => {
    console.log('Not implemented rotateX');
  };

  publicAPI.rotateY = angle => {
    console.log('Not implemented rotateY');
  };

  publicAPI.rotateZ = angle => {
    console.log('Not implemented rotateZ');
  };

  publicAPI.rotateWXYZ = (w, x, y, z) => {
    console.log('Not implemented rotateWXYZ');
  };

  publicAPI.addOrientation = xyz => {
    console.log('Not implemented addOrientation');
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

export const DEFAULT_VALUES = {
  matrix: null,
  origin: [0, 0, 0],
  position: [0, 0, 0],
  orientation: [0, 0, 0],
  scale: [1, 1, 1],
  center: [0, 0, 0],
  bounds: [1, -1, 1, -1, 1, -1],
  isIdentity: true,
};

// ----------------------------------------------------------------------------

function newInstance(initialValues = {}) {
  const model = Object.assign({}, DEFAULT_VALUES, initialValues);
  const publicAPI = {};

  // Build VTK API
  macro.obj(publicAPI, model, 'vtkProp3D');
  macro.get(publicAPI, model, GET_FIELDS);
  macro.getArray(publicAPI, model, GET_ARRAY);
  macro.setGetArray(publicAPI, model, ARRAY_3, 3);

  model.matrix = mat4.create();

  // Object methods
  prop(publicAPI, model);

  return Object.freeze(publicAPI);
}

// ----------------------------------------------------------------------------

export default { newInstance, DEFAULT_VALUES, prop };
