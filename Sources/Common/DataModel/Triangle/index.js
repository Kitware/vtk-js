import macro from 'vtk.js/Sources/macro';
import vtkCell from 'vtk.js/Sources/Common/DataModel/Cell';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkLine from 'vtk.js/Sources/Common/DataModel/Line';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

function computeNormalDirection(v1, v2, v3, n) {
  // order is important!!! maintain consistency with triangle vertex order
  const ax = v3[0] - v2[0];
  const ay = v3[1] - v2[1];
  const az = v3[2] - v2[2];
  const bx = v1[0] - v2[0];
  const by = v1[1] - v2[1];
  const bz = v1[2] - v2[2];

  n[0] = ay * bz - az * by;
  n[1] = az * bx - ax * bz;
  n[2] = ax * by - ay * bx;
}

function computeNormal(v1, v2, v3, n) {
  computeNormalDirection(v1, v2, v3, n);
  const length = Math.sqrt(n[0] * n[0] + n[1] * n[1] + n[2] * n[2]);
  if (length !== 0.0) {
    n[0] /= length;
    n[1] /= length;
    n[2] /= length;
  }
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {
  computeNormalDirection,
  computeNormal,
};

// ----------------------------------------------------------------------------
// vtkTriangle methods
// ----------------------------------------------------------------------------

function vtkTriangle(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTriangle');

  publicAPI.getCellDimension = () => {}; // virtual
  publicAPI.intersectWithLine = (p1, p2, tol, x, pcoords) => {
    const outObj = { subId: 0, t: 0, intersect: -1 };
    pcoords[2] = 0.0;
    const closestPoint = [];
    const tol2 = tol * tol;

    // Get normal for triangle
    const pt1 = [];
    const pt2 = [];
    const pt3 = [];
    model.points.getPoint(0, pt1);
    model.points.getPoint(1, pt2);
    model.points.getPoint(2, pt3);
    const n = [];
    const weights = [];
    computeNormal(pt1, pt2, pt3, n);
    if (n[0] !== 0 || n[1] !== 0 || n[2] !== 0) {
      // Intersect plane of triangle with line
      const plane = vtkPlane.intersectWithLine(p1, p2, pt1, n);
      outObj.t = plane.t;
      x[0] = plane.x[0];
      x[1] = plane.x[1];
      x[2] = plane.x[2];
      if (!plane.intersection) {
        pcoords[0] = 0.0;
        pcoords[1] = 0.0;
        outObj.intersect = 0;
        return outObj;
      }

      // Evaluate position
      const inside = publicAPI.evaluatePosition(
        x,
        closestPoint,
        pcoords,
        weights
      );
      if (inside.evaluation >= 0) {
        if (inside.dist2 <= tol2) {
          outObj.intersect = 1;
          return outObj;
        }
        outObj.intersect = inside.evaluation;
        return outObj;
      }
    }

    // Normals are null, so the triangle is degenerated and
    // we still need to check intersection between line and
    // the longest edge.
    const dist2Pt1Pt2 = vtkMath.distance2BetweenPoints(pt1, pt2);
    const dist2Pt2Pt3 = vtkMath.distance2BetweenPoints(pt2, pt3);
    const dist2Pt3Pt1 = vtkMath.distance2BetweenPoints(pt3, pt1);
    if (dist2Pt1Pt2 > dist2Pt2Pt3 && dist2Pt1Pt2 > dist2Pt3Pt1) {
      model.line.getPoints().setPoint(0, pt1);
      model.line.getPoints().setPoint(1, pt2);
    } else if (dist2Pt2Pt3 > dist2Pt3Pt1 && dist2Pt2Pt3 > dist2Pt1Pt2) {
      model.line.getPoints().setPoint(0, pt2);
      model.line.getPoints().setPoint(1, pt3);
    } else {
      model.line.getPoints().setPoint(0, pt3);
      model.line.getPoints().setPoint(1, pt1);
    }

    const intersectLine = model.line.intersectWithLine(p1, p2, tol, x, pcoords);
    if (intersectLine.intersect) {
      const pt3Pt1 = [];
      const pt3Pt2 = [];
      const pt3X = [];
      // Compute r and s manually, using dot and norm.
      for (let i = 0; i < 3; i++) {
        pt3Pt1[i] = pt1[i] - pt3[i];
        pt3Pt2[i] = pt2[i] - pt3[i];
        pt3X[i] = x[i] - pt3[i];
      }
      pcoords[0] = vtkMath.dot(pt3X, pt3Pt1) / dist2Pt3Pt1;
      pcoords[1] = vtkMath.dot(pt3X, pt3Pt2) / dist2Pt2Pt3;
      outObj.evaluation = 1;
      return outObj;
    }

    pcoords[0] = 0.0;
    pcoords[1] = 0.0;
    outObj.evaluation = 0;
    return outObj;
  };

  publicAPI.evaluatePosition = (x, closestPoint, pcoords, weights) => {
    // will return obj
    const outObj = { subId: 0, dist2: 0, evaluation: -1 };
    let i;
    let j;
    const pt1 = [];
    const pt2 = [];
    const pt3 = [];
    const n = [];
    let fabsn;
    const rhs = [];
    const c1 = [];
    const c2 = [];
    let det = 0;
    let idx = 0;
    const indices = [];
    let dist2Point;
    let dist2Line1;
    let dist2Line2;
    let closest = [];
    const closestPoint1 = [];
    const closestPoint2 = [];
    const cp = [];

    outObj.subId = 0;
    pcoords[2] = 0.0;

    // Get normal for triangle, only the normal direction is needed, i.e. the
    // normal need not be normalized (unit length)
    //
    model.points.getPoint(1, pt1);
    model.points.getPoint(2, pt2);
    model.points.getPoint(0, pt3);

    computeNormalDirection(pt1, pt2, pt3, n);

    // Project point to plane
    vtkPlane.generalizedProjectPoint(x, pt1, n, cp);

    // Construct matrices.  Since we have over determined system, need to find
    // which 2 out of 3 equations to use to develop equations. (Any 2 should
    // work since we've projected point to plane.)
    let maxComponent = 0.0;
    for (i = 0; i < 3; i++) {
      // trying to avoid an expensive call to fabs()
      if (n[i] < 0) {
        fabsn = -n[i];
      } else {
        fabsn = n[i];
      }
      if (fabsn > maxComponent) {
        maxComponent = fabsn;
        idx = i;
      }
    }

    for (j = 0, i = 0; i < 3; i++) {
      if (i !== idx) {
        indices[j++] = i;
      }
    }

    for (i = 0; i < 2; i++) {
      rhs[i] = cp[indices[i]] - pt3[indices[i]];
      c1[i] = pt1[indices[i]] - pt3[indices[i]];
      c2[i] = pt2[indices[i]] - pt3[indices[i]];
    }
    det = vtkMath.determinant2x2(c1, c2);
    if (det === 0.0) {
      pcoords[0] = 0.0;
      pcoords[1] = 0.0;
      outObj.evaluation = -1;
      return outObj;
    }

    pcoords[0] = vtkMath.determinant2x2(rhs, c2) / det;
    pcoords[1] = vtkMath.determinant2x2(c1, rhs) / det;

    // Okay, now find closest point to element
    weights[0] = 1 - (pcoords[0] + pcoords[1]);
    weights[1] = pcoords[0];
    weights[2] = pcoords[1];

    if (
      weights[0] >= 0.0 &&
      weights[0] <= 1.0 &&
      weights[1] >= 0.0 &&
      weights[1] <= 1.0 &&
      weights[2] >= 0.0 &&
      weights[2] <= 1.0
    ) {
      // projection distance
      if (closestPoint) {
        outObj.dist2 = vtkMath.distance2BetweenPoints(cp, x);
        closestPoint[0] = cp[0];
        closestPoint[1] = cp[1];
        closestPoint[2] = cp[2];
      }
      outObj.evaluation = 1;
    } else {
      let t;
      if (closestPoint) {
        if (weights[1] < 0.0 && weights[2] < 0.0) {
          dist2Point = vtkMath.distance2BetweenPoints(x, pt3);
          dist2Line1 = vtkLine.distanceToLine(x, pt1, pt3, t, closestPoint1);
          dist2Line2 = vtkLine.distanceToLine(x, pt3, pt2, t, closestPoint2);
          if (dist2Point < dist2Line1) {
            outObj.dist2 = dist2Point;
            closest = pt3;
          } else {
            outObj.dist2 = dist2Line1;
            closest = closestPoint1;
          }
          if (dist2Line2 < outObj.dist2) {
            outObj.dist2 = dist2Line2;
            closest = closestPoint2;
          }
          for (i = 0; i < 3; i++) {
            closestPoint[i] = closest[i];
          }
        } else if (weights[2] < 0.0 && weights[0] < 0.0) {
          dist2Point = vtkMath.distance2BetweenPoints(x, pt1);
          dist2Line1 = vtkLine.distanceToLine(x, pt1, pt3, t, closestPoint1);
          dist2Line2 = vtkLine.distanceToLine(x, pt1, pt2, t, closestPoint2);
          if (dist2Point < dist2Line1) {
            outObj.dist2 = dist2Point;
            closest = pt1;
          } else {
            outObj.dist2 = dist2Line1;
            closest = closestPoint1;
          }
          if (dist2Line2 < outObj.dist2) {
            outObj.dist2 = dist2Line2;
            closest = closestPoint2;
          }
          for (i = 0; i < 3; i++) {
            closestPoint[i] = closest[i];
          }
        } else if (weights[1] < 0.0 && weights[0] < 0.0) {
          dist2Point = vtkMath.distance2BetweenPoints(x, pt2);
          dist2Line1 = vtkLine.distanceToLine(x, pt2, pt3, t, closestPoint1);
          dist2Line2 = vtkLine.distanceToLine(x, pt1, pt2, t, closestPoint2);
          if (dist2Point < dist2Line1) {
            outObj.dist2 = dist2Point;
            closest = pt2;
          } else {
            outObj.dist2 = dist2Line1;
            closest = closestPoint1;
          }
          if (dist2Line2 < outObj.dist2) {
            outObj.dist2 = dist2Line2;
            closest = closestPoint2;
          }
          for (i = 0; i < 3; i++) {
            closestPoint[i] = closest[i];
          }
        } else if (weights[0] < 0.0) {
          const lineDistance = vtkLine.distanceToLine(
            x,
            pt1,
            pt2,
            closestPoint
          );
          outObj.dist2 = lineDistance.distance;
        } else if (weights[1] < 0.0) {
          const lineDistance = vtkLine.distanceToLine(
            x,
            pt2,
            pt3,
            closestPoint
          );
          outObj.dist2 = lineDistance.distance;
        } else if (weights[2] < 0.0) {
          const lineDistance = vtkLine.distanceToLine(
            x,
            pt1,
            pt3,
            closestPoint
          );
          outObj.dist2 = lineDistance.distance;
        }
      }
      outObj.evaluation = 0;
    }

    return outObj;
  };

  publicAPI.evaluateLocation = (pcoords, x, weights) => {
    const p0 = [];
    const p1 = [];
    const p2 = [];
    model.points.getPoint(0, p0);
    model.points.getPoint(1, p1);
    model.points.getPoint(2, p2);
    const u3 = 1.0 - pcoords[0] - pcoords[1];

    for (let i = 0; i < 3; i++) {
      x[i] = p0[i] * u3 + p1[i] * pcoords[0] + p2[i] * pcoords[1];
    }

    weights[0] = u3;
    weights[1] = pcoords[0];
    weights[2] = pcoords[1];
  };

  publicAPI.getParametricDistance = (pcoords) => {
    let pDist;
    let pDistMax = 0.0;
    const pc = [];
    pc[0] = pcoords[0];
    pc[1] = pcoords[1];
    pc[2] = 1.0 - pcoords[0] - pcoords[1];

    for (let i = 0; i < 3; i++) {
      if (pc[i] < 0.0) {
        pDist = -pc[i];
      } else if (pc[i] > 1.0) {
        pDist = pc[i] - 1.0;
      } else {
        // inside the cell in the parametric direction
        pDist = 0.0;
      }
      if (pDist > pDistMax) {
        pDistMax = pDist;
      }
    }
    return pDistMax;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkCell.extend(publicAPI, model, initialValues);

  model.line = vtkLine.newInstance();

  vtkTriangle(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkTriangle');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, STATIC);
