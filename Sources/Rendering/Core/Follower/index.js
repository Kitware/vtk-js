import { vec3, mat4 } from 'gl-matrix';
import macro from 'vtk.js/Sources/macros';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';

// ----------------------------------------------------------------------------
// vtkFollower methods
// ----------------------------------------------------------------------------

function vtkFollower(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkFollower');

  // Capture 'parentClass' api for internal use
  const superClass = { ...publicAPI };

  publicAPI.getMTime = () => {
    let mt = superClass.getMTime();
    if (model.camera !== null) {
      const time = model.camera.getMTime();
      mt = time > mt ? time : mt;
    }

    return mt;
  };

  publicAPI.computeMatrix = () => {
    // check whether or not need to rebuild the matrix
    if (publicAPI.getMTime() > model.matrixMTime.getMTime()) {
      mat4.identity(model.matrix);
      if (model.userMatrix) {
        mat4.multiply(model.matrix, model.matrix, model.userMatrix);
      }
      mat4.translate(model.matrix, model.matrix, model.origin);
      mat4.translate(model.matrix, model.matrix, model.position);
      mat4.multiply(model.matrix, model.matrix, model.rotation);
      mat4.scale(model.matrix, model.matrix, model.scale);

      if (model.camera) {
        // first compute our target viewUp
        const vup = new Float64Array(model.viewUp);
        if (!model.useViewUp) {
          vec3.set(vup, ...model.camera.getViewUp());
        }

        // compute a vpn
        const vpn = new Float64Array(3);
        if (model.camera.getParallelProjection()) {
          vec3.set(vpn, model.camera.getViewPlaneNormal());
        } else {
          vec3.set(vpn, ...model.position);
          vec3.subtract(vpn, model.camera.getPosition(), vpn);
          vec3.normalize(vpn, vpn);
        }

        // compute vright
        const vright = new Float64Array(3);
        vec3.cross(vright, vup, vpn);
        vec3.normalize(vright, vright);

        // now recompute the vpn so that it is orthogonal to vup
        vec3.cross(vpn, vright, vup);
        vec3.normalize(vpn, vpn);

        model.followerMatrix[0] = vright[0];
        model.followerMatrix[1] = vright[1];
        model.followerMatrix[2] = vright[2];

        model.followerMatrix[4] = vup[0];
        model.followerMatrix[5] = vup[1];
        model.followerMatrix[6] = vup[2];

        model.followerMatrix[8] = vpn[0];
        model.followerMatrix[9] = vpn[1];
        model.followerMatrix[10] = vpn[2];

        mat4.multiply(model.matrix, model.matrix, model.followerMatrix);
      }

      mat4.translate(model.matrix, model.matrix, [
        -model.origin[0],
        -model.origin[1],
        -model.origin[2],
      ]);
      mat4.transpose(model.matrix, model.matrix);

      // check for identity
      model.isIdentity = false;
      model.matrixMTime.modified();
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  viewUp: [0, 1, 0],
  useViewUp: false,
  camera: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkActor.extend(publicAPI, model, initialValues);

  model.followerMatrix = mat4.identity(new Float64Array(16));

  // Build VTK API
  macro.setGet(publicAPI, model, ['useViewUp', 'camera']);

  macro.setGetArray(publicAPI, model, ['viewUp'], 3);

  // Object methods
  vtkFollower(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkFollower');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
