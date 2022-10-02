import macro from 'vtk.js/Sources/macros';
import vtkSpline1D from 'vtk.js/Sources/Common/DataModel/Spline1D';

import { BoundaryCondition } from 'vtk.js/Sources/Common/DataModel/Spline1D/Constants';

const VTK_EPSILON = 0.0001;

// ----------------------------------------------------------------------------
// vtkCardinalSpline1D methods
// ----------------------------------------------------------------------------

function vtkCardinalSpline1D(publicAPI, model) {
  // Set our classname
  model.classHierarchy.push('vtkCardinalSpline1D');

  // --------------------------------------------------------------------------

  publicAPI.computeCloseCoefficients = (size, work, x, y) => {
    if (!model.coefficients || model.coefficients.length !== 4 * size) {
      model.coefficients = new Float32Array(4 * size);
    }
    const N = size - 1;

    for (let k = 1; k < N; k++) {
      const xlk = x[k] - x[k - 1];
      const xlkp = x[k + 1] - x[k];

      model.coefficients[4 * k + 0] = xlkp;
      model.coefficients[4 * k + 1] = 2 * (xlkp + xlk);
      model.coefficients[4 * k + 2] = xlk;
      work[k] =
        3.0 *
        ((xlkp * (y[k] - y[k - 1])) / xlk + (xlk * (y[k + 1] - y[k])) / xlkp);
    }

    const xlk = x[N] - x[N - 1];
    const xlkp = x[1] - x[0];

    model.coefficients[4 * N + 0] = xlkp;
    model.coefficients[4 * N + 1] = 2 * (xlkp + xlk);
    model.coefficients[4 * N + 2] = xlk;
    work[N] =
      3 * ((xlkp * (y[N] - y[N - 1])) / xlk + (xlk * (y[1] - y[0])) / xlkp);

    const aN = model.coefficients[4 * N + 0];
    const bN = model.coefficients[4 * N + 1];
    const cN = model.coefficients[4 * N + 2];
    const dN = work[N];

    // solve resulting set of equations.
    model.coefficients[4 * 0 + 2] = 0;
    work[0] = 0;
    model.coefficients[4 * 0 + 3] = 1;

    for (let k = 1; k <= N; k++) {
      model.coefficients[4 * k + 1] -=
        model.coefficients[4 * k + 0] * model.coefficients[4 * (k - 1) + 2];
      model.coefficients[4 * k + 2] =
        model.coefficients[4 * k + 2] / model.coefficients[4 * k + 1];
      work[k] =
        (work[k] - model.coefficients[4 * k + 0] * work[k - 1]) /
        model.coefficients[4 * k + 1];
      model.coefficients[4 * k + 3] =
        (-model.coefficients[4 * k + 0] * model.coefficients[4 * (k - 1) + 3]) /
        model.coefficients[4 * k + 1];
    }

    model.coefficients[4 * N + 0] = 1;
    model.coefficients[4 * N + 1] = 0;

    for (let k = N - 1; k > 0; k--) {
      model.coefficients[4 * k + 0] =
        model.coefficients[4 * k + 3] -
        model.coefficients[4 * k + 2] * model.coefficients[4 * (k + 1) + 0];
      model.coefficients[4 * k + 1] =
        work[k] -
        model.coefficients[4 * k + 2] * model.coefficients[4 * (k + 1) + 1];
    }

    work[0] =
      (dN -
        cN * model.coefficients[4 * 1 + 1] -
        aN * model.coefficients[4 * (N - 1) + 1]) /
      (bN +
        cN * model.coefficients[4 * 1 + 0] +
        aN * model.coefficients[4 * (N - 1) + 0]);
    work[N] = work[0];

    for (let k = 1; k < N; k++) {
      work[k] =
        model.coefficients[4 * k + 0] * work[N] + model.coefficients[4 * k + 1];
    }

    // the column vector work now contains the first
    // derivative of the spline function at each joint.
    // compute the coefficients of the cubic between
    // each pair of joints.
    for (let k = 0; k < N; k++) {
      const b = x[k + 1] - x[k];
      model.coefficients[4 * k + 0] = y[k];
      model.coefficients[4 * k + 1] = work[k];
      model.coefficients[4 * k + 2] =
        (3 * (y[k + 1] - y[k])) / (b * b) - (work[k + 1] + 2 * work[k]) / b;
      model.coefficients[4 * k + 3] =
        (2 * (y[k] - y[k + 1])) / (b * b * b) +
        (work[k + 1] + work[k]) / (b * b);
    }

    // the coefficients of a fictitious nth cubic
    // are the same as the coefficients in the first interval
    model.coefficients[4 * N + 0] = y[N];
    model.coefficients[4 * N + 1] = work[N];
    model.coefficients[4 * N + 2] = model.coefficients[4 * 0 + 2];
    model.coefficients[4 * N + 3] = model.coefficients[4 * 0 + 3];
  };

  // --------------------------------------------------------------------------

  publicAPI.computeOpenCoefficients = (size, work, x, y, options = {}) => {
    if (!model.coefficients || model.coefficients.length !== 4 * size) {
      model.coefficients = new Float32Array(4 * size);
    }
    const N = size - 1;
    // develop constraint at leftmost point.
    switch (options.leftConstraint) {
      case BoundaryCondition.DERIVATIVE:
        // desired slope at leftmost point is leftValue.
        model.coefficients[4 * 0 + 1] = 1.0;
        model.coefficients[4 * 0 + 2] = 0.0;
        work[0] = options.leftValue;
        break;
      case BoundaryCondition.SECOND_DERIVATIVE:
        // desired second derivative at leftmost point is leftValue.
        model.coefficients[4 * 0 + 1] = 2.0;
        model.coefficients[4 * 0 + 2] = 1.0;
        work[0] =
          3.0 * ((y[1] - y[0]) / (x[1] - x[0])) -
          0.5 * (x[1] - x[0]) * options.leftValue;
        break;
      case BoundaryCondition.SECOND_DERIVATIVE_INTERIOR_POINT:
        // desired second derivative at leftmost point is
        // leftValue times second derivative at first interior point.
        model.coefficients[4 * 0 + 1] = 2.0;

        if (Math.abs(options.leftValue + 2) > VTK_EPSILON) {
          model.coefficients[4 * 0 + 2] =
            4.0 * ((0.5 + options.leftValue) / (2.0 + options.leftValue));
          work[0] =
            6.0 *
            ((1.0 + options.leftValue) / (2.0 + options.leftValue)) *
            ((y[1] - y[0]) / (x[1] - x[0]));
        } else {
          model.coefficients[4 * 0 + 2] = 0;
          work[0] = 0;
        }
        break;
      case BoundaryCondition.DEFAULT:
      default:
        // desired slope at leftmost point is derivative from two points
        model.coefficients[4 * 0 + 1] = 1.0;
        model.coefficients[4 * 0 + 2] = 0.0;
        work[0] = y[2] - y[0];
        break;
    }

    for (let k = 1; k < N; k++) {
      const xlk = x[k] - x[k - 1];
      const xlkp = x[k + 1] - x[k];

      model.coefficients[4 * k + 0] = xlkp;
      model.coefficients[4 * k + 1] = 2 * (xlkp + xlk);
      model.coefficients[4 * k + 2] = xlk;
      work[k] =
        3.0 *
        ((xlkp * (y[k] - y[k - 1])) / xlk + (xlk * (y[k + 1] - y[k])) / xlkp);
    }

    // develop constraint at rightmost point.
    switch (options.rightConstraint) {
      case BoundaryCondition.DERIVATIVE:
        // desired slope at rightmost point is rightValue
        model.coefficients[4 * N + 0] = 0.0;
        model.coefficients[4 * N + 1] = 1.0;
        work[N] = options.rightValue;
        break;
      case BoundaryCondition.SECOND_DERIVATIVE:
        // desired second derivative at rightmost point is rightValue.
        model.coefficients[4 * N + 0] = 1.0;
        model.coefficients[4 * N + 1] = 2.0;
        work[N] =
          3.0 * ((y[N] - y[N - 1]) / (x[N] - x[N - 1])) +
          0.5 * (x[N] - x[N - 1]) * options.rightValue;
        break;
      case BoundaryCondition.SECOND_DERIVATIVE_INTERIOR_POINT:
        // desired second derivative at rightmost point is
        // rightValue times second derivative at last interior point.
        model.coefficients[4 * N + 1] = 2.0;
        if (Math.abs(options.rightValue + 2) > VTK_EPSILON) {
          model.coefficients[4 * N + 0] =
            4.0 * ((0.5 + options.rightValue) / (2.0 + options.rightValue));
          work[N] =
            6.0 *
            ((1.0 + options.rightValue) / (2.0 + options.rightValue)) *
            ((y[N] - y[size - 2]) / (x[N] - x[size - 2]));
        } else {
          model.coefficients[4 * N + 0] = 0;
          work[N] = 0;
        }
        break;
      case BoundaryCondition.DEFAULT:
      default:
        // desired slope at rightmost point is derivative from two points
        model.coefficients[4 * N + 0] = 0.0;
        model.coefficients[4 * N + 1] = 1.0;
        work[N] = y[N] - y[N - 2];
        break;
    }

    // solve resulting set of equations.
    model.coefficients[4 * 0 + 2] /= model.coefficients[4 * 0 + 1];
    work[0] /= model.coefficients[4 * N + 1];
    model.coefficients[4 * N + 3] = 1;

    for (let k = 1; k <= N; k++) {
      model.coefficients[4 * k + 1] -=
        model.coefficients[4 * k + 0] * model.coefficients[4 * (k - 1) + 2];
      model.coefficients[4 * k + 2] /= model.coefficients[4 * k + 1];
      work[k] =
        (work[k] - model.coefficients[4 * k + 0] * work[k - 1]) /
        model.coefficients[4 * k + 1];
    }

    for (let k = N - 1; k >= 0; k--) {
      work[k] -= model.coefficients[4 * k + 2] * work[k + 1];
    }

    // the column vector work now contains the first
    // derivative of the spline function at each joint.
    // compute the coefficients of the cubic between
    // each pair of joints.
    for (let k = 0; k < N; k++) {
      const b = x[k + 1] - x[k];
      model.coefficients[4 * k + 0] = y[k];
      model.coefficients[4 * k + 1] = work[k];
      model.coefficients[4 * k + 2] =
        (3 * (y[k + 1] - y[k])) / (b * b) - (work[k + 1] + 2 * work[k]) / b;
      model.coefficients[4 * k + 3] =
        (2 * (y[k] - y[k + 1])) / (b * b * b) +
        (work[k + 1] + work[k]) / (b * b);
    }

    // the coefficients of a fictitious nth cubic
    // are the same as the coefficients in the first interval
    model.coefficients[4 * N + 0] = y[N];
    model.coefficients[4 * N + 1] = work[N];
    model.coefficients[4 * N + 2] = model.coefficients[4 * 0 + 2];
    model.coefficients[4 * N + 3] = model.coefficients[4 * 0 + 3];
  };

  // --------------------------------------------------------------------------

  publicAPI.getValue = (intervalIndex, t) => {
    const t2 = t * t;
    const t3 = t * t * t;

    return (
      model.coefficients[4 * intervalIndex + 3] * t3 +
      model.coefficients[4 * intervalIndex + 2] * t2 +
      model.coefficients[4 * intervalIndex + 1] * t +
      model.coefficients[4 * intervalIndex + 0]
    );
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkSpline1D.extend(publicAPI, model, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  vtkCardinalSpline1D(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCardinalSpline1D');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
