import { mat3, mat4 } from 'gl-matrix';
import Constants from 'vtk.js/Sources/Common/Transform/LandmarkTransform/Constants';
import macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

const { Mode } = Constants;

// ----------------------------------------------------------------------------
// vtkLandmarkTransform methods
// ----------------------------------------------------------------------------

function vtkLandmarkTransform(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkLandmarkTransform');

  // Convert a mat4 matrix to a Matrix 2 dimensions
  function mat4To2DArray(mat) {
    const output = [
      [0.0, 0.0, 0.0, 0.0],
      [0.0, 0.0, 0.0, 0.0],
      [0.0, 0.0, 0.0, 0.0],
      [0.0, 0.0, 0.0, 0.0],
    ];
    let cpt = 0;
    for (let c = 0; c < 4; c++) {
      for (let r = 0; r < 4; r++) {
        output[r][c] = mat[cpt++];
      }
    }
    return output;
  }

  function update() {
    mat4.identity(model.matrix);
    const N_PTS = model.sourceLandmark.getNumberOfPoints();
    if (
      model.targetLandmark.getNumberOfPoints() !== N_PTS ||
      model.sourceLandmark === null ||
      model.targetLandmark === null ||
      N_PTS === 0
    ) {
      console.error('Error : Bad inputs of vtkLandmarkTransform');
      return model.matrix;
    }

    // -- find the centroid of each set --

    const sourceCentroid = [0, 0, 0];
    const targetCentroid = [0, 0, 0];
    const p = [0, 0, 0];
    for (let i = 0; i < N_PTS; i++) {
      model.sourceLandmark.getPoint(i, p);
      sourceCentroid[0] += p[0];
      sourceCentroid[1] += p[1];
      sourceCentroid[2] += p[2];
      model.targetLandmark.getPoint(i, p);
      targetCentroid[0] += p[0];
      targetCentroid[1] += p[1];
      targetCentroid[2] += p[2];
    }
    sourceCentroid[0] /= N_PTS;
    sourceCentroid[1] /= N_PTS;
    sourceCentroid[2] /= N_PTS;
    targetCentroid[0] /= N_PTS;
    targetCentroid[1] /= N_PTS;
    targetCentroid[2] /= N_PTS;

    // -- if only one point, stop right here

    if (N_PTS === 1) {
      mat4.identity(model.matrix);
      model.matrix.elem[12] = targetCentroid[0] - sourceCentroid[0];
      model.matrix.elem[13] = targetCentroid[1] - sourceCentroid[1];
      model.matrix.elem[14] = targetCentroid[2] - sourceCentroid[2];
      return model.matrix;
    }

    // -- build the 3x3 matrix M --

    const M = new Float64Array(9);
    const AAT = new Float64Array(9);

    const a = [0, 0, 0];
    const b = [0, 0, 0];
    let sa = 0.0;
    let sb = 0.0;
    for (let pt = 0; pt < N_PTS; pt++) {
      // get the origin-centred point (a) in the source set
      model.sourceLandmark.getPoint(pt, a);
      a[0] -= sourceCentroid[0];
      a[1] -= sourceCentroid[1];
      a[2] -= sourceCentroid[2];

      // get the origin-centred point (b) in the target set
      model.targetLandmark.getPoint(pt, b);
      b[0] -= targetCentroid[0];
      b[1] -= targetCentroid[1];
      b[2] -= targetCentroid[2];

      // accumulate the products a*T(b) into the matrix M
      for (let i = 0; i < 3; i++) {
        M[3 * 0 + i] += a[i] * b[0];
        M[3 * 1 + i] += a[i] * b[1];
        M[3 * 2 + i] += a[i] * b[2];

        // for the affine transform, compute ((a.a^t)^-1 . a.b^t)^t.
        // a.b^t is already in M.  here we put a.a^t in AAT.
        if (model.mode === Mode.AFFINE) {
          AAT[3 * 0 + i] += a[i] * a[0];
          AAT[3 * 1 + i] += a[i] * a[1];
          AAT[3 * 2 + i] += a[i] * a[2];
        }
      }
      // accumulate scale factors (if desired)
      sa += a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
      sb += b[0] * b[0] + b[1] * b[1] + b[2] * b[2];
    }

    if (model.mode === Mode.AFFINE) {
      // AAT = (a.a^t)^-1
      mat3.invert(AAT, AAT);

      // M = (a.a^t)^-1 . a.b^t
      mat3.multiply(M, AAT, M);

      // this->Matrix = M^t
      for (let i = 0; i < 3; ++i) {
        for (let j = 0; j < 3; ++j) {
          model.matrix[4 * j + i] = M[4 * i + j];
        }
      }
    } else {
      const scale = Math.sqrt(sb / sa);

      // -- build the 4x4 matrix N --

      const N = new Float64Array(16);
      // on-diagonal elements
      N[0] = M[0] + M[4] + M[8];
      N[5] = M[0] - M[4] - M[8];
      N[10] = -M[0] + M[4] - M[8];
      N[15] = -M[0] - M[4] + M[8];
      // off-diagonal elements
      /* eslint-disable no-multi-assign */
      N[4] = N[1] = M[7] - M[5];
      N[8] = N[2] = M[2] - M[6];
      N[12] = N[3] = M[3] - M[1];

      N[9] = N[6] = M[3] + M[1];
      N[13] = N[7] = M[2] + M[6];
      N[14] = N[11] = M[7] + M[5];
      /* eslint-enable no-multi-assign */

      // -- eigen-decompose N (is symmetric) --

      const eigenVectors = [
        [0.0, 0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0, 0.0],
        [0.0, 0.0, 0.0, 0.0],
      ];
      const eigenValues = [0.0, 0.0, 0.0, 0.0];

      const NMatrix = mat4To2DArray(N);
      vtkMath.jacobiN(NMatrix, 4, eigenValues, eigenVectors);

      // The eigenvector with the largest eigenvalue is the quaternion we want
      // (they are sorted in decreasing order for us by JacobiN)
      let w;
      let x;
      let y;
      let z;

      // first; if points are collinear, choose the quaternion that
      // results in the smallest rotation
      if (eigenValues[0] === eigenValues[1] || N_PTS === 2) {
        const s0 = [0, 0, 0];
        const t0 = [0, 0, 0];
        const s1 = [0, 0, 0];
        const t1 = [0, 0, 0];
        model.sourceLandmark.getPoint(0, s0);
        model.targetLandmark.getPoint(0, t0);
        model.sourceLandmark.getPoint(1, s1);
        model.targetLandmark.getPoint(1, t1);

        let ds;
        let dt;
        let rs = 0;
        let rt = 0;
        for (let i = 0; i < 3; i++) {
          ds[i] = s1[i] - s0[i]; // vector between points
          rs = ds[i] * ds[i] + rs;
          dt[i] = t1[i] - t0[i];
          rt = dt[i] * dt[i] + rt;
        }

        // normalize the two vectors
        rs = Math.sqrt(rs);
        ds[0] /= rs;
        ds[1] /= rs;
        ds[2] /= rs;
        rt = Math.sqrt(rt);
        dt[0] /= rt;
        dt[1] /= rt;
        dt[2] /= rt;

        // take dot & cross product
        w = ds[0] * dt[0] + ds[1] * dt[1] + ds[2] * dt[2];
        x = ds[1] * dt[2] - ds[2] * dt[1];
        y = ds[2] * dt[0] - ds[0] * dt[2];
        z = ds[0] * dt[1] - ds[1] * dt[0];

        let r = Math.sqrt(x * x + y * y + z * z);
        const theta = Math.atan2(r, w);

        // construct quaternion
        w = Math.cos(theta / 2);
        if (r !== 0) {
          r = Math.sin(theta / 2) / r;
          x *= r;
          y *= r;
          z *= r;
        } else {
          // rotation by 180 degrees : special case
          // Rotate around a vector perpendicular to ds
          vtkMath.perpendiculars(ds, dt, 0, 0);
          r = Math.sin(theta / 2);
          x = dt[0] * r;
          y = dt[1] * r;
          z = dt[2] * r;
        }
      } else {
        // points are not collinear
        w = eigenVectors[0][0];
        x = eigenVectors[1][0];
        y = eigenVectors[2][0];
        z = eigenVectors[3][0];
      }

      // convert quaternion to a rotation matrix

      const ww = w * w;
      const wx = w * x;
      const wy = w * y;
      const wz = w * z;

      const xx = x * x;
      const yy = y * y;
      const zz = z * z;

      const xy = x * y;
      const xz = x * z;
      const yz = y * z;

      model.matrix[0] = ww + xx - yy - zz;
      model.matrix[1] = 2.0 * (wz + xy);
      model.matrix[2] = 2.0 * (-wy + xz);

      model.matrix[4] = 2.0 * (-wz + xy);
      model.matrix[5] = ww - xx + yy - zz;
      model.matrix[6] = 2.0 * (wx + yz);

      model.matrix[8] = 2.0 * (wy + xz);
      model.matrix[9] = 2.0 * (-wx + yz);
      model.matrix[10] = ww - xx - yy + zz;

      // add in the scale factor (if desired)
      if (model.mode !== Mode.RIGID_BODY) {
        for (let i = 0; i < 3; i++) {
          model.matrix[4 * 0 + i] = model.matrix[4 * 0 + i] * scale;
          model.matrix[4 * 1 + i] = model.matrix[4 * 1 + i] * scale;
          model.matrix[4 * 2 + i] = model.matrix[4 * 2 + i] * scale;
        }
      }
    }

    // the translation is given by the difference in the transformed source
    // centroid and the target centroid
    const sx =
      model.matrix[0] * sourceCentroid[0] +
      model.matrix[4] * sourceCentroid[1] +
      model.matrix[8] * sourceCentroid[2];
    const sy =
      model.matrix[1] * sourceCentroid[0] +
      model.matrix[5] * sourceCentroid[1] +
      model.matrix[9] * sourceCentroid[2];
    const sz =
      model.matrix[2] * sourceCentroid[0] +
      model.matrix[6] * sourceCentroid[1] +
      model.matrix[10] * sourceCentroid[2];

    model.matrix[12] = targetCentroid[0] - sx;
    model.matrix[13] = targetCentroid[1] - sy;
    model.matrix[14] = targetCentroid[2] - sz;

    // fill the bottom row of the 4x4 matrix
    model.matrix[3] = 0.0;
    model.matrix[7] = 0.0;
    model.matrix[11] = 0.0;
    model.matrix[15] = 1.0;

    return model.matrix;
  }

  // Expose method
  publicAPI.update = update;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  mode: Mode.SIMILARITY,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.obj(publicAPI, model);

  // Internal objects initialization
  model.matrix = mat4.identity(new Float64Array(16));

  macro.setGet(publicAPI, model, ['sourceLandmark', 'targetLandmark', 'mode']);
  macro.get(publicAPI, model, ['matrix']);

  vtkLandmarkTransform(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkLandmarkTransform');

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...Constants };
