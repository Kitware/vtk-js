import macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkLine from 'vtk.js/Sources/Common/DataModel/Line';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkPriorityQueue from 'vtk.js/Sources/Common/Core/PriorityQueue';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import { IntersectionState } from 'vtk.js/Sources/Common/DataModel/Line/Constants';
import {
  PolygonWithPointIntersectionState,
  EPSILON,
  FLOAT_EPSILON,
  TOLERANCE,
} from './Constants';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// Given the line (p0,p1), determine if the given point is located to the left
// of, on, or to the right of a line (with the function returning >0, ==0, or
// <0 respectively). The points are assumed 3D points, but projected into
// one of x-y-z planes; hence the indices axis0 and axis1 specify which plane
// the computation is to be performed on.
function pointLocation(axis0, axis1, p0, p1, point) {
  return (
    (p1[axis0] - p0[axis0]) * (point[axis1] - p0[axis1]) -
    (point[axis0] - p0[axis0]) * (p1[axis1] - p0[axis1])
  );
}

//------------------------------------------------------------------------------

function pointInPolygon(point, vertices, bounds, normal) {
  // Do a quick bounds check to throw out trivial cases.
  // winding plane.
  if (
    point[0] < bounds[0] ||
    point[0] > bounds[1] ||
    point[1] < bounds[2] ||
    point[1] > bounds[3] ||
    point[2] < bounds[4] ||
    point[2] > bounds[5]
  ) {
    return PolygonWithPointIntersectionState.OUTSIDE;
  }

  //  Check that the normal is non-zero.
  if (vtkMath.normalize(normal) <= FLOAT_EPSILON) {
    return PolygonWithPointIntersectionState.FAILURE;
  }

  // Assess whether the point lies on the boundary of the polygon. Points on
  // the boundary are considered inside the polygon. Need to define a small
  // tolerance relative to the bounding box diagonal length of the polygon.
  let tol2 =
    TOLERANCE *
    ((bounds[1] - bounds[0]) * (bounds[1] - bounds[0]) +
      (bounds[3] - bounds[2]) * (bounds[3] - bounds[2]) +
      (bounds[5] - bounds[4]) * (bounds[5] - bounds[4]));
  tol2 *= tol2;
  tol2 = tol2 === 0.0 ? FLOAT_EPSILON : tol2;
  const p0 = [];
  const p1 = [];

  for (let i = 0; i < vertices.length; ) {
    // Check coincidence to polygon vertices
    p0[0] = vertices[i++];
    p0[1] = vertices[i++];
    p0[2] = vertices[i++];
    if (vtkMath.distance2BetweenPoints(point, p0) <= tol2) {
      return PolygonWithPointIntersectionState.INSIDE;
    }

    // Check coincidence to polygon edges
    const { distance, t } = vtkLine.distanceToLine(point, p0, p1);
    if (distance <= tol2 && t > 0.0 && t < 1.0) {
      return PolygonWithPointIntersectionState.INSIDE;
    }
  }

  // If here, begin computation of the winding number. This method works for
  // points/polygons arbitrarily oriented in 3D space.  Hence a projection
  // onto one of the x-y-z coordinate planes using the maximum normal
  // component. The computation will be performed in the (axis0, axis1) plane.
  let axis0;
  let axis1;
  if (Math.abs(normal[0]) > Math.abs(normal[1])) {
    if (Math.abs(normal[0]) > Math.abs(normal[2])) {
      axis0 = 1;
      axis1 = 2;
    } else {
      axis0 = 0;
      axis1 = 1;
    }
  } else if (Math.abs(normal[1]) > Math.abs(normal[2])) {
    axis0 = 0;
    axis1 = 2;
  } else {
    axis0 = 0;
    axis1 = 1;
  }

  // Compute the winding number wn. If after processing all polygon edges
  // wn == 0, then the point is outside.  Otherwise, the point is inside the
  // polygon. Process all polygon edges determining if there are ascending or
  // descending crossings of the line axis1=constant.
  let wn = 0;
  for (let i = 0; i < vertices.length; ) {
    p0[0] = vertices[i++];
    p0[1] = vertices[i++];
    p0[2] = vertices[i++];
    if (i < vertices.length) {
      p1[0] = vertices[i];
      p1[1] = vertices[i + 1];
      p1[2] = vertices[i + 2];
    } else {
      p1[0] = vertices[0];
      p1[1] = vertices[1];
      p1[2] = vertices[2];
    }

    if (p0[axis1] <= point[axis1]) {
      if (p1[axis1] > point[axis1]) {
        // if an upward crossing
        if (pointLocation(axis0, axis1, p0, p1, point) > 0) {
          // if x left of edge
          ++wn; // a valid up intersect, increment the winding number
        }
      }
    } else if (p1[axis1] <= point[axis1]) {
      // if a downward crossing
      if (pointLocation(axis0, axis1, p0, p1, point) < 0) {
        // if x right of edge
        --wn; // a valid down intersect, decrement the winding number
      }
    }
  } // Over all polygon edges

  // A winding number == 0 is outside the polygon
  return wn === 0
    ? PolygonWithPointIntersectionState.OUTSIDE
    : PolygonWithPointIntersectionState.INSIDE;
}

// ---------------------------------------------------
/**
 * Simple utility method for computing polygon bounds.
 * Returns the sum of the squares of the dimensions.
 * Requires a poly with at least one point.
 *
 * @param {Array<Number>|TypedArray<Number>} poly
 * @param {vtkPoints} points
 * @param {Bound} bounds
 */
export function getBounds(poly, points, bounds) {
  const n = poly.length;
  const p = [];

  points.getPoint(poly[0], p);
  bounds[0] = p[0];
  bounds[1] = p[0];
  bounds[2] = p[1];
  bounds[3] = p[1];
  bounds[4] = p[2];
  bounds[5] = p[2];

  for (let j = 1; j < n; j++) {
    points.getPoint(poly[j], p);
    vtkBoundingBox.addPoint(bounds, ...p);
  }
  const length = vtkBoundingBox.getLengths(bounds);
  return vtkMath.dot(length, length);
}

// ---------------------------------------------------
/**
 * Compute the normal of a polygon and return its norm.
 *
 * TBD: This does the same thing as vtkPolygon.computeNormal,
 * but in a more generic way. Maybe we can keep the public
 * static method somehow and have the private method use it instead.
 *
 * @param {Array<Number>|TypedArray<Number>} poly
 * @param {vtkPoints} points
 * @param {Vector3} normal
 * @returns {Number}
 */
export function getNormal(poly, points, normal) {
  normal.length = 3;
  normal[0] = 0.0;
  normal[1] = 0.0;
  normal[2] = 0.0;

  const p0 = [];
  let p1 = [];
  let p2 = [];
  const v1 = [];
  const v2 = [];

  points.getPoint(poly[0], p0);
  points.getPoint(poly[1], p1);

  for (let j = 2; j < poly.length; j++) {
    points.getPoint(poly[j], p2);
    vtkMath.subtract(p2, p1, v1);
    vtkMath.subtract(p0, p1, v2);

    const n = [0, 0, 0];
    vtkMath.cross(v1, v2, n);
    vtkMath.add(normal, n, normal);

    [p1, p2] = [p2, p1];
  }

  return vtkMath.normalize(normal);
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

const STATIC = {
  PolygonWithPointIntersectionState,
  pointInPolygon,
  getBounds,
  getNormal,
};

// ----------------------------------------------------------------------------
// vtkPolygon methods
// ----------------------------------------------------------------------------

function vtkPolygon(publicAPI, model) {
  // Set our classname
  model.classHierarchy.push('vtkPolygon');

  function computeNormal() {
    const v1 = [0, 0, 0];
    const v2 = [0, 0, 0];
    model.normal = [0, 0, 0];
    const anchor = [...model.firstPoint.point];

    let point = model.firstPoint;
    for (let i = 0; i < model.pointCount; i++) {
      vtkMath.subtract(point.point, anchor, v1);
      vtkMath.subtract(point.next.point, anchor, v2);

      const n = [0, 0, 0];
      vtkMath.cross(v1, v2, n);
      vtkMath.add(model.normal, n, model.normal);

      point = point.next;
    }

    return vtkMath.normalize(model.normal);
  }

  function computeMeasure(point) {
    const v1 = [0, 0, 0];
    const v2 = [0, 0, 0];
    const v3 = [0, 0, 0];
    const v4 = [0, 0, 0];

    vtkMath.subtract(point.point, point.previous.point, v1);
    vtkMath.subtract(point.next.point, point.point, v2);
    vtkMath.subtract(point.previous.point, point.next.point, v3);
    vtkMath.cross(v1, v2, v4);

    const area = vtkMath.dot(v4, model.normal);

    if (area <= 0) {
      return -1;
    }

    const perimeter = vtkMath.norm(v1) + vtkMath.norm(v2) + vtkMath.norm(v3);

    return (perimeter * perimeter) / area;
  }

  function canRemoveVertex(point) {
    if (model.pointCount <= 3) {
      return true;
    }

    const previous = point.previous;
    const next = point.next;

    const v = [0, 0, 0];
    vtkMath.subtract(next.point, previous.point, v);

    const sN = [0, 0, 0];
    vtkMath.cross(v, model.normal, sN);
    vtkMath.normalize(sN);
    if (vtkMath.norm(sN) === 0) {
      return false;
    }

    let val = vtkPlane.evaluate(sN, previous.point, next.next.point);
    // eslint-disable-next-line no-nested-ternary
    let currentSign = val > EPSILON ? 1 : val < -EPSILON ? -1 : 0;
    let oneNegative = currentSign < 0 ? 1 : 0;

    for (
      let vertex = next.next.next;
      vertex.id !== previous.id;
      vertex = vertex.next
    ) {
      const previousVertex = vertex.previous;
      val = vtkPlane.evaluate(sN, previous.point, vertex.point);
      // eslint-disable-next-line no-nested-ternary
      const sign = val > EPSILON ? 1 : val < -EPSILON ? -1 : 0;

      if (sign !== currentSign) {
        if (!oneNegative) {
          oneNegative = sign <= 0 ? 1 : 0;
        }

        if (
          vtkLine.intersection(
            previous.point,
            next.point,
            vertex.point,
            previousVertex.point,
            [0],
            [0]
          ) === IntersectionState.YES_INTERSECTION
        ) {
          return false;
        }
        currentSign = sign;
      }
    }

    return oneNegative === 1;
  }

  function removePoint(point, queue) {
    model.pointCount -= 1;

    const previous = point.previous;
    const next = point.next;

    model.tris = model.tris.concat(point.point);
    model.tris = model.tris.concat(next.point);
    model.tris = model.tris.concat(previous.point);

    previous.next = next;
    next.previous = previous;

    queue.deleteById(previous.id);
    queue.deleteById(next.id);

    const previousMeasure = computeMeasure(previous);
    if (previousMeasure > 0) {
      queue.push(previousMeasure, previous);
    }

    const nextMeasure = computeMeasure(next);
    if (nextMeasure > 0) {
      queue.push(nextMeasure, next);
    }

    if (point.id === model.firstPoint.id) {
      model.firstPoint = next;
    }
  }

  function earCutTriangulation() {
    computeNormal();

    const vertexQueue = vtkPriorityQueue.newInstance();
    let point = model.firstPoint;
    for (let i = 0; i < model.pointCount; i++) {
      const measure = computeMeasure(point);
      if (measure > 0) {
        vertexQueue.push(measure, point);
      }

      point = point.next;
    }

    while (model.pointCount > 2 && vertexQueue.length() > 0) {
      if (model.pointCount === vertexQueue.length()) {
        // convex
        const pointToRemove = vertexQueue.pop();
        removePoint(pointToRemove, vertexQueue);
      } else {
        // concave
        const pointToRemove = vertexQueue.pop();
        if (canRemoveVertex(pointToRemove)) {
          removePoint(pointToRemove, vertexQueue);
        }
      }
    }

    return model.pointCount <= 2;
  }

  publicAPI.triangulate = () => {
    if (!model.firstPoint) {
      return null;
    }

    return earCutTriangulation();
  };

  publicAPI.setPoints = (points) => {
    model.pointCount = points.length;

    model.firstPoint = {
      id: 0,
      point: points[0],
      next: null,
      previous: null,
    };

    let currentPoint = model.firstPoint;
    for (let i = 1; i < model.pointCount; i++) {
      currentPoint.next = {
        id: i,
        point: points[i],
        next: null,
        previous: currentPoint,
      };
      currentPoint = currentPoint.next;
    }

    model.firstPoint.previous = currentPoint;
    currentPoint.next = model.firstPoint;
  };

  publicAPI.getPointArray = () => model.tris;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  firstPoint: null,
  pointCount: 0,
  tris: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  vtkPolygon(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPolygon');

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...STATIC };
