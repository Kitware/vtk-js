import * as macro from '../../../macro';
import { mat4 } from 'gl-matrix';
import Prop from '../Prop';

// ----------------------------------------------------------------------------
// vtkProp3D methods
// ----------------------------------------------------------------------------

function prop3D(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkProp3D');

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

const DEFAULT_VALUES = {
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

export function extend(publicAPI, initialValues = {}) {
  const model = Object.assign(initialValues, DEFAULT_VALUES);

  // Inheritance
  Prop.extend(publicAPI, model);

  // Build VTK API
  macro.get(publicAPI, model, ['isIdentity']);
  macro.getArray(publicAPI, model, ['center']);
  macro.setGetArray(publicAPI, model, [
    'origin',
    'position',
    'orientation',
    'scale',
  ], 3);

  // Object internal instance
  model.matrix = mat4.create();

  // Object methods
  prop3D(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
