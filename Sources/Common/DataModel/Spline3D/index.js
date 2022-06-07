import macro from 'vtk.js/Sources/macros';
import vtkCardinalSpline1D from 'vtk.js/Sources/Common/DataModel/CardinalSpline1D';
import vtkKochanekSpline1D from 'vtk.js/Sources/Common/DataModel/KochanekSpline1D';

import { splineKind } from 'vtk.js/Sources/Common/DataModel/Spline3D/Constants';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkSpline3D methods
// ----------------------------------------------------------------------------

function vtkSpline3D(publicAPI, model) {
  // Set our classname
  model.classHierarchy.push('vtkSpline3D');

  // --------------------------------------------------------------------------

  function computeCoefficients1D(spline, points, boundaryConditionValue) {
    if (points.length === 0) {
      vtkErrorMacro('Splines require at least one points');
    }

    // If we have only one point we create a spline
    // which two extremities are the same point
    if (points.length === 1) {
      points.push(points[0]);
    }

    const size = points.length;

    let work = null;
    let intervals = null;

    work = new Float32Array(size);
    if (model.intervals.length === 0) {
      intervals = new Float32Array(size);
      for (let i = 0; i < intervals.length; i++) {
        intervals[i] = i;
      }
    } else {
      intervals = model.intervals;
    }

    if (model.close) {
      spline.computeCloseCoefficients(size, work, intervals, points);
    } else {
      spline.computeOpenCoefficients(size, work, intervals, points, {
        leftConstraint: model.boundaryCondition,
        leftValue: boundaryConditionValue,
        rightConstraint: model.boundaryCondition,
        rightValue: boundaryConditionValue,
      });
    }
  }

  // --------------------------------------------------------------------------

  publicAPI.computeCoefficients = (points) => {
    const x = points.map((pt) => pt[0]);
    const y = points.map((pt) => pt[1]);
    const z = points.map((pt) => pt[2]);

    computeCoefficients1D(model.splineX, x, model.boundaryConditionValues[0]);
    computeCoefficients1D(model.splineY, y, model.boundaryConditionValues[1]);
    computeCoefficients1D(model.splineZ, z, model.boundaryConditionValues[2]);
  };

  // --------------------------------------------------------------------------

  publicAPI.getPoint = (intervalIndex, t) => [
    model.splineX.getValue(intervalIndex, t),
    model.splineY.getValue(intervalIndex, t),
    model.splineZ.getValue(intervalIndex, t),
  ];

  // --------------------------------------------------------------------------
  // initialization
  // --------------------------------------------------------------------------

  if (model.kind === splineKind.KOCHANEK_SPLINE) {
    model.splineX = vtkKochanekSpline1D.newInstance({
      tension: model.tension,
      continuity: model.continuity,
      bias: model.bias,
    });
    model.splineY = vtkKochanekSpline1D.newInstance({
      tension: model.tension,
      continuity: model.continuity,
      bias: model.bias,
    });
    model.splineZ = vtkKochanekSpline1D.newInstance({
      tension: model.tension,
      continuity: model.continuity,
      bias: model.bias,
    });
  } else if (model.kind === splineKind.CARDINAL_SPLINE) {
    model.splineX = vtkCardinalSpline1D.newInstance();
    model.splineY = vtkCardinalSpline1D.newInstance();
    model.splineZ = vtkCardinalSpline1D.newInstance();
  } else {
    vtkErrorMacro(`Unknown spline type ${model.kind}`);
  }
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  close: false,
  intervals: [],
  kind: splineKind.KOCHANEK_SPLINE,
  boundaryConditionValues: [0, 0, 0],

  // Passed to the vtkKochanekSpline1D
  tension: 0,
  continuity: 0,
  bias: 0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['close', 'intervals']);
  vtkSpline3D(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkSpline3D');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
