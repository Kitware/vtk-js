import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import macro from 'vtk.js/Sources/macros';

const PLANE_TOLERANCE = 1.0e-6;
const COINCIDE = 'coincide';
const DISJOINT = 'disjoint';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

function evaluate(normal, origin, x) {
  return (
    normal[0] * (x[0] - origin[0]) +
    normal[1] * (x[1] - origin[1]) +
    normal[2] * (x[2] - origin[2])
  );
}

function distanceToPlane(x, origin, normal) {
  const distance =
    normal[0] * (x[0] - origin[0]) +
    normal[1] * (x[1] - origin[1]) +
    normal[2] * (x[2] - origin[2]);

  return Math.abs(distance);
}

function projectPoint(x, origin, normal, xproj) {
  const xo = [];
  vtkMath.subtract(x, origin, xo);

  const t = vtkMath.dot(normal, xo);

  xproj[0] = x[0] - t * normal[0];
  xproj[1] = x[1] - t * normal[1];
  xproj[2] = x[2] - t * normal[2];
}

function projectVector(v, normal, vproj) {
  const t = vtkMath.dot(v, normal);

  let n2 = vtkMath.dot(normal, normal);
  if (n2 === 0) {
    n2 = 1.0;
  }

  vproj[0] = v[0] - (t * normal[0]) / n2;
  vproj[1] = v[1] - (t * normal[1]) / n2;
  vproj[2] = v[2] - (t * normal[2]) / n2;
  return vproj;
}

function generalizedProjectPoint(x, origin, normal, xproj) {
  const xo = [];
  vtkMath.subtract(x, origin, xo);

  const t = vtkMath.dot(normal, xo);
  const n2 = vtkMath.dot(normal, normal);

  if (n2 !== 0) {
    xproj[0] = x[0] - (t * normal[0]) / n2;
    xproj[1] = x[1] - (t * normal[1]) / n2;
    xproj[2] = x[2] - (t * normal[2]) / n2;
  } else {
    xproj[0] = x[0];
    xproj[1] = x[1];
    xproj[2] = x[2];
  }
}

function intersectWithLine(p1, p2, origin, normal) {
  const outObj = {
    intersection: false,
    betweenPoints: false,
    t: Number.MAX_VALUE,
    x: [],
  };

  const p21 = [];
  const p1Origin = [];
  // Compute line vector
  vtkMath.subtract(p2, p1, p21);
  vtkMath.subtract(origin, p1, p1Origin);

  // Compute denominator.  If ~0, line and plane are parallel.
  // const num = vtkMath.dot(normal, origin) - vtkMath.dot(normal, p1);
  const num = vtkMath.dot(normal, p1Origin);
  const den = vtkMath.dot(normal, p21);

  // If denominator with respect to numerator is "zero", then the line and
  // plane are considered parallel.
  let fabsden;
  let fabstolerance;

  // Trying to avoid an expensive call to fabs()
  if (den < 0.0) {
    fabsden = -den;
  } else {
    fabsden = den;
  }
  if (num < 0.0) {
    fabstolerance = -num * PLANE_TOLERANCE;
  } else {
    fabstolerance = num * PLANE_TOLERANCE;
  }
  if (fabsden <= fabstolerance) {
    return outObj;
  }

  // Where on the line between p1 and p2 is the intersection
  // If between 0 and 1, it is between the two points. If < 0 it's before p1, if > 1 it's after p2
  outObj.t = num / den;

  outObj.x[0] = p1[0] + outObj.t * p21[0];
  outObj.x[1] = p1[1] + outObj.t * p21[1];
  outObj.x[2] = p1[2] + outObj.t * p21[2];

  outObj.intersection = true;
  outObj.betweenPoints = outObj.t >= 0.0 && outObj.t <= 1.0;
  return outObj;
}

function intersectWithPlane(
  plane1Origin,
  plane1Normal,
  plane2Origin,
  plane2Normal
) {
  const outObj = {
    intersection: false,
    l0: [],
    l1: [],
    error: null,
  };

  const cross = [];
  vtkMath.cross(plane1Normal, plane2Normal, cross);
  const absCross = cross.map((n) => Math.abs(n));

  // test if the two planes are parallel
  if (absCross[0] + absCross[1] + absCross[2] < PLANE_TOLERANCE) {
    // test if disjoint or coincide
    const v = [];
    vtkMath.subtract(plane1Origin, plane2Origin, v);
    if (vtkMath.dot(plane1Normal, v) === 0) {
      outObj.error = COINCIDE;
    } else {
      outObj.error = DISJOINT;
    }
    return outObj;
  }

  // Plane1 and Plane2 intersect in a line
  // first determine max abs coordinate of the cross product
  let maxc;
  if (absCross[0] > absCross[1] && absCross[0] > absCross[2]) {
    maxc = 'x';
  } else if (absCross[1] > absCross[2]) {
    maxc = 'y';
  } else {
    maxc = 'z';
  }

  // To get a point on the intersect line, zero the max coord, and solve for the other two
  const iP = []; // intersectionPoint
  // the constants in the 2 plane equations
  const d1 = -vtkMath.dot(plane1Normal, plane1Origin);
  const d2 = -vtkMath.dot(plane2Normal, plane2Origin);

  // eslint-disable-next-line default-case
  switch (maxc) {
    case 'x': // intersect with x=0
      iP[0] = 0;
      iP[1] = (d2 * plane1Normal[2] - d1 * plane2Normal[2]) / cross[0];
      iP[2] = (d1 * plane2Normal[1] - d2 * plane1Normal[1]) / cross[0];
      break;
    case 'y': // intersect with y=0
      iP[0] = (d1 * plane2Normal[2] - d2 * plane1Normal[2]) / cross[1];
      iP[1] = 0;
      iP[2] = (d2 * plane1Normal[0] - d1 * plane2Normal[0]) / cross[1];
      break;
    case 'z': // intersect with z=0
      iP[0] = (d2 * plane1Normal[1] - d1 * plane2Normal[1]) / cross[2];
      iP[1] = (d1 * plane2Normal[0] - d2 * plane1Normal[0]) / cross[2];
      iP[2] = 0;
      break;
  }

  outObj.l0 = iP;
  vtkMath.add(iP, cross, outObj.l1);
  outObj.intersection = true;

  return outObj;
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {
  evaluate,
  distanceToPlane,
  projectPoint,
  projectVector,
  generalizedProjectPoint,
  intersectWithLine,
  intersectWithPlane,
  DISJOINT,
  COINCIDE,
};

// ----------------------------------------------------------------------------
// vtkPlane methods
// ----------------------------------------------------------------------------

export function vtkPlane(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPlane');

  publicAPI.distanceToPlane = (x) =>
    distanceToPlane(x, model.origin, model.normal);

  publicAPI.projectPoint = (x, xproj) => {
    projectPoint(x, model.origin, model.normal, xproj);
  };

  publicAPI.projectVector = (v, vproj) => projectVector(v, model.normal, vproj);

  publicAPI.push = (distance) => {
    if (distance === 0.0) {
      return;
    }
    for (let i = 0; i < 3; i++) {
      model.origin[i] += distance * model.normal[i];
    }
  };

  publicAPI.generalizedProjectPoint = (x, xproj) => {
    generalizedProjectPoint(x, model.origin, model.normal, xproj);
  };

  publicAPI.evaluateFunction = (x, y, z) => {
    if (!Array.isArray(x)) {
      return (
        model.normal[0] * (x - model.origin[0]) +
        model.normal[1] * (y - model.origin[1]) +
        model.normal[2] * (z - model.origin[2])
      );
    }
    return (
      model.normal[0] * (x[0] - model.origin[0]) +
      model.normal[1] * (x[1] - model.origin[1]) +
      model.normal[2] * (x[2] - model.origin[2])
    );
  };

  publicAPI.evaluateGradient = (xyz) => {
    const retVal = [model.normal[0], model.normal[1], model.normal[2]];
    return retVal;
  };

  publicAPI.intersectWithLine = (p1, p2) =>
    intersectWithLine(p1, p2, model.origin, model.normal);

  publicAPI.intersectWithPlane = (planeOrigin, planeNormal) =>
    intersectWithPlane(planeOrigin, planeNormal, model.origin, model.normal);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  normal: [0.0, 0.0, 1.0],
  origin: [0.0, 0.0, 0.0],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);

  macro.setGetArray(publicAPI, model, ['normal', 'origin'], 3);

  vtkPlane(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPlane');

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...STATIC };
