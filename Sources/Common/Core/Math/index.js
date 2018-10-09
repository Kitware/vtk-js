import seedrandom from 'seedrandom';
import macro from 'vtk.js/Sources/macro';

const { vtkErrorMacro, vtkWarningMacro } = macro;

// ----------------------------------------------------------------------------
/* eslint-disable camelcase                                                  */
/* eslint-disable no-cond-assign                                             */
/* eslint-disable no-bitwise                                                 */
/* eslint-disable no-multi-assign                                            */
// ----------------------------------------------------------------------------
let randomSeedValue = 0;
const VTK_MAX_ROTATIONS = 20;
const VTK_SMALL_NUMBER = 1.0e-12;

function notImplemented(method) {
  return () => vtkErrorMacro(`vtkMath::${method} - NOT IMPLEMENTED`);
}

function vtkSwapVectors3(v1, v2) {
  for (let i = 0; i < 3; i++) {
    const tmp = v1[i];
    v1[i] = v2[i];
    v2[i] = tmp;
  }
}

function createArray(size = 3) {
  const array = [];
  while (array.length < size) {
    array.push(0);
  }
  return array;
}

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

const Pi = () => Math.PI;
const radiansFromDegrees = (deg) => (deg / 180) * Math.PI;
const degreesFromRadians = (rad) => (rad * 180) / Math.PI;
const { round, floor, ceil, min, max } = Math;

function arrayMin(arr) {
  let minValue = Infinity;
  for (let i = 0, len = arr.length; i < len; ++i) {
    if (arr[i] < minValue) {
      minValue = arr[i];
    }
  }

  return minValue;
}

function arrayMax(arr) {
  let maxValue = -Infinity;
  for (let i = 0, len = arr.length; i < len; ++i) {
    if (maxValue < arr[i]) {
      maxValue = arr[i];
    }
  }

  return maxValue;
}

const ceilLog2 = notImplemented('ceilLog2');
const factorial = notImplemented('factorial');

function nearestPowerOfTwo(xi) {
  let v = 1;
  while (v < xi) {
    v *= 2;
  }
  return v;
}

function isPowerOfTwo(x) {
  return x === nearestPowerOfTwo(x);
}

function binomial(m, n) {
  let r = 1;
  for (let i = 1; i <= n; ++i) {
    r *= (m - i + 1) / i;
  }
  return Math.floor(r);
}

function beginCombination(m, n) {
  if (m < n) {
    return 0;
  }

  const r = createArray(n);
  for (let i = 0; i < n; ++i) {
    r[i] = i;
  }
  return r;
}

function nextCombination(m, n, r) {
  let status = 0;
  for (let i = n - 1; i >= 0; --i) {
    if (r[i] < m - n + i) {
      let j = r[i] + 1;
      while (i < n) {
        r[i++] = j++;
      }
      status = 1;
      break;
    }
  }
  return status;
}

const randomSeed = (seed) => {
  seedrandom(`${seed}`, { global: true });
  randomSeedValue = seed;
};

const getSeed = () => randomSeedValue;

function random(minValue = 0, maxValue = 1) {
  const delta = maxValue - minValue;
  return minValue + delta * Math.random();
}

const gaussian = notImplemented('gaussian');

// Vect3 operations
function add(a, b, out) {
  out[0] = a[0] + b[0];
  out[1] = a[1] + b[1];
  out[2] = a[2] + b[2];
}

function subtract(a, b, out) {
  out[0] = a[0] - b[0];
  out[1] = a[1] - b[1];
  out[2] = a[2] - b[2];
}

function multiplyScalar(vec, scalar) {
  vec[0] *= scalar;
  vec[1] *= scalar;
  vec[2] *= scalar;
}

function multiplyScalar2D(vec, scalar) {
  vec[0] *= scalar;
  vec[1] *= scalar;
}

function dot(x, y) {
  return x[0] * y[0] + x[1] * y[1] + x[2] * y[2];
}

function outer(x, y, out_3x3) {
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      out_3x3[i][j] = x[i] * y[j];
    }
  }
}

function cross(x, y, out) {
  const Zx = x[1] * y[2] - x[2] * y[1];
  const Zy = x[2] * y[0] - x[0] * y[2];
  const Zz = x[0] * y[1] - x[1] * y[0];
  out[0] = Zx;
  out[1] = Zy;
  out[2] = Zz;
}

function norm(x, n = 3) {
  switch (n) {
    case 1:
      return Math.abs(x);
    case 2:
      return Math.sqrt(x[0] * x[0] + x[1] * x[1]);
    case 3:
      return Math.sqrt(x[0] * x[0] + x[1] * x[1] + x[2] * x[2]);
    default: {
      let sum = 0;
      for (let i = 0; i < n; i++) {
        sum += x[i] * x[i];
      }
      return Math.sqrt(sum);
    }
  }
}

function normalize(x) {
  const den = norm(x);
  if (den !== 0.0) {
    x[0] /= den;
    x[1] /= den;
    x[2] /= den;
  }
  return den;
}

function perpendiculars(x, y, z, theta) {
  const x2 = x[0] * x[0];
  const y2 = x[1] * x[1];
  const z2 = x[2] * x[2];
  const r = Math.sqrt(x2 + y2 + z2);

  let dx;
  let dy;
  let dz;

  // transpose the vector to avoid divide-by-zero error
  if (x2 > y2 && x2 > z2) {
    dx = 0;
    dy = 1;
    dz = 2;
  } else if (y2 > z2) {
    dx = 1;
    dy = 2;
    dz = 0;
  } else {
    dx = 2;
    dy = 0;
    dz = 1;
  }

  const a = x[dx] / r;
  const b = x[dy] / r;
  const c = x[dz] / r;
  const tmp = Math.sqrt(a * a + c * c);

  if (theta !== 0) {
    const sintheta = Math.sin(theta);
    const costheta = Math.cos(theta);

    if (y) {
      y[dx] = (c * costheta - a * b * sintheta) / tmp;
      y[dy] = sintheta * tmp;
      y[dz] = (-(a * costheta) - b * c * sintheta) / tmp;
    }

    if (z) {
      z[dx] = (-(c * sintheta) - a * b * costheta) / tmp;
      z[dy] = costheta * tmp;
      z[dz] = (a * sintheta - b * c * costheta) / tmp;
    }
  } else {
    if (y) {
      y[dx] = c / tmp;
      y[dy] = 0;
      y[dz] = -a / tmp;
    }

    if (z) {
      z[dx] = (-a * b) / tmp;
      z[dy] = tmp;
      z[dz] = (-b * c) / tmp;
    }
  }
}

function projectVector(a, b, projection) {
  const bSquared = dot(b, b);

  if (bSquared === 0) {
    projection[0] = 0;
    projection[1] = 0;
    projection[2] = 0;
    return false;
  }

  const scale = dot(a, b) / bSquared;

  for (let i = 0; i < 3; i++) {
    projection[i] = b[i];
  }
  multiplyScalar(projection, scale);

  return true;
}

function dot2D(x, y) {
  return x[0] * y[0] + x[1] * y[1];
}

function projectVector2D(a, b, projection) {
  const bSquared = dot2D(b, b);

  if (bSquared === 0) {
    projection[0] = 0;
    projection[1] = 0;
    return false;
  }

  const scale = dot2D(a, b) / bSquared;

  for (let i = 0; i < 2; i++) {
    projection[i] = b[i];
  }
  multiplyScalar2D(projection, scale);

  return true;
}

function distance2BetweenPoints(x, y) {
  return (
    (x[0] - y[0]) * (x[0] - y[0]) +
    (x[1] - y[1]) * (x[1] - y[1]) +
    (x[2] - y[2]) * (x[2] - y[2])
  );
}

function angleBetweenVectors(v1, v2) {
  const crossVect = [0, 0, 0];
  cross(v1, v2, crossVect);
  return Math.atan2(norm(crossVect), dot(v1, v2));
}

function gaussianAmplitude(mean, variance, position) {
  const distanceFromMean = Math.abs(mean - position);
  return (
    (1 / Math.sqrt(2 * Math.PI * variance)) *
    Math.exp(-(distanceFromMean ** 2) / (2 * variance))
  );
}

function gaussianWeight(mean, variance, position) {
  const distanceFromMean = Math.abs(mean - position);
  return Math.exp(-(distanceFromMean ** 2) / (2 * variance));
}

function outer2D(x, y, out_2x2) {
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      out_2x2[i][j] = x[i] * y[j];
    }
  }
}

function norm2D(x2D) {
  return Math.sqrt(x2D[0] * x2D[0] + x2D[1] * x2D[1]);
}

function normalize2D(x) {
  const den = norm2D(x);
  if (den !== 0.0) {
    x[0] /= den;
    x[1] /= den;
  }
  return den;
}

function determinant2x2(...args) {
  if (args.length === 2) {
    return args[0][0] * args[1][1] - args[1][0] * args[0][1];
  }
  if (args.length === 4) {
    return args[0] * args[3] - args[1] * args[2];
  }
  return Number.NaN;
}

function LUFactor3x3(mat_3x3, index_3) {
  let maxI;
  let tmp;
  let largest;
  const scale = [0, 0, 0];

  // Loop over rows to get implicit scaling information
  for (let i = 0; i < 3; i++) {
    largest = Math.abs(mat_3x3[i][0]);
    if ((tmp = Math.abs(mat_3x3[i][1])) > largest) {
      largest = tmp;
    }
    if ((tmp = Math.abs(mat_3x3[i][2])) > largest) {
      largest = tmp;
    }
    scale[i] = 1 / largest;
  }

  // Loop over all columns using Crout's method

  // first column
  largest = scale[0] * Math.abs(mat_3x3[0][0]);
  maxI = 0;
  if ((tmp = scale[1] * Math.abs(mat_3x3[1][0])) >= largest) {
    largest = tmp;
    maxI = 1;
  }
  if ((tmp = scale[2] * Math.abs(mat_3x3[2][0])) >= largest) {
    maxI = 2;
  }
  if (maxI !== 0) {
    vtkSwapVectors3(mat_3x3[maxI], mat_3x3[0]);
    scale[maxI] = scale[0];
  }
  index_3[0] = maxI;

  mat_3x3[1][0] /= mat_3x3[0][0];
  mat_3x3[2][0] /= mat_3x3[0][0];

  // second column
  mat_3x3[1][1] -= mat_3x3[1][0] * mat_3x3[0][1];
  mat_3x3[2][1] -= mat_3x3[2][0] * mat_3x3[0][1];
  largest = scale[1] * Math.abs(mat_3x3[1][1]);
  maxI = 1;
  if ((tmp = scale[2] * Math.abs(mat_3x3[2][1])) >= largest) {
    maxI = 2;
    vtkSwapVectors3(mat_3x3[2], mat_3x3[1]);
    scale[2] = scale[1];
  }
  index_3[1] = maxI;
  mat_3x3[2][1] /= mat_3x3[1][1];

  // third column
  mat_3x3[1][2] -= mat_3x3[1][0] * mat_3x3[0][2];
  mat_3x3[2][2] -=
    mat_3x3[2][0] * mat_3x3[0][2] + mat_3x3[2][1] * mat_3x3[1][2];
  index_3[2] = 2;
}

function LUSolve3x3(mat_3x3, index_3, x_3) {
  // forward substitution
  let sum = x_3[index_3[0]];
  x_3[index_3[0]] = x_3[0];
  x_3[0] = sum;

  sum = x_3[index_3[1]];
  x_3[index_3[1]] = x_3[1];
  x_3[1] = sum - mat_3x3[1][0] * x_3[0];

  sum = x_3[index_3[2]];
  x_3[index_3[2]] = x_3[2];
  x_3[2] = sum - mat_3x3[2][0] * x_3[0] - mat_3x3[2][1] * x_3[1];

  // back substitution
  x_3[2] /= mat_3x3[2][2];
  x_3[1] = (x_3[1] - mat_3x3[1][2] * x_3[2]) / mat_3x3[1][1];
  x_3[0] =
    (x_3[0] - mat_3x3[0][1] * x_3[1] - mat_3x3[0][2] * x_3[2]) / mat_3x3[0][0];
}

function linearSolve3x3(mat_3x3, x_3, y_3) {
  const a1 = mat_3x3[0][0];
  const b1 = mat_3x3[0][1];
  const c1 = mat_3x3[0][2];
  const a2 = mat_3x3[1][0];
  const b2 = mat_3x3[1][1];
  const c2 = mat_3x3[1][2];
  const a3 = mat_3x3[2][0];
  const b3 = mat_3x3[2][1];
  const c3 = mat_3x3[2][2];

  // Compute the adjoint
  const d1 = +determinant2x2(b2, b3, c2, c3);
  const d2 = -determinant2x2(a2, a3, c2, c3);
  const d3 = +determinant2x2(a2, a3, b2, b3);

  const e1 = -determinant2x2(b1, b3, c1, c3);
  const e2 = +determinant2x2(a1, a3, c1, c3);
  const e3 = -determinant2x2(a1, a3, b1, b3);

  const f1 = +determinant2x2(b1, b2, c1, c2);
  const f2 = -determinant2x2(a1, a2, c1, c2);
  const f3 = +determinant2x2(a1, a2, b1, b2);

  // Compute the determinant
  const det = a1 * d1 + b1 * d2 + c1 * d3;

  // Multiply by the adjoint
  const v1 = d1 * x_3[0] + e1 * x_3[1] + f1 * x_3[2];
  const v2 = d2 * x_3[0] + e2 * x_3[1] + f2 * x_3[2];
  const v3 = d3 * x_3[0] + e3 * x_3[1] + f3 * x_3[2];

  // Divide by the determinant
  y_3[0] = v1 / det;
  y_3[1] = v2 / det;
  y_3[2] = v3 / det;
}

function multiply3x3_vect3(mat_3x3, in_3, out_3) {
  const x =
    mat_3x3[0][0] * in_3[0] + mat_3x3[0][1] * in_3[1] + mat_3x3[0][2] * in_3[2];
  const y =
    mat_3x3[1][0] * in_3[0] + mat_3x3[1][1] * in_3[1] + mat_3x3[1][2] * in_3[2];
  const z =
    mat_3x3[2][0] * in_3[0] + mat_3x3[2][1] * in_3[1] + mat_3x3[2][2] * in_3[2];

  out_3[0] = x;
  out_3[1] = y;
  out_3[2] = z;
}

function multiply3x3_mat3(a_3x3, b_3x3, out_3x3) {
  const tmp = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];

  for (let i = 0; i < 3; i++) {
    tmp[0][i] =
      a_3x3[0][0] * b_3x3[0][i] +
      a_3x3[0][1] * b_3x3[1][i] +
      a_3x3[0][2] * b_3x3[2][i];
    tmp[1][i] =
      a_3x3[1][0] * b_3x3[0][i] +
      a_3x3[1][1] * b_3x3[1][i] +
      a_3x3[1][2] * b_3x3[2][i];
    tmp[2][i] =
      a_3x3[2][0] * b_3x3[0][i] +
      a_3x3[2][1] * b_3x3[1][i] +
      a_3x3[2][2] * b_3x3[2][i];
  }

  for (let j = 0; j < 3; j++) {
    out_3x3[j][0] = tmp[j][0];
    out_3x3[j][1] = tmp[j][1];
    out_3x3[j][2] = tmp[j][2];
  }
}

function multiplyMatrix(a, b, rowA, colA, rowB, colB, out_rowXcol) {
  // we need colA == rowB
  if (colA !== rowB) {
    vtkErrorMacro('Number of columns of A must match number of rows of B.');
  }

  // output matrix is rowA*colB
  // output row
  for (let i = 0; i < rowA; i++) {
    // output col
    for (let j = 0; j < colB; j++) {
      out_rowXcol[i][j] = 0;
      // sum for this point
      for (let k = 0; k < colA; k++) {
        out_rowXcol[i][j] += a[i][k] * b[k][j];
      }
    }
  }
}

function transpose3x3(in_3x3, outT_3x3) {
  let tmp;
  tmp = in_3x3[1][0];
  outT_3x3[1][0] = in_3x3[0][1];
  outT_3x3[0][1] = tmp;
  tmp = in_3x3[2][0];
  outT_3x3[2][0] = in_3x3[0][2];
  outT_3x3[0][2] = tmp;
  tmp = in_3x3[2][1];
  outT_3x3[2][1] = in_3x3[1][2];
  outT_3x3[1][2] = tmp;

  outT_3x3[0][0] = in_3x3[0][0];
  outT_3x3[1][1] = in_3x3[1][1];
  outT_3x3[2][2] = in_3x3[2][2];
}

function invert3x3(in_3x3, outI_3x3) {
  const a1 = in_3x3[0][0];
  const b1 = in_3x3[0][1];
  const c1 = in_3x3[0][2];
  const a2 = in_3x3[1][0];
  const b2 = in_3x3[1][1];
  const c2 = in_3x3[1][2];
  const a3 = in_3x3[2][0];
  const b3 = in_3x3[2][1];
  const c3 = in_3x3[2][2];

  // Compute the adjoint
  const d1 = +determinant2x2(b2, b3, c2, c3);
  const d2 = -determinant2x2(a2, a3, c2, c3);
  const d3 = +determinant2x2(a2, a3, b2, b3);

  const e1 = -determinant2x2(b1, b3, c1, c3);
  const e2 = +determinant2x2(a1, a3, c1, c3);
  const e3 = -determinant2x2(a1, a3, b1, b3);

  const f1 = +determinant2x2(b1, b2, c1, c2);
  const f2 = -determinant2x2(a1, a2, c1, c2);
  const f3 = +determinant2x2(a1, a2, b1, b2);

  // Divide by the determinant
  const det = a1 * d1 + b1 * d2 + c1 * d3;

  outI_3x3[0][0] = d1 / det;
  outI_3x3[1][0] = d2 / det;
  outI_3x3[2][0] = d3 / det;

  outI_3x3[0][1] = e1 / det;
  outI_3x3[1][1] = e2 / det;
  outI_3x3[2][1] = e3 / det;

  outI_3x3[0][2] = f1 / det;
  outI_3x3[1][2] = f2 / det;
  outI_3x3[2][2] = f3 / det;
}

function identity3x3(mat_3x3) {
  for (let i = 0; i < 3; i++) {
    mat_3x3[i][0] = mat_3x3[i][1] = mat_3x3[i][2] = 0;
    mat_3x3[i][i] = 1;
  }
}

function determinant3x3(mat_3x3) {
  return (
    mat_3x3[0][0] * mat_3x3[1][1] * mat_3x3[2][2] +
    mat_3x3[1][0] * mat_3x3[2][1] * mat_3x3[0][2] +
    mat_3x3[2][0] * mat_3x3[0][1] * mat_3x3[1][2] -
    mat_3x3[0][0] * mat_3x3[2][1] * mat_3x3[1][2] -
    mat_3x3[1][0] * mat_3x3[0][1] * mat_3x3[2][2] -
    mat_3x3[2][0] * mat_3x3[1][1] * mat_3x3[0][2]
  );
}

function quaternionToMatrix3x3(quat_4, mat_3x3) {
  const ww = quat_4[0] * quat_4[0];
  const wx = quat_4[0] * quat_4[1];
  const wy = quat_4[0] * quat_4[2];
  const wz = quat_4[0] * quat_4[3];

  const xx = quat_4[1] * quat_4[1];
  const yy = quat_4[2] * quat_4[2];
  const zz = quat_4[3] * quat_4[3];

  const xy = quat_4[1] * quat_4[2];
  const xz = quat_4[1] * quat_4[3];
  const yz = quat_4[2] * quat_4[3];

  const rr = xx + yy + zz;
  // normalization factor, just in case quaternion was not normalized
  let f = 1 / (ww + rr);
  const s = (ww - rr) * f;
  f *= 2;

  mat_3x3[0][0] = xx * f + s;
  mat_3x3[1][0] = (xy + wz) * f;
  mat_3x3[2][0] = (xz - wy) * f;

  mat_3x3[0][1] = (xy - wz) * f;
  mat_3x3[1][1] = yy * f + s;
  mat_3x3[2][1] = (yz + wx) * f;

  mat_3x3[0][2] = (xz + wy) * f;
  mat_3x3[1][2] = (yz - wx) * f;
  mat_3x3[2][2] = zz * f + s;
}

function areMatricesEqual(matA, matB) {
  if (!matA.length === matB.length) {
    return false;
  }

  function isEqual(element, index) {
    return element === matB[index];
  }
  return matA.every(isEqual);
}

function jacobiN(a, n, w, v) {
  let i;
  let j;
  let k;
  let iq;
  let ip;
  let numPos;
  let tresh;
  let theta;
  let t;
  let tau;
  let sm;
  let s;
  let h;
  let g;
  let c;
  let tmp;
  const b = createArray(n);
  const z = createArray(n);

  const vtkROTATE = (aa, ii, jj, kk, ll) => {
    g = aa[ii][jj];
    h = aa[kk][ll];
    aa[ii][jj] = g - s * (h + g * tau);
    aa[kk][ll] = h + s * (g - h * tau);
  };

  // initialize
  for (ip = 0; ip < n; ip++) {
    for (iq = 0; iq < n; iq++) {
      v[ip][iq] = 0.0;
    }
    v[ip][ip] = 1.0;
  }
  for (ip = 0; ip < n; ip++) {
    b[ip] = w[ip] = a[ip][ip];
    z[ip] = 0.0;
  }

  // begin rotation sequence
  for (i = 0; i < VTK_MAX_ROTATIONS; i++) {
    sm = 0.0;
    for (ip = 0; ip < n - 1; ip++) {
      for (iq = ip + 1; iq < n; iq++) {
        sm += Math.abs(a[ip][iq]);
      }
    }
    if (sm === 0.0) {
      break;
    }

    // first 3 sweeps
    if (i < 3) {
      tresh = (0.2 * sm) / (n * n);
    } else {
      tresh = 0.0;
    }

    for (ip = 0; ip < n - 1; ip++) {
      for (iq = ip + 1; iq < n; iq++) {
        g = 100.0 * Math.abs(a[ip][iq]);

        // after 4 sweeps
        if (
          i > 3 &&
          Math.abs(w[ip]) + g === Math.abs(w[ip]) &&
          Math.abs(w[iq]) + g === Math.abs(w[iq])
        ) {
          a[ip][iq] = 0.0;
        } else if (Math.abs(a[ip][iq]) > tresh) {
          h = w[iq] - w[ip];
          if (Math.abs(h) + g === Math.abs(h)) {
            t = a[ip][iq] / h;
          } else {
            theta = (0.5 * h) / a[ip][iq];
            t = 1.0 / (Math.abs(theta) + Math.sqrt(1.0 + theta * theta));
            if (theta < 0.0) {
              t = -t;
            }
          }
          c = 1.0 / Math.sqrt(1 + t * t);
          s = t * c;
          tau = s / (1.0 + c);
          h = t * a[ip][iq];
          z[ip] -= h;
          z[iq] += h;
          w[ip] -= h;
          w[iq] += h;
          a[ip][iq] = 0.0;

          // ip already shifted left by 1 unit
          for (j = 0; j <= ip - 1; j++) {
            vtkROTATE(a, j, ip, j, iq);
          }
          // ip and iq already shifted left by 1 unit
          for (j = ip + 1; j <= iq - 1; j++) {
            vtkROTATE(a, ip, j, j, iq);
          }
          // iq already shifted left by 1 unit
          for (j = iq + 1; j < n; j++) {
            vtkROTATE(a, ip, j, iq, j);
          }
          for (j = 0; j < n; j++) {
            vtkROTATE(v, j, ip, j, iq);
          }
        }
      }
    }

    for (ip = 0; ip < n; ip++) {
      b[ip] += z[ip];
      w[ip] = b[ip];
      z[ip] = 0.0;
    }
  }

  // this is NEVER called
  if (i >= VTK_MAX_ROTATIONS) {
    vtkWarningMacro('vtkMath::Jacobi: Error extracting eigenfunctions');
    return 0;
  }

  // sort eigenfunctions: these changes do not affect accuracy
  for (j = 0; j < n - 1; j++) {
    // boundary incorrect
    k = j;
    tmp = w[k];
    for (i = j + 1; i < n; i++) {
      // boundary incorrect, shifted already
      if (w[i] >= tmp) {
        // why exchange if same?
        k = i;
        tmp = w[k];
      }
    }
    if (k !== j) {
      w[k] = w[j];
      w[j] = tmp;
      for (i = 0; i < n; i++) {
        tmp = v[i][j];
        v[i][j] = v[i][k];
        v[i][k] = tmp;
      }
    }
  }
  // ensure eigenvector consistency (i.e., Jacobi can compute vectors that
  // are negative of one another (.707,.707,0) and (-.707,-.707,0). This can
  // reek havoc in hyperstreamline/other stuff. We will select the most
  // positive eigenvector.
  const ceil_half_n = (n >> 1) + (n & 1);
  for (j = 0; j < n; j++) {
    for (numPos = 0, i = 0; i < n; i++) {
      if (v[i][j] >= 0.0) {
        numPos++;
      }
    }
    //    if ( numPos < ceil(double(n)/double(2.0)) )
    if (numPos < ceil_half_n) {
      for (i = 0; i < n; i++) {
        v[i][j] *= -1.0;
      }
    }
  }
  return 1;
}

function matrix3x3ToQuaternion(mat_3x3, quat_4) {
  const tmp = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];

  // on-diagonal elements
  tmp[0][0] = mat_3x3[0][0] + mat_3x3[1][1] + mat_3x3[2][2];
  tmp[1][1] = mat_3x3[0][0] - mat_3x3[1][1] - mat_3x3[2][2];
  tmp[2][2] = -mat_3x3[0][0] + mat_3x3[1][1] - mat_3x3[2][2];
  tmp[3][3] = -mat_3x3[0][0] - mat_3x3[1][1] + mat_3x3[2][2];

  // off-diagonal elements
  tmp[0][1] = tmp[1][0] = mat_3x3[2][1] - mat_3x3[1][2];
  tmp[0][2] = tmp[2][0] = mat_3x3[0][2] - mat_3x3[2][0];
  tmp[0][3] = tmp[3][0] = mat_3x3[1][0] - mat_3x3[0][1];

  tmp[1][2] = tmp[2][1] = mat_3x3[1][0] + mat_3x3[0][1];
  tmp[1][3] = tmp[3][1] = mat_3x3[0][2] + mat_3x3[2][0];
  tmp[2][3] = tmp[3][2] = mat_3x3[2][1] + mat_3x3[1][2];

  const eigenvectors = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
  const eigenvalues = [0, 0, 0, 0];

  // convert into format that JacobiN can use,
  // then use Jacobi to find eigenvalues and eigenvectors
  const NTemp = [0, 0, 0, 0];
  const eigenvectorsTemp = [0, 0, 0, 0];
  for (let i = 0; i < 4; i++) {
    NTemp[i] = tmp[i];
    eigenvectorsTemp[i] = eigenvectors[i];
  }
  jacobiN(NTemp, 4, eigenvalues, eigenvectorsTemp);

  // the first eigenvector is the one we want
  quat_4[0] = eigenvectors[0][0];
  quat_4[1] = eigenvectors[1][0];
  quat_4[2] = eigenvectors[2][0];
  quat_4[3] = eigenvectors[3][0];
}

function multiplyQuaternion(quat_1, quat_2, quat_out) {
  const ww = quat_1[0] * quat_2[0];
  const wx = quat_1[0] * quat_2[1];
  const wy = quat_1[0] * quat_2[2];
  const wz = quat_1[0] * quat_2[3];

  const xw = quat_1[1] * quat_2[0];
  const xx = quat_1[1] * quat_2[1];
  const xy = quat_1[1] * quat_2[2];
  const xz = quat_1[1] * quat_2[3];

  const yw = quat_1[2] * quat_2[0];
  const yx = quat_1[2] * quat_2[1];
  const yy = quat_1[2] * quat_2[2];
  const yz = quat_1[2] * quat_2[3];

  const zw = quat_1[3] * quat_2[0];
  const zx = quat_1[3] * quat_2[1];
  const zy = quat_1[3] * quat_2[2];
  const zz = quat_1[3] * quat_2[3];

  quat_out[0] = ww - xx - yy - zz;
  quat_out[1] = wx + xw + yz - zy;
  quat_out[2] = wy - xz + yw + zx;
  quat_out[3] = wz + xy - yx + zw;
}

function orthogonalize3x3(a_3x3, out_3x3) {
  // copy the matrix
  for (let i = 0; i < 3; i++) {
    out_3x3[0][i] = a_3x3[0][i];
    out_3x3[1][i] = a_3x3[1][i];
    out_3x3[2][i] = a_3x3[2][i];
  }

  // Pivot the matrix to improve accuracy
  const scale = createArray(3);
  const index = createArray(3);
  let largest;

  // Loop over rows to get implicit scaling information
  for (let i = 0; i < 3; i++) {
    const x1 = Math.abs(out_3x3[i][0]);
    const x2 = Math.abs(out_3x3[i][1]);
    const x3 = Math.abs(out_3x3[i][2]);
    largest = x2 > x1 ? x2 : x1;
    largest = x3 > largest ? x3 : largest;
    scale[i] = 1;
    if (largest !== 0) {
      scale[i] /= largest;
    }
  }

  // first column
  const x1 = Math.abs(out_3x3[0][0]) * scale[0];
  const x2 = Math.abs(out_3x3[1][0]) * scale[1];
  const x3 = Math.abs(out_3x3[2][0]) * scale[2];
  index[0] = 0;
  largest = x1;
  if (x2 >= largest) {
    largest = x2;
    index[0] = 1;
  }
  if (x3 >= largest) {
    index[0] = 2;
  }
  if (index[0] !== 0) {
    vtkSwapVectors3(out_3x3[index[0]], out_3x3[0]);
    scale[index[0]] = scale[0];
  }

  // second column
  const y2 = Math.abs(out_3x3[1][1]) * scale[1];
  const y3 = Math.abs(out_3x3[2][1]) * scale[2];
  index[1] = 1;
  largest = y2;
  if (y3 >= largest) {
    index[1] = 2;
    vtkSwapVectors3(out_3x3[2], out_3x3[1]);
  }

  // third column
  index[2] = 2;

  // A quaternion can only describe a pure rotation, not
  // a rotation with a flip, therefore the flip must be
  // removed before the matrix is converted to a quaternion.
  let flip = 0;
  if (determinant3x3(out_3x3) < 0) {
    flip = 1;
    for (let i = 0; i < 3; i++) {
      out_3x3[0][i] = -out_3x3[0][i];
      out_3x3[1][i] = -out_3x3[1][i];
      out_3x3[2][i] = -out_3x3[2][i];
    }
  }

  // Do orthogonalization using a quaternion intermediate
  // (this, essentially, does the orthogonalization via
  // diagonalization of an appropriately constructed symmetric
  // 4x4 matrix rather than by doing SVD of the 3x3 matrix)
  const quat = createArray(4);
  matrix3x3ToQuaternion(out_3x3, quat);
  quaternionToMatrix3x3(quat, out_3x3);

  // Put the flip back into the orthogonalized matrix.
  if (flip) {
    for (let i = 0; i < 3; i++) {
      out_3x3[0][i] = -out_3x3[0][i];
      out_3x3[1][i] = -out_3x3[1][i];
      out_3x3[2][i] = -out_3x3[2][i];
    }
  }

  // Undo the pivoting
  if (index[1] !== 1) {
    vtkSwapVectors3(out_3x3[index[1]], out_3x3[1]);
  }
  if (index[0] !== 0) {
    vtkSwapVectors3(out_3x3[index[0]], out_3x3[0]);
  }
}

function diagonalize3x3(a_3x3, w_3, v_3x3) {
  let i;
  let j;
  let k;
  let maxI;
  let tmp;
  let maxVal;

  // do the matrix[3][3] to **matrix conversion for Jacobi
  const C = [createArray(3), createArray(3), createArray(3)];
  const ATemp = createArray(3);
  const VTemp = createArray(3);
  for (i = 0; i < 3; i++) {
    C[i][0] = a_3x3[i][0];
    C[i][1] = a_3x3[i][1];
    C[i][2] = a_3x3[i][2];
    ATemp[i] = C[i];
    VTemp[i] = v_3x3[i];
  }

  // diagonalize using Jacobi
  jacobiN(ATemp, 3, w_3, VTemp);

  // if all the eigenvalues are the same, return identity matrix
  if (w_3[0] === w_3[1] && w_3[0] === w_3[2]) {
    identity3x3(v_3x3);
    return;
  }

  // transpose temporarily, it makes it easier to sort the eigenvectors
  transpose3x3(v_3x3, v_3x3);

  // if two eigenvalues are the same, re-orthogonalize to optimally line
  // up the eigenvectors with the x, y, and z axes
  for (i = 0; i < 3; i++) {
    // two eigenvalues are the same
    if (w_3[(i + 1) % 3] === w_3[(i + 2) % 3]) {
      // find maximum element of the independent eigenvector
      maxVal = Math.abs(v_3x3[i][0]);
      maxI = 0;
      for (j = 1; j < 3; j++) {
        if (maxVal < (tmp = Math.abs(v_3x3[i][j]))) {
          maxVal = tmp;
          maxI = j;
        }
      }
      // swap the eigenvector into its proper position
      if (maxI !== i) {
        tmp = w_3[maxI];
        w_3[maxI] = w_3[i];
        w_3[i] = tmp;
        vtkSwapVectors3(v_3x3[i], v_3x3[maxI]);
      }
      // maximum element of eigenvector should be positive
      if (v_3x3[maxI][maxI] < 0) {
        v_3x3[maxI][0] = -v_3x3[maxI][0];
        v_3x3[maxI][1] = -v_3x3[maxI][1];
        v_3x3[maxI][2] = -v_3x3[maxI][2];
      }

      // re-orthogonalize the other two eigenvectors
      j = (maxI + 1) % 3;
      k = (maxI + 2) % 3;

      v_3x3[j][0] = 0.0;
      v_3x3[j][1] = 0.0;
      v_3x3[j][2] = 0.0;
      v_3x3[j][j] = 1.0;
      cross(v_3x3[maxI], v_3x3[j], v_3x3[k]);
      normalize(v_3x3[k]);
      cross(v_3x3[k], v_3x3[maxI], v_3x3[j]);

      // transpose vectors back to columns
      transpose3x3(v_3x3, v_3x3);
      return;
    }
  }

  // the three eigenvalues are different, just sort the eigenvectors
  // to align them with the x, y, and z axes

  // find the vector with the largest x element, make that vector
  // the first vector
  maxVal = Math.abs(v_3x3[0][0]);
  maxI = 0;
  for (i = 1; i < 3; i++) {
    if (maxVal < (tmp = Math.abs(v_3x3[i][0]))) {
      maxVal = tmp;
      maxI = i;
    }
  }
  // swap eigenvalue and eigenvector
  if (maxI !== 0) {
    tmp = w_3[maxI];
    w_3[maxI] = w_3[0];
    w_3[0] = tmp;
    vtkSwapVectors3(v_3x3[maxI], v_3x3[0]);
  }
  // do the same for the y element
  if (Math.abs(v_3x3[1][1]) < Math.abs(v_3x3[2][1])) {
    tmp = w_3[2];
    w_3[2] = w_3[1];
    w_3[1] = tmp;
    vtkSwapVectors3(v_3x3[2], v_3x3[1]);
  }

  // ensure that the sign of the eigenvectors is correct
  for (i = 0; i < 2; i++) {
    if (v_3x3[i][i] < 0) {
      v_3x3[i][0] = -v_3x3[i][0];
      v_3x3[i][1] = -v_3x3[i][1];
      v_3x3[i][2] = -v_3x3[i][2];
    }
  }
  // set sign of final eigenvector to ensure that determinant is positive
  if (determinant3x3(v_3x3) < 0) {
    v_3x3[2][0] = -v_3x3[2][0];
    v_3x3[2][1] = -v_3x3[2][1];
    v_3x3[2][2] = -v_3x3[2][2];
  }

  // transpose the eigenvectors back again
  transpose3x3(v_3x3, v_3x3);
}

function singularValueDecomposition3x3(a_3x3, u_3x3, w_3, vT_3x3) {
  let i;
  const B = [createArray(3), createArray(3), createArray(3)];

  // copy so that A can be used for U or VT without risk
  for (i = 0; i < 3; i++) {
    B[0][i] = a_3x3[0][i];
    B[1][i] = a_3x3[1][i];
    B[2][i] = a_3x3[2][i];
  }

  // temporarily flip if determinant is negative
  const d = determinant3x3(B);
  if (d < 0) {
    for (i = 0; i < 3; i++) {
      B[0][i] = -B[0][i];
      B[1][i] = -B[1][i];
      B[2][i] = -B[2][i];
    }
  }

  // orthogonalize, diagonalize, etc.
  orthogonalize3x3(B, u_3x3);
  transpose3x3(B, B);
  multiply3x3_mat3(B, u_3x3, vT_3x3);
  diagonalize3x3(vT_3x3, w_3, vT_3x3);
  multiply3x3_mat3(u_3x3, vT_3x3, u_3x3);
  transpose3x3(vT_3x3, vT_3x3);

  // re-create the flip
  if (d < 0) {
    w_3[0] = -w_3[0];
    w_3[1] = -w_3[1];
    w_3[2] = -w_3[2];
  }
}

function luFactorLinearSystem(A, index, size) {
  let i;
  let j;
  let k;
  let largest;
  let maxI = 0;
  let sum;
  let temp1;
  let temp2;
  const scale = createArray(size);

  //
  // Loop over rows to get implicit scaling information
  //
  for (i = 0; i < size; i++) {
    for (largest = 0.0, j = 0; j < size; j++) {
      if ((temp2 = Math.abs(A[i][j])) > largest) {
        largest = temp2;
      }
    }

    if (largest === 0.0) {
      vtkWarningMacro('Unable to factor linear system');
      return 0;
    }
    scale[i] = 1.0 / largest;
  }
  //
  // Loop over all columns using Crout's method
  //
  for (j = 0; j < size; j++) {
    for (i = 0; i < j; i++) {
      sum = A[i][j];
      for (k = 0; k < i; k++) {
        sum -= A[i][k] * A[k][j];
      }
      A[i][j] = sum;
    }
    //
    // Begin search for largest pivot element
    //
    for (largest = 0.0, i = j; i < size; i++) {
      sum = A[i][j];
      for (k = 0; k < j; k++) {
        sum -= A[i][k] * A[k][j];
      }
      A[i][j] = sum;

      if ((temp1 = scale[i] * Math.abs(sum)) >= largest) {
        largest = temp1;
        maxI = i;
      }
    }
    //
    // Check for row interchange
    //
    if (j !== maxI) {
      for (k = 0; k < size; k++) {
        temp1 = A[maxI][k];
        A[maxI][k] = A[j][k];
        A[j][k] = temp1;
      }
      scale[maxI] = scale[j];
    }
    //
    // Divide by pivot element and perform elimination
    //
    index[j] = maxI;

    if (Math.abs(A[j][j]) <= VTK_SMALL_NUMBER) {
      vtkWarningMacro('Unable to factor linear system');
      return 0;
    }

    if (j !== size - 1) {
      temp1 = 1.0 / A[j][j];
      for (i = j + 1; i < size; i++) {
        A[i][j] *= temp1;
      }
    }
  }
  return 1;
}

function luSolveLinearSystem(A, index, x, size) {
  let i;
  let j;
  let ii;
  let idx;
  let sum;
  //
  // Proceed with forward and backsubstitution for L and U
  // matrices.  First, forward substitution.
  //
  for (ii = -1, i = 0; i < size; i++) {
    idx = index[i];
    sum = x[idx];
    x[idx] = x[i];

    if (ii >= 0) {
      for (j = ii; j <= i - 1; j++) {
        sum -= A[i][j] * x[j];
      }
    } else if (sum !== 0.0) {
      ii = i;
    }

    x[i] = sum;
  }
  //
  // Now, back substitution
  //
  for (i = size - 1; i >= 0; i--) {
    sum = x[i];
    for (j = i + 1; j < size; j++) {
      sum -= A[i][j] * x[j];
    }
    x[i] = sum / A[i][i];
  }
}

function solveLinearSystem(A, x, size) {
  // if we solving something simple, just solve it
  if (size === 2) {
    const y = createArray(2);
    const det = determinant2x2(A[0][0], A[0][1], A[1][0], A[1][1]);

    if (det === 0.0) {
      // Unable to solve linear system
      return 0;
    }

    y[0] = (A[1][1] * x[0] - A[0][1] * x[1]) / det;
    y[1] = (-(A[1][0] * x[0]) + A[0][0] * x[1]) / det;

    x[0] = y[0];
    x[1] = y[1];
    return 1;
  }

  if (size === 1) {
    if (A[0][0] === 0.0) {
      // Unable to solve linear system
      return 0;
    }

    x[0] /= A[0][0];
    return 1;
  }

  //
  // System of equations is not trivial, use Crout's method
  //

  // Check on allocation of working vectors
  const index = createArray(size);

  // Factor and solve matrix
  if (luFactorLinearSystem(A, index, size) === 0) {
    return 0;
  }
  luSolveLinearSystem(A, index, x, size);

  return 1;
}

function invertMatrix(A, AI, size, index = null, column = null) {
  const tmp1Size = index || createArray(size);
  const tmp2Size = column || createArray(size);

  // Factor matrix; then begin solving for inverse one column at a time.
  // Note: tmp1Size returned value is used later, tmp2Size is just working
  // memory whose values are not used in LUSolveLinearSystem
  if (luFactorLinearSystem(A, tmp1Size, size, tmp2Size) === 0) {
    return 0;
  }

  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      tmp2Size[i] = 0.0;
    }
    tmp2Size[j] = 1.0;

    luSolveLinearSystem(A, tmp1Size, tmp2Size, size);

    for (let i = 0; i < size; i++) {
      AI[i][j] = tmp2Size[i];
    }
  }

  return 1;
}

function estimateMatrixCondition(A, size) {
  let minValue = +Number.MAX_VALUE;
  let maxValue = -Number.MAX_VALUE;

  // find the maximum value
  for (let i = 0; i < size; i++) {
    for (let j = i; j < size; j++) {
      if (Math.abs(A[i][j]) > max) {
        maxValue = Math.abs(A[i][j]);
      }
    }
  }

  // find the minimum diagonal value
  for (let i = 0; i < size; i++) {
    if (Math.abs(A[i][i]) < min) {
      minValue = Math.abs(A[i][i]);
    }
  }

  if (minValue === 0.0) {
    return Number.MAX_VALUE;
  }
  return maxValue / minValue;
}

function jacobi(a_3x3, w, v) {
  return jacobiN(a_3x3, 3, w, v);
}

function solveHomogeneousLeastSquares(numberOfSamples, xt, xOrder, mt) {
  // check dimensional consistency
  if (numberOfSamples < xOrder) {
    vtkWarningMacro('Insufficient number of samples. Underdetermined.');
    return 0;
  }

  let i;
  let j;
  let k;

  // set up intermediate variables
  // Allocate matrix to hold X times transpose of X
  const XXt = createArray(xOrder); // size x by x
  // Allocate the array of eigenvalues and eigenvectors
  const eigenvals = createArray(xOrder);
  const eigenvecs = createArray(xOrder);

  // Clear the upper triangular region (and btw, allocate the eigenvecs as well)
  for (i = 0; i < xOrder; i++) {
    eigenvecs[i] = createArray(xOrder);
    XXt[i] = createArray(xOrder);
    for (j = 0; j < xOrder; j++) {
      XXt[i][j] = 0.0;
    }
  }

  // Calculate XXt upper half only, due to symmetry
  for (k = 0; k < numberOfSamples; k++) {
    for (i = 0; i < xOrder; i++) {
      for (j = i; j < xOrder; j++) {
        XXt[i][j] += xt[k][i] * xt[k][j];
      }
    }
  }

  // now fill in the lower half of the XXt matrix
  for (i = 0; i < xOrder; i++) {
    for (j = 0; j < i; j++) {
      XXt[i][j] = XXt[j][i];
    }
  }

  // Compute the eigenvectors and eigenvalues
  jacobiN(XXt, xOrder, eigenvals, eigenvecs);

  // Smallest eigenval is at the end of the list (xOrder-1), and solution is
  // corresponding eigenvec.
  for (i = 0; i < xOrder; i++) {
    mt[i][0] = eigenvecs[i][xOrder - 1];
  }

  return 1;
}

function solveLeastSquares(
  numberOfSamples,
  xt,
  xOrder,
  yt,
  yOrder,
  mt,
  checkHomogeneous = true
) {
  // check dimensional consistency
  if (numberOfSamples < xOrder || numberOfSamples < yOrder) {
    vtkWarningMacro('Insufficient number of samples. Underdetermined.');
    return 0;
  }

  const homogenFlags = createArray(yOrder);
  let allHomogeneous = 1;
  let hmt;
  let homogRC = 0;
  let i;
  let j;
  let k;
  let someHomogeneous = 0;

  // Ok, first init some flags check and see if all the systems are homogeneous
  if (checkHomogeneous) {
    // If Y' is zero, it's a homogeneous system and can't be solved via
    // the pseudoinverse method. Detect this case, warn the user, and
    // invoke SolveHomogeneousLeastSquares instead. Note that it doesn't
    // really make much sense for yOrder to be greater than one in this case,
    // since that's just yOrder occurrences of a 0 vector on the RHS, but
    // we allow it anyway. N

    // Initialize homogeneous flags on a per-right-hand-side basis
    for (j = 0; j < yOrder; j++) {
      homogenFlags[j] = 1;
    }
    for (i = 0; i < numberOfSamples; i++) {
      for (j = 0; j < yOrder; j++) {
        if (Math.abs(yt[i][j]) > VTK_SMALL_NUMBER) {
          allHomogeneous = 0;
          homogenFlags[j] = 0;
        }
      }
    }

    // If we've got one system, and it's homogeneous, do it and bail out quickly.
    if (allHomogeneous && yOrder === 1) {
      vtkWarningMacro(
        'Detected homogeneous system (Y=0), calling SolveHomogeneousLeastSquares()'
      );
      return solveHomogeneousLeastSquares(numberOfSamples, xt, xOrder, mt);
    }

    // Ok, we've got more than one system of equations.
    // Figure out if we need to calculate the homogeneous equation solution for
    // any of them.
    if (allHomogeneous) {
      someHomogeneous = 1;
    } else {
      for (j = 0; j < yOrder; j++) {
        if (homogenFlags[j]) {
          someHomogeneous = 1;
        }
      }
    }
  }

  // If necessary, solve the homogeneous problem
  if (someHomogeneous) {
    // hmt is the homogeneous equation version of mt, the general solution.
    hmt = createArray(xOrder);
    for (j = 0; j < xOrder; j++) {
      // Only allocate 1 here, not yOrder, because here we're going to solve
      // just the one homogeneous equation subset of the entire problem
      hmt[j] = [0];
    }

    // Ok, solve the homogeneous problem
    homogRC = solveHomogeneousLeastSquares(numberOfSamples, xt, xOrder, hmt);
  }

  // set up intermediate variables
  const XXt = createArray(xOrder); // size x by x
  const XXtI = createArray(xOrder); // size x by x
  const XYt = createArray(xOrder); // size x by y
  for (i = 0; i < xOrder; i++) {
    XXt[i] = createArray(xOrder);
    XXtI[i] = createArray(xOrder);

    for (j = 0; j < xOrder; j++) {
      XXt[i][j] = 0.0;
      XXtI[i][j] = 0.0;
    }

    XYt[i] = createArray(yOrder);
    for (j = 0; j < yOrder; j++) {
      XYt[i][j] = 0.0;
    }
  }

  // first find the pseudoinverse matrix
  for (k = 0; k < numberOfSamples; k++) {
    for (i = 0; i < xOrder; i++) {
      // first calculate the XXt matrix, only do the upper half (symmetrical)
      for (j = i; j < xOrder; j++) {
        XXt[i][j] += xt[k][i] * xt[k][j];
      }

      // now calculate the XYt matrix
      for (j = 0; j < yOrder; j++) {
        XYt[i][j] += xt[k][i] * yt[k][j];
      }
    }
  }

  // now fill in the lower half of the XXt matrix
  for (i = 0; i < xOrder; i++) {
    for (j = 0; j < i; j++) {
      XXt[i][j] = XXt[j][i];
    }
  }

  const successFlag = invertMatrix(XXt, XXtI, xOrder);

  // next get the inverse of XXt
  if (successFlag) {
    for (i = 0; i < xOrder; i++) {
      for (j = 0; j < yOrder; j++) {
        mt[i][j] = 0.0;
        for (k = 0; k < xOrder; k++) {
          mt[i][j] += XXtI[i][k] * XYt[k][j];
        }
      }
    }
  }

  // Fix up any of the solutions that correspond to the homogeneous equation
  // problem.
  if (someHomogeneous) {
    for (j = 0; j < yOrder; j++) {
      if (homogenFlags[j]) {
        // Fix this one
        for (i = 0; i < xOrder; i++) {
          mt[i][j] = hmt[i][0];
        }
      }
    }
  }

  if (someHomogeneous) {
    return homogRC && successFlag;
  }

  return successFlag;
}

function hex2float(hexStr, outFloatArray = [0, 0.5, 1]) {
  switch (hexStr.length) {
    case 3: // abc => #aabbcc
      outFloatArray[0] = (parseInt(hexStr[0], 16) * 17) / 255;
      outFloatArray[1] = (parseInt(hexStr[1], 16) * 17) / 255;
      outFloatArray[2] = (parseInt(hexStr[2], 16) * 17) / 255;
      return outFloatArray;
    case 4: // #abc => #aabbcc
      outFloatArray[0] = (parseInt(hexStr[1], 16) * 17) / 255;
      outFloatArray[1] = (parseInt(hexStr[2], 16) * 17) / 255;
      outFloatArray[2] = (parseInt(hexStr[3], 16) * 17) / 255;
      return outFloatArray;
    case 6: // ab01df => #ab01df
      outFloatArray[0] = parseInt(hexStr.substr(0, 2), 16) / 255;
      outFloatArray[1] = parseInt(hexStr.substr(2, 2), 16) / 255;
      outFloatArray[2] = parseInt(hexStr.substr(4, 2), 16) / 255;
      return outFloatArray;
    case 7: // #ab01df
      outFloatArray[0] = parseInt(hexStr.substr(1, 2), 16) / 255;
      outFloatArray[1] = parseInt(hexStr.substr(3, 2), 16) / 255;
      outFloatArray[2] = parseInt(hexStr.substr(5, 2), 16) / 255;
      return outFloatArray;
    case 9: // #ab01df00
      outFloatArray[0] = parseInt(hexStr.substr(1, 2), 16) / 255;
      outFloatArray[1] = parseInt(hexStr.substr(3, 2), 16) / 255;
      outFloatArray[2] = parseInt(hexStr.substr(5, 2), 16) / 255;
      outFloatArray[3] = parseInt(hexStr.substr(7, 2), 16) / 255;
      return outFloatArray;
    default:
      return outFloatArray;
  }
}

function rgb2hsv(rgb, hsv) {
  let h;
  let s;
  const [r, g, b] = rgb;
  const onethird = 1.0 / 3.0;
  const onesixth = 1.0 / 6.0;
  const twothird = 2.0 / 3.0;

  let cmax = r;
  let cmin = r;

  if (g > cmax) {
    cmax = g;
  } else if (g < cmin) {
    cmin = g;
  }
  if (b > cmax) {
    cmax = b;
  } else if (b < cmin) {
    cmin = b;
  }
  const v = cmax;

  if (v > 0.0) {
    s = (cmax - cmin) / cmax;
  } else {
    s = 0.0;
  }
  if (s > 0) {
    if (r === cmax) {
      h = (onesixth * (g - b)) / (cmax - cmin);
    } else if (g === cmax) {
      h = onethird + (onesixth * (b - r)) / (cmax - cmin);
    } else {
      h = twothird + (onesixth * (r - g)) / (cmax - cmin);
    }
    if (h < 0.0) {
      h += 1.0;
    }
  } else {
    h = 0.0;
  }

  // Set the values back to the array
  hsv[0] = h;
  hsv[1] = s;
  hsv[2] = v;
}

function hsv2rgb(hsv, rgb) {
  const [h, s, v] = hsv;
  const onethird = 1.0 / 3.0;
  const onesixth = 1.0 / 6.0;
  const twothird = 2.0 / 3.0;
  const fivesixth = 5.0 / 6.0;
  let r;
  let g;
  let b;

  // compute RGB from HSV
  if (h > onesixth && h <= onethird) {
    // green/red
    g = 1.0;
    r = (onethird - h) / onesixth;
    b = 0.0;
  } else if (h > onethird && h <= 0.5) {
    // green/blue
    g = 1.0;
    b = (h - onethird) / onesixth;
    r = 0.0;
  } else if (h > 0.5 && h <= twothird) {
    // blue/green
    b = 1.0;
    g = (twothird - h) / onesixth;
    r = 0.0;
  } else if (h > twothird && h <= fivesixth) {
    // blue/red
    b = 1.0;
    r = (h - twothird) / onesixth;
    g = 0.0;
  } else if (h > fivesixth && h <= 1.0) {
    // red/blue
    r = 1.0;
    b = (1.0 - h) / onesixth;
    g = 0.0;
  } else {
    // red/green
    r = 1.0;
    g = h / onesixth;
    b = 0.0;
  }

  // add Saturation to the equation.
  r = s * r + (1.0 - s);
  g = s * g + (1.0 - s);
  b = s * b + (1.0 - s);

  r *= v;
  g *= v;
  b *= v;

  // Assign back to the array
  rgb[0] = r;
  rgb[1] = g;
  rgb[2] = b;
}

function lab2xyz(lab, xyz) {
  // LAB to XYZ
  const [L, a, b] = lab;
  let var_Y = (L + 16) / 116;
  let var_X = a / 500 + var_Y;
  let var_Z = var_Y - b / 200;

  if (var_Y ** 3 > 0.008856) {
    var_Y **= 3;
  } else {
    var_Y = (var_Y - 16.0 / 116.0) / 7.787;
  }

  if (var_X ** 3 > 0.008856) {
    var_X **= 3;
  } else {
    var_X = (var_X - 16.0 / 116.0) / 7.787;
  }

  if (var_Z ** 3 > 0.008856) {
    var_Z **= 3;
  } else {
    var_Z = (var_Z - 16.0 / 116.0) / 7.787;
  }
  const ref_X = 0.9505;
  const ref_Y = 1.0;
  const ref_Z = 1.089;
  xyz[0] = ref_X * var_X; // ref_X = 0.9505  Observer= 2 deg Illuminant= D65
  xyz[1] = ref_Y * var_Y; // ref_Y = 1.000
  xyz[2] = ref_Z * var_Z; // ref_Z = 1.089
}

function xyz2lab(xyz, lab) {
  const [x, y, z] = xyz;
  const ref_X = 0.9505;
  const ref_Y = 1.0;
  const ref_Z = 1.089;
  let var_X = x / ref_X; // ref_X = 0.9505  Observer= 2 deg, Illuminant= D65
  let var_Y = y / ref_Y; // ref_Y = 1.000
  let var_Z = z / ref_Z; // ref_Z = 1.089

  if (var_X > 0.008856) var_X **= 1.0 / 3.0;
  else var_X = 7.787 * var_X + 16.0 / 116.0;
  if (var_Y > 0.008856) var_Y **= 1.0 / 3.0;
  else var_Y = 7.787 * var_Y + 16.0 / 116.0;
  if (var_Z > 0.008856) var_Z **= 1.0 / 3.0;
  else var_Z = 7.787 * var_Z + 16.0 / 116.0;

  lab[0] = 116 * var_Y - 16;
  lab[1] = 500 * (var_X - var_Y);
  lab[2] = 200 * (var_Y - var_Z);
}

function xyz2rgb(xyz, rgb) {
  const [x, y, z] = xyz;
  let r = x * 3.2406 + y * -1.5372 + z * -0.4986;
  let g = x * -0.9689 + y * 1.8758 + z * 0.0415;
  let b = x * 0.0557 + y * -0.204 + z * 1.057;

  // The following performs a "gamma correction" specified by the sRGB color
  // space.  sRGB is defined by a canonical definition of a display monitor and
  // has been standardized by the International Electrotechnical Commission (IEC
  // 61966-2-1).  The nonlinearity of the correction is designed to make the
  // colors more perceptually uniform.  This color space has been adopted by
  // several applications including Adobe Photoshop and Microsoft Windows color
  // management.  OpenGL is agnostic on its RGB color space, but it is reasonable
  // to assume it is close to this one.
  if (r > 0.0031308) r = 1.055 * r ** (1 / 2.4) - 0.055;
  else r *= 12.92;
  if (g > 0.0031308) g = 1.055 * g ** (1 / 2.4) - 0.055;
  else g *= 12.92;
  if (b > 0.0031308) b = 1.055 * b ** (1 / 2.4) - 0.055;
  else b *= 12.92;

  // Clip colors. ideally we would do something that is perceptually closest
  // (since we can see colors outside of the display gamut), but this seems to
  // work well enough.
  let maxVal = r;
  if (maxVal < g) maxVal = g;
  if (maxVal < b) maxVal = b;
  if (maxVal > 1.0) {
    r /= maxVal;
    g /= maxVal;
    b /= maxVal;
  }
  if (r < 0) r = 0;
  if (g < 0) g = 0;
  if (b < 0) b = 0;

  // Push values back to array
  rgb[0] = r;
  rgb[1] = g;
  rgb[2] = b;
}

function rgb2xyz(rgb, xyz) {
  let [r, g, b] = rgb;
  // The following performs a "gamma correction" specified by the sRGB color
  // space.  sRGB is defined by a canonical definition of a display monitor and
  // has been standardized by the International Electrotechnical Commission (IEC
  // 61966-2-1).  The nonlinearity of the correction is designed to make the
  // colors more perceptually uniform.  This color space has been adopted by
  // several applications including Adobe Photoshop and Microsoft Windows color
  // management.  OpenGL is agnostic on its RGB color space, but it is reasonable
  // to assume it is close to this one.
  if (r > 0.04045) r = ((r + 0.055) / 1.055) ** 2.4;
  else r /= 12.92;
  if (g > 0.04045) g = ((g + 0.055) / 1.055) ** 2.4;
  else g /= 12.92;
  if (b > 0.04045) b = ((b + 0.055) / 1.055) ** 2.4;
  else b /= 12.92;

  // Observer. = 2 deg, Illuminant = D65
  xyz[0] = r * 0.4124 + g * 0.3576 + b * 0.1805;
  xyz[1] = r * 0.2126 + g * 0.7152 + b * 0.0722;
  xyz[2] = r * 0.0193 + g * 0.1192 + b * 0.9505;
}

function rgb2lab(rgb, lab) {
  const xyz = [0, 0, 0];
  rgb2xyz(rgb, xyz);
  xyz2lab(xyz, lab);
}

function lab2rgb(lab, rgb) {
  const xyz = [0, 0, 0];
  lab2xyz(lab, xyz);
  xyz2rgb(xyz, rgb);
}

function uninitializeBounds(bounds) {
  bounds[0] = 1.0;
  bounds[1] = -1.0;
  bounds[2] = 1.0;
  bounds[3] = -1.0;
  bounds[4] = 1.0;
  bounds[5] = -1.0;
}

function areBoundsInitialized(bounds) {
  return !(bounds[1] - bounds[0] < 0.0);
}

function clampValue(value, minValue, maxValue) {
  if (value < minValue) {
    return minValue;
  }
  if (value > maxValue) {
    return maxValue;
  }
  return value;
}

function clampAndNormalizeValue(value, range) {
  let result = 0;
  if (range[0] !== range[1]) {
    // clamp
    if (value < range[0]) {
      result = range[0];
    } else if (value > range[1]) {
      result = range[1];
    } else {
      result = value;
    }
    // normalize
    result = (result - range[0]) / (range[1] - range[0]);
  }

  return result;
}

const getScalarTypeFittingRange = notImplemented('GetScalarTypeFittingRange');
const getAdjustedScalarRange = notImplemented('GetAdjustedScalarRange');

function extentIsWithinOtherExtent(extent1, extent2) {
  if (!extent1 || !extent2) {
    return 0;
  }

  for (let i = 0; i < 6; i += 2) {
    if (
      extent1[i] < extent2[i] ||
      extent1[i] > extent2[i + 1] ||
      extent1[i + 1] < extent2[i] ||
      extent1[i + 1] > extent2[i + 1]
    ) {
      return 0;
    }
  }

  return 1;
}

function boundsIsWithinOtherBounds(bounds1_6, bounds2_6, delta_3) {
  if (!bounds1_6 || !bounds2_6) {
    return 0;
  }
  for (let i = 0; i < 6; i += 2) {
    if (
      bounds1_6[i] + delta_3[i / 2] < bounds2_6[i] ||
      bounds1_6[i] - delta_3[i / 2] > bounds2_6[i + 1] ||
      bounds1_6[i + 1] + delta_3[i / 2] < bounds2_6[i] ||
      bounds1_6[i + 1] - delta_3[i / 2] > bounds2_6[i + 1]
    ) {
      return 0;
    }
  }
  return 1;
}

function pointIsWithinBounds(point_3, bounds_6, delta_3) {
  if (!point_3 || !bounds_6 || !delta_3) {
    return 0;
  }
  for (let i = 0; i < 3; i++) {
    if (
      point_3[i] + delta_3[i] < bounds_6[2 * i] ||
      point_3[i] - delta_3[i] > bounds_6[2 * i + 1]
    ) {
      return 0;
    }
  }
  return 1;
}

function solve3PointCircle(p1, p2, p3, center) {
  const v21 = createArray(3);
  const v32 = createArray(3);
  const v13 = createArray(3);
  const v12 = createArray(3);
  const v23 = createArray(3);
  const v31 = createArray(3);

  for (let i = 0; i < 3; ++i) {
    v21[i] = p1[i] - p2[i];
    v32[i] = p2[i] - p3[i];
    v13[i] = p3[i] - p1[i];
    v12[i] = -v21[i];
    v23[i] = -v32[i];
    v31[i] = -v13[i];
  }

  const norm12 = norm(v12);
  const norm23 = norm(v23);
  const norm13 = norm(v13);

  const crossv21v32 = createArray(3);
  cross(v21, v32, crossv21v32);
  const normCross = norm(crossv21v32);

  const radius = (norm12 * norm23 * norm13) / (2 * normCross);

  const normCross22 = 2 * normCross * normCross;
  const alpha = (norm23 * norm23 * dot(v21, v31)) / normCross22;
  const beta = (norm13 * norm13 * dot(v12, v32)) / normCross22;
  const gamma = (norm12 * norm12 * dot(v13, v23)) / normCross22;

  for (let i = 0; i < 3; ++i) {
    center[i] = alpha * p1[i] + beta * p2[i] + gamma * p3[i];
  }
  return radius;
}

const inf = Infinity;
const negInf = -Infinity;

const isInf = (value) => !Number.isFinite(value);
const { isFinite, isNaN } = Number;

// JavaScript - add-on ----------------------

function createUninitializedBounds() {
  return [].concat([
    Number.MAX_VALUE,
    -Number.MAX_VALUE, // X
    Number.MAX_VALUE,
    -Number.MAX_VALUE, // Y
    Number.MAX_VALUE,
    -Number.MAX_VALUE, // Z
  ]);
}

function getMajorAxisIndex(vector) {
  let maxValue = -1;
  let axisIndex = -1;
  for (let i = 0; i < vector.length; i++) {
    const value = Math.abs(vector[i]);
    if (value > maxValue) {
      axisIndex = i;
      maxValue = value;
    }
  }

  return axisIndex;
}

function floatToHex2(value) {
  const integer = Math.floor(value * 255);
  if (integer > 15) {
    return integer.toString(16);
  }
  return `0${integer.toString(16)}`;
}

function floatRGB2HexCode(rgbArray, prefix = '#') {
  return `${prefix}${rgbArray.map(floatToHex2).join('')}`;
}

function floatToChar(f) {
  return Math.round(f * 255);
}

function float2CssRGBA(rgbArray) {
  if (rgbArray.length === 3) {
    return `rgb(${rgbArray.map(floatToChar).join(', ')})`;
  }
  return `rgba(${floatToChar(rgbArray[0] || 0)}, ${floatToChar(
    rgbArray[1] || 0
  )}, ${floatToChar(rgbArray[2] || 0)}, ${rgbArray[3] || 0})`;
}

// ----------------------------------------------------------------------------
// Only Static API
// ----------------------------------------------------------------------------

export default {
  Pi,
  radiansFromDegrees,
  degreesFromRadians,
  round,
  floor,
  ceil,
  ceilLog2,
  min,
  max,
  arrayMin,
  arrayMax,
  isPowerOfTwo,
  nearestPowerOfTwo,
  factorial,
  binomial,
  beginCombination,
  nextCombination,
  randomSeed,
  getSeed,
  random,
  gaussian,
  add,
  subtract,
  multiplyScalar,
  multiplyScalar2D,
  dot,
  outer,
  cross,
  norm,
  normalize,
  perpendiculars,
  projectVector,
  projectVector2D,
  distance2BetweenPoints,
  angleBetweenVectors,
  gaussianAmplitude,
  gaussianWeight,
  dot2D,
  outer2D,
  norm2D,
  normalize2D,
  determinant2x2,
  LUFactor3x3,
  LUSolve3x3,
  linearSolve3x3,
  multiply3x3_vect3,
  multiply3x3_mat3,
  multiplyMatrix,
  transpose3x3,
  invert3x3,
  identity3x3,
  determinant3x3,
  quaternionToMatrix3x3,
  areMatricesEqual,
  matrix3x3ToQuaternion,
  multiplyQuaternion,
  orthogonalize3x3,
  diagonalize3x3,
  singularValueDecomposition3x3,
  solveLinearSystem,
  invertMatrix,
  luFactorLinearSystem,
  luSolveLinearSystem,
  estimateMatrixCondition,
  jacobi,
  jacobiN,
  solveHomogeneousLeastSquares,
  solveLeastSquares,
  hex2float,
  rgb2hsv,
  hsv2rgb,
  lab2xyz,
  xyz2lab,
  xyz2rgb,
  rgb2xyz,
  rgb2lab,
  lab2rgb,
  uninitializeBounds,
  areBoundsInitialized,
  clampValue,
  clampAndNormalizeValue,
  getScalarTypeFittingRange,
  getAdjustedScalarRange,
  extentIsWithinOtherExtent,
  boundsIsWithinOtherBounds,
  pointIsWithinBounds,
  solve3PointCircle,
  inf,
  negInf,
  isInf,
  isNan: isNaN,
  isNaN,
  isFinite,

  // JS add-on
  createUninitializedBounds,
  getMajorAxisIndex,
  floatToHex2,
  floatRGB2HexCode,
  float2CssRGBA,
};
