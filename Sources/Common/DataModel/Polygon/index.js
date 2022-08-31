import macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkLine from 'vtk.js/Sources/Common/DataModel/Line';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkPriorityQueue from 'vtk.js/Sources/Common/Core/PriorityQueue';
import { IntersectionState } from 'vtk.js/Sources/Common/DataModel/Line/Constants';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkTriangle from 'vtk.js/Sources/Common/DataModel/Triangle';
import vtkCell from 'vtk.js/Sources/Common/DataModel/Cell';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';

import {
  EPSILON,
  FLOAT_EPSILON,
  TOLERANCE,
  PolygonWithPointIntersectionState,
  VTK_DBL_EPSILON,
  PolygonWithCellIntersectionState,
} from 'vtk.js/Sources/Common/DataModel/Polygon/Constants';

// ----------------------------------------------------------------------------
// vtkPolygon methods
// ----------------------------------------------------------------------------

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
    // double* p0 = pts + 3 * i;
    p0[0] = vertices[i++];
    p0[1] = vertices[i++];
    p0[2] = vertices[i++];

    if (vtkMath.distance2BetweenPoints(point, p0) <= tol2) {
      return PolygonWithPointIntersectionState.INSIDE;
    }

    if (i < vertices.length) {
      p1[0] = vertices[i];
      p1[1] = vertices[i + 1];
      p1[2] = vertices[i + 2];
    } else {
      p1[0] = vertices[0];
      p1[1] = vertices[1];
      p1[2] = vertices[2];
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
  // component. The computation will be performed in the (axis0,axis1) plane.
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

//------------------------------------------------------------------------------
function getBounds(points) {
  return points.getBounds();
}

//------------------------------------------------------------------------------
function getNormal(points, normal) {
  const n = points.getNumberOfPoints();
  const nn = [0.0, 0.0, 0.0];
  const p0 = [];
  let p1 = [];
  let p2 = [];

  points.getPoint(0, p0);
  points.getPoint(1, p1);

  const v1 = [];
  const v2 = [];
  for (let j = 2; j < n; j++) {
    points.getPoint(j, p2);
    vtkMath.subtract(p2, p1, v1);
    vtkMath.subtract(p0, p1, v2);

    nn[0] += v1[1] * v2[2] - v1[2] * v2[1];
    nn[1] += v1[2] * v2[0] - v1[0] * v2[2];
    nn[2] += v1[0] * v2[1] - v1[1] * v2[0];

    [p1, p2] = [p2, p1];
  }

  const norm = Math.sqrt(vtkMath.dot(nn, nn));
  normal[0] = nn[0] / norm;
  normal[1] = nn[1] / norm;
  normal[2] = nn[2] / norm;
  return norm;
}

//------------------------------------------------------------------------------
function isConvex(points) {
  let i;
  const v = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  let tmp;
  const a = [0, 0, 0];
  let aMag;
  const b = [0, 0, 0];
  let bMag;
  const n = [0, 0, 0];
  const ni = [0, 0, 0];
  let nComputed = false;
  const numPts = points.getNumberOfPoints();

  if (numPts < 3) {
    return false;
  }

  if (numPts === 3) {
    return true;
  }

  points.getPoint(0, v[1]);
  points.getPoint(1, v[2]);

  for (i = 0; i <= numPts; i++) {
    tmp = v[0];
    v[0] = v[1];
    v[1] = v[2];
    v[2] = tmp;

    points.getPoint((i + 2) % numPts, v[2]);

    // order is important!!! to maintain consistency with polygon vertex order
    a[0] = v[2][0] - v[1][0];
    a[1] = v[2][1] - v[1][1];
    a[2] = v[2][2] - v[1][2];
    b[0] = v[0][0] - v[1][0];
    b[1] = v[0][1] - v[1][1];
    b[2] = v[0][2] - v[1][2];

    if (!nComputed) {
      aMag = vtkMath.norm(a);
      bMag = vtkMath.norm(b);
      if (aMag > VTK_DBL_EPSILON && bMag > VTK_DBL_EPSILON) {
        vtkMath.cross(a, b, n);
        nComputed =
          vtkMath.norm(n) > VTK_DBL_EPSILON * (aMag < bMag ? bMag : aMag);
      }
    } else {
      vtkMath.cross(a, b, ni);
      if (vtkMath.norm(ni) > VTK_DBL_EPSILON && vtkMath.dot(n, ni) < 0) {
        return false;
      }
    }
  }

  return true;
}

//------------------------------------------------------------------------------
function computeCentroid(points, normal) {
  const numPts = points.getNumberOfPoints();
  // Strategy:
  // - Compute centroid of projected polygon on (x,y) if polygon is projectible, (x,z) otherwise
  // - Accumulate signed projected area as well, which is needed in the centroid's formula
  // - Infer 3rd dimension using polygon's normal.
  let i = 0;
  if (numPts < 2) {
    macro.vtkWarningMacro('Not enough points to compute centroid.');
  }
  // Handle to the doubled area of the projected polygon on (x,y) or (x,z) if the polygon
  // projected on (x,y) is degenerate.
  let a = 0.0;
  const p0 = [...points.getPoint(0), 0, 0, 0];

  let xOffset = 0;
  let yOffset = 0;
  let c = [];
  // Checking if the polygon is colinear with z axis.
  // If it is, the centroid computation axis shall be shifted
  // because the projected polygon on (x,y) is degenerate.
  const z = [0, 0, 1];
  vtkMath.cross(normal, z, c);
  // If the normal is orthogonal with z axis, the projected polygon is then a line...
  if (Math.abs(c[0] * c[0] + c[1] * c[1] + c[2] * c[2] - 1.0) <= EPSILON) {
    yOffset = 1;
    const y = [0, 1, 0];
    vtkMath.cross(normal, y, c);
    // If the normal is orthogonal with y axis, the projected polygon is then a line...
    if (Math.abs(c[0] * c[0] + c[1] * c[1] + c[2] * c[2] - 1.0) <= EPSILON) {
      xOffset = 1;
    }
  }

  c = [0, 0, 0];

  let maxabsdet = 0;
  for (i = 0; i < numPts; i++) {
    const point = points.getPoint(i);
    p0[3 * !(i % 2)] = point[0];
    p0[3 * !(i % 2) + 1] = point[1];
    p0[3 * !(i % 2) + 2] = point[2];
    const det =
      p0[3 * (i % 2) + xOffset] * p0[3 * !(i % 2) + 1 + yOffset] -
      p0[3 * !(i % 2) + xOffset] * p0[3 * (i % 2) + 1 + yOffset];
    c[xOffset] += (p0[xOffset] + p0[3 + xOffset]) * det;
    c[1 + yOffset] += (p0[1 + yOffset] + p0[4 + yOffset]) * det;
    a += det;
    maxabsdet = Math.abs(det) > maxabsdet ? Math.abs(det) : maxabsdet;
  }
  if (Math.abs(a) < EPSILON * maxabsdet) {
    // Polygon is degenerate
    macro.vtkWarningMacro('Warning: polygon is degenerate, no centroid.');
    return null;
  }
  c[xOffset] /= 3.0 * a;
  c[1 + yOffset] /= 3.0 * a;
  c[2 - xOffset - yOffset] =
    (1.0 / normal[2 - xOffset - yOffset]) *
    (-normal[xOffset] * c[xOffset] -
      normal[1 + yOffset] * c[1 + yOffset] +
      vtkMath.dot(normal, p0));
  return c;
}

//------------------------------------------------------------------------------
function computeArea(points, normal) {
  const numPts = points.getNumberOfPoints();
  if (numPts < 3) {
    return 0.0;
  }
  if (normal.length === 0) {
    return NaN;
  }

  let area = 0.0;

  // Select the projection direction
  const nx = normal[0] > 0.0 ? normal[0] : -normal[0]; // abs x-coord
  const ny = normal[1] > 0.0 ? normal[1] : -normal[1]; // abs y-coord
  const nz = normal[2] > 0.0 ? normal[2] : -normal[2]; // abs z-coord

  // coord is the index of the axis with biggest normal coordinate
  const a = nx > nz ? 0 : 2;
  const b = ny > nz ? 1 : 2;
  const coord = nx > ny ? a : b;

  // compute area of the 2D projection
  const x0 = [];
  const x1 = [];
  const x2 = [];

  for (let i = 0; i < numPts; i++) {
    points.getPoint(i, x0);
    points.getPoint((i + 1) % numPts, x1);
    points.getPoint((i + 2) % numPts, x2);
    switch (coord) {
      case 0:
        area += x1[1] * (x2[2] - x0[2]);
        break;
      case 1:
        area += x1[0] * (x2[2] - x0[2]);
        break;
      case 2:
        area += x1[0] * (x2[1] - x0[1]);
        break;
      default:
        area += 0;
        break;
    }
  }

  // scale to get area before projection
  switch (coord) {
    case 0:
      area /= 2.0 * nx;
      break;
    case 1:
      area /= 2.0 * ny;
      break;
    case 2:
      area /= 2.0 * nz;
      break;
    default:
      area /= 1;
      break;
  }
  return Math.abs(area);
}

//------------------------------------------------------------------------------
export function distanceToPolygon(x, points, closest) {
  const outObj = { t: Number.MIN_VALUE, distance: 0 };
  const bounds = points.getBounds();
  // First check to see if the point is inside the polygon
  // do a quick bounds check
  if (
    x[0] >= bounds[0] &&
    x[0] <= bounds[1] &&
    x[1] >= bounds[2] &&
    x[1] <= bounds[3] &&
    x[2] >= bounds[4] &&
    x[2] <= bounds[5]
  ) {
    const n = [0, 0, 0];
    getNormal(points, n);
    if (pointInPolygon(x, points.getData(), bounds, n)) {
      closest[0] = x[0];
      closest[1] = x[1];
      closest[2] = x[2];
      return outObj;
    }
  }

  // Not inside, compute the distance of the point to the edges.
  let minDist2 = Number.MAX_VALUE;
  const p0 = [0, 0, 0];
  const p1 = [0, 0, 0];
  const c = [0, 0, 0];
  let t = 0;
  let dist2;
  const numPts = points.getNumberOfPoints();
  for (let i = 0; i < numPts; i++) {
    points.getPoint(i, p0);
    points.getPoint((i + 1) % numPts, p1);
    const distToLine = vtkLine.distanceToLine(x, p0, p1, c);
    t = distToLine.t;
    dist2 = distToLine.distance;
    if (dist2 < minDist2) {
      minDist2 = dist2;
      closest[0] = c[0];
      closest[1] = c[1];
      closest[2] = c[2];
    }
  }

  outObj.t = t;
  outObj.distance = Math.sqrt(minDist2);
  return outObj;
}

//------------------------------------------------------------------------------
// Method intersects two polygons. You must supply the number of points and
// point coordinates (npts, *pts) and the bounding box (bounds) of the two
// polygons. Also supply a tolerance squared for controlling
// error. The method returns 1 if there is an intersection, and 0 if
// not. A single point of intersection x[3] is also returned if there
// is an intersection.
function intersectPolygonWithPolygon(points1, points2, x) {
  const n = [0, 0, 0];
  const coords = [0, 0, 0];
  const p1 = [0, 0, 0];
  const p2 = [0, 0, 0];
  const ray = [0, 0, 0];
  let t;

  //  Intersect each edge of first polygon against second
  //
  getNormal(points2, n);

  const npts = points1.getNumberOfPoints();
  const npts2 = points2.getNumberOfPoints();

  const bounds2 = points2.getBounds();
  for (let i = 0; i < npts; i++) {
    points1.getPoint(3 * i, p1);
    points1.getPoint((i + 1) % npts, p2);

    for (let j = 0; j < 3; j++) {
      ray[j] = p2[j] - p1[j];
    }
    if (!vtkBoundingBox.intersectBox(bounds2, p1, ray, coords, t)) {
      // eslint-disable-next-line no-continue
      continue;
    }

    if (vtkPlane.intersectWithLine(p1, p2, x, n) === 1) {
      if (
        vtkTriangle.pointInTriangle(
          x,
          [...points2.getPoint(0)],
          [...points2.getPoint(3)],
          [...points2.getPoint(6)]
        ) ||
        pointInPolygon(x, points2, bounds2, n) ===
          PolygonWithPointIntersectionState.INSIDE
      ) {
        return true;
      }
    } else {
      return false;
    }
  }

  //  Intersect each edge of second polygon against first
  //
  getNormal(points1, n);

  const bounds = points1.getBounds();
  for (i = 0; i < npts2; i++) {
    points2.getPoint(3 * i, p1);
    points2.getPoint((i + 1) % npts, p2);

    for (j = 0; j < 3; j++) {
      ray[j] = p2[j] - p1[j];
    }

    if (!vtkBoundingBoxBox.intersectBox(bounds, p1, ray, coords, t)) {
      continue;
    }

    if (vtkPlane.intersectWithLine(p1, p2, x, n).intersection) {
      if (
        vtkTriangle.pointInTriangle(
          x,
          [...points1.getPoint(0)],
          [...points1.getPoint(3)],
          [...points1.getPoint(6)]
        ) ||
        pointInPolygon(x, points1, bounds, n) ===
          PolygonWithPointIntersectionState.INSIDE
      ) {
        return 1;
      }
    } else {
      return 0;
    }
  }

  return 0;
}

//------------------------------------------------------------------------------
function arePolygonsCoincident(points1, points2) {
  // Check if the planes defined by the polygons points are coincident
  const origin1 = [0, 0, 0];
  points1.getPoint(0, origin1);
  const origin2 = [0, 0, 0];
  points2.getPoint(0, origin2);
  const lineBetweenPlanes = vtkMath.subtract(origin1, origin2, []);
  const normal1 = [0, 0, 0];
  const normal2 = [0, 0, 0];
  getNormal(points1, normal1);
  getNormal(points2, normal2);
  const dot1 = vtkMath.dot(lineBetweenPlanes, normal1);
  const dot2 = vtkMath.dot(lineBetweenPlanes, normal2);

  if (!(dot1 === 0 && dot2 === 0)) return null;

  const bounds1 = points1.getBounds();
  const bounds2 = points2.getBounds();
  const corner11 = [0, 0, 0];
  const corner12 = [0, 0, 0];
  const corner21 = [0, 0, 0];
  const corner22 = [0, 0, 0];
  vtkBoundingBox.computeCornerPoints(bounds1, corner11, corner12);
  vtkBoundingBox.computeCornerPoints(bounds2, corner21, corner22);

  // Intersect the two bounding boxes. If the result is one of the bounding boxes,
  // one is included in the other
  const bounds1Copy = [...bounds1];
  const intersection = vtkBoundingBox.intersect(bounds1Copy, bounds2);

  // If the bboxes intersect and the polygons are coplanar, the polygons are
  // either overlapping or included in one another
  if (intersection) {
    if (
      vtkMath.areEquals(bounds1Copy, bounds1) ||
      vtkMath.areEquals(bounds1Copy, bounds2)
    )
      return PolygonWithCellIntersectionState.INCLUDED;
    return PolygonWithCellIntersectionState.OVERLAP;
  }
  return null;
}

//------------------------------------------------------------------------------
// Create a local s-t coordinate system for a polygon. The point p0 is
// the origin of the local system, p10 is s-axis vector, and p20 is the
// t-axis vector. (These are expressed in the modelling coordinate system and
// are vectors of dimension [3].) The values l10 and l20 are the lengths of
// the vectors p10 and p20
function parameterizePolygon(points, normal) {
  let i;
  let j;
  let s;
  let t;
  const p = [0, 0, 0];
  const p1 = [0, 0, 0];
  const p2 = [0, 0, 0];
  const sbounds = [0, 0];
  const tbounds = [0, 0];
  const x1 = [0, 0, 0];
  const x2 = [0, 0, 0];
  const numPts = points.getNumberOfPoints();

  const p0 = [];
  const p10 = [];
  let l10 = 0;
  const p20 = [];
  let l20 = 0;

  const outObj = {
    p0,
    p10,
    l10,
    p20,
    l20,
  };

  if (numPts < 3) {
    return macro.vtkWarningMacro(
      'Cannot parameterize polygon with less than 2 points'
    );
  }

  //  This is a two pass process: first create a p' coordinate system
  //  that is then adjusted to ensure that the polygon points are all in
  //  the range 0<=s,t<=1.  The p' system is defined by the polygon normal,
  //  first vertex and the first edge.
  //
  points.getPoint(0, x1);
  points.getPoint(1, x2);
  for (i = 0; i < 3; i++) {
    p0[i] = x1[i];
    p10[i] = x2[i] - x1[i];
  }
  vtkMath.cross(normal, p10, p20);

  // Determine lengths of edges
  //
  l10 = vtkMath.dot(p10, p10);
  l20 = vtkMath.dot(p20, p20);
  if (l10 === 0.0 || l20 === 0.0) {
    return outObj;
  }

  //  Now evaluate all polygon points to determine min/max parametric
  //  coordinate values.
  //
  // first vertex has (s,t) = (0,0)
  sbounds[0] = 0.0;
  sbounds[1] = 0.0;
  tbounds[0] = 0.0;
  tbounds[1] = 0.0;

  for (i = 1; i < numPts; i++) {
    points.getPoint(i, x1);
    for (j = 0; j < 3; j++) {
      p[j] = x1[j] - p0[j];
    }
    s = (p[0] * p10[0] + p[1] * p10[1] + p[2] * p10[2]) / l10;
    t = (p[0] * p20[0] + p[1] * p20[1] + p[2] * p20[2]) / l20;
    sbounds[0] = s < sbounds[0] ? s : sbounds[0];
    sbounds[1] = s > sbounds[1] ? s : sbounds[1];
    tbounds[0] = t < tbounds[0] ? t : tbounds[0];
    tbounds[1] = t > tbounds[1] ? t : tbounds[1];
  }

  //  Re-evaluate coordinate system
  //
  for (i = 0; i < 3; i++) {
    p1[i] = p0[i] + sbounds[1] * p10[i] + tbounds[0] * p20[i];
    p2[i] = p0[i] + sbounds[0] * p10[i] + tbounds[1] * p20[i];
    p0[i] = p0[i] + sbounds[0] * p10[i] + tbounds[0] * p20[i];
    p10[i] = p1[i] - p0[i];
    p20[i] = p2[i] - p0[i];
  }
  l10 = vtkMath.norm(p10);
  l20 = vtkMath.norm(p20);
  outObj.l10 = l10;
  outObj.l20 = l20;

  return outObj;
}

//------------------------------------------------------------------------------
// Compute interpolation weights using mean value coordinate.
function interpolateFunctionsUsingMVC(point, points) {
  const numPts = points.getNumberOfPoints();
  const weights = vtkMath.createArray(numPts);

  // create local array for storing point-to-vertex vectors and distances
  const uVec = vtkMath.createArray(numPts * 3);
  const dist = vtkMath.createArray(numPts);
  for (let i = 0; i < numPts; i++) {
    const pt = points.getPoint(i);
    // point-to-vertex vector
    uVec[3 * i] = pt[0] - point[0];
    uVec[3 * i + 1] = pt[1] - point[1];
    uVec[3 * i + 2] = pt[2] - point[2];
    // distance
    dist[i] = vtkMath.norm([uVec[3 * i], uVec[3 * i + 1], uVec[3 * i + 2]]);

    // handle special case when the point is really close to a vertex
    if (dist[i] <= EPSILON) {
      weights[i] = 1.0;
      return weights;
    }

    uVec[3 * i] /= dist[i];
    uVec[3 * i + 1] /= dist[i];
    uVec[3 * i + 2] /= dist[i];
  }

  // Now loop over all vertices to compute weight
  // w_i = ( tan(theta_i/2) + tan(theta_(i+1)/2) ) / dist_i
  // To do consider the simplification of
  // tan(alpha/2) = (1-cos(alpha))/sin(alpha)
  //              = (d0*d1 - cross(u0, u1))/(2*dot(u0,u1))
  const tanHalfTheta = vtkMath.createArray(numPts);
  for (let i = 0; i < numPts; i++) {
    const i1 = (i + 1) % numPts;

    const l = Math.sqrt(
      vtkMath.distance2BetweenPoints(
        [uVec[3 * i], uVec[3 * i + 1], uVec[3 * i + 2]],
        [uVec[3 * i1], uVec[3 * i1 + 1], uVec[3 * i1 + 2]]
      )
    );
    const theta = 2.0 * Math.asin(l / 2.0);

    // special case where x lies on an edge
    if (Math.PI - theta < 0.001) {
      weights[i] = dist[i1] / (dist[i] + dist[i1]);
      weights[i1] = 1 - weights[i];
      return weights;
    }

    tanHalfTheta[i] = Math.tan(theta / 2.0);
  }

  // Normal case
  for (let i = 0; i < numPts; i++) {
    let i1 = i - 1;
    if (i1 === -1) {
      i1 = numPts - 1;
    }

    weights[i] = (tanHalfTheta[i] + tanHalfTheta[i1]) / dist[i];
  }

  // normalize weight
  let sum = 0.0;
  for (let i = 0; i < numPts; i++) {
    sum += weights[i];
  }

  if (Math.abs(sum) <= EPSILON) {
    return weights;
  }

  for (let i = 0; i < numPts; i++) {
    weights[i] /= sum;
  }

  return weights;
}

//------------------------------------------------------------------------------
function interpolateFunctions(point, points, useMVCInterpolation) {
  // Compute interpolation weights using mean value coordinate.
  if (useMVCInterpolation) {
    return interpolateFunctionsUsingMVC(point, points);
  }

  const weights = [];

  // Compute interpolation weights using 1/r**2 normalized sum.
  let i;
  const numPts = points.getNumberOfPoints();
  let sum;
  const pt = [0, 0, 0];

  for (sum = 0.0, i = 0; i < numPts; i++) {
    points.getPoint(i, pt);
    weights[i] = vtkMath.distance2BetweenPoints(point, pt);
    if (weights[i] === 0.0) {
      // exact hit
      for (let j = 0; j < numPts; j++) {
        weights[j] = 0.0;
      }
      weights[i] = 1.0;
      return weights;
    }
    weights[i] = 1.0 / weights[i];
    sum += weights[i];
  }

  for (i = 0; i < numPts; i++) {
    weights[i] /= sum;
  }
  return weights;
}

// ------------------------------------------------------------------------------
// Given a 3D point "point" return inside, outside cell, or failure
// Evaluate parametric coordinates,
// distance squared of point "point" to cell (in particular, the sub-cell indicated),
// closest point on cell to "point" (unless closestPoint is null, in which case, the
// closest point and dist2 are not found), and interpolation weights in cell.
function evaluatePosition(point, points, normal) {
  const cp = [0, 0, 0];
  const ray = [0, 0, 0];

  const res = {
    intersection: false,
    dist: Infinity,
    pcoords: [],
    weights: [],
    closestPoint: [],
  };

  const { p0, p10, l10, p20, l20 } = parameterizePolygon(points, normal);
  res.weights = interpolateFunctions(point, points, false);

  vtkPlane.projectPoint(point, p0, normal, cp);

  for (let i = 0; i < 3; i++) {
    ray[i] = cp[i] - p0[i];
  }
  res.pcoords[0] = vtkMath.dot(ray, p10) / (l10 * l10);
  res.pcoords[1] = vtkMath.dot(ray, p20) / (l20 * l20);
  res.pcoords[2] = 0.0;

  if (
    res.pcoords[0] >= 0.0 &&
    res.pcoords[0] <= 1.0 &&
    res.pcoords[1] >= 0.0 &&
    res.pcoords[1] <= 1.0 &&
    pointInPolygon(cp, points.getData(), points.getBounds(), normal) ===
      PolygonWithPointIntersectionState.INSIDE
  ) {
    res.closestPoint = [...cp];
    res.dist = vtkMath.distance2BetweenPoints(point, res.closestPoint);
    res.intersection = true;
    return res;
  }

  // If here, point is outside of polygon, so need to find distance to boundary
  //

  let t;
  let dist2;
  const closest = [0, 0, 0];
  const pt1 = [0, 0, 0];
  const pt2 = [0, 0, 0];

  const numPts = points.getNumberOfPoints();
  for (let minDist2 = Number.MAX_VALUE, i = 0; i < numPts; i++) {
    points.getPoint(i, pt1);
    points.getPoint((i + 1) % numPts, pt2);
    dist2 = vtkLine.distanceToLine(point, pt1, pt2, t, closest);
    if (dist2 < minDist2) {
      res.closestPoint = [...closest];
      minDist2 = dist2;
    }
  }
  res.dist = dist2;
  return res;
}

//------------------------------------------------------------------------------
function intersectWithLine(p1, p2, points, normal) {
  let outObj = {
    intersection: false,
    betweenPoints: false,
    t: Number.MAX_VALUE,
    x: [],
  };
  const tol2 = TOLERANCE * TOLERANCE;

  // Intersect plane of the polygon with line
  //
  const data = points.getData();
  outObj = vtkPlane.intersectWithLine(
    p1,
    p2,
    [data[0], data[1], data[2]],
    normal
  );
  if (!outObj.intersection) {
    return outObj;
  }

  // Evaluate position
  const position = evaluatePosition(outObj.x, points, normal);
  if (!(position.intersection || position.dist <= tol2)) {
    outObj.intersection = false;
  }

  return outObj;
}

//------------------------------------------------------------------------------
function intersectConvex2DCells(cell, points, normal) {
  // Intersect the six total edges of the two triangles against each other. Two points are
  // all that are required.
  const numPts = points.getNumberOfPoints();
  const x0 = [];
  const x1 = [];
  let lineIntersection;
  const outObj = {
    intersection: PolygonWithCellIntersectionState.NO_INTERSECTION,
    x0: [],
    x1: [],
  };
  let idx = 0;
  const t2 = TOLERANCE * TOLERANCE;

  const numPts2 = cell.getNumberOfPoints();

  const poly = new Array(numPts);
  for (let i = 0; i < poly.length; i++) poly[i] = i;
  const coincidence = arePolygonsCoincident(cell.getPoints(), points);
  if (coincidence !== null) {
    outObj.intersection = coincidence;
    return outObj;
  }

  // Loop over edges of second polygon and intersect against first polygon
  let i;
  for (i = 0; i < numPts2; i++) {
    cell.getPoints().getPoint(i, x0);
    cell.getPoints().getPoint((i + 1) % numPts2, x1);

    lineIntersection = intersectWithLine(x0, x1, points, normal);
    if (lineIntersection.intersection) {
      if (idx === 0) {
        outObj.x0 = lineIntersection.x;
        idx++;
      } else if (
        (x1[0] - x0[0]) * (x1[0] - x0[0]) +
          (x1[1] - x0[1]) * (x1[1] - x0[1]) +
          (x1[2] - x0[2]) * (x1[2] - x0[2]) >
          t2 &&
        !vtkMath.areEquals(lineIntersection.x, outObj.x0)
      ) {
        outObj.intersection =
          PolygonWithCellIntersectionState.LINE_INTERSECTION;
        outObj.x1 = lineIntersection.x;
        return outObj;
      }
    } // if edge intersection
  } // over all edges

  for (i = 0; i < numPts; i++) {
    points.getPoint(i, x0);
    points.getPoint((i + 1) % numPts, x1);

    lineIntersection = cell.intersectWithLine(x0, x1);

    if (lineIntersection.intersection) {
      if (idx === 0) {
        outObj.x0 = lineIntersection.x;
        idx++;
      } else if (
        (x1[0] - x0[0]) * (x1[0] - x0[0]) +
          (x1[1] - x0[1]) * (x1[1] - x0[1]) +
          (x1[2] - x0[2]) * (x1[2] - x0[2]) >
          t2 &&
        !vtkMath.areEquals(lineIntersection.x, outObj.x0)
      ) {
        outObj.intersection =
          PolygonWithCellIntersectionState.LINE_INTERSECTION;
        outObj.x1 = lineIntersection.x;
        return outObj;
      }
    } // if edge intersection
  } // over all edges

  // Evaluate what we got
  if (idx === 1) {
    outObj.intersection = PolygonWithCellIntersectionState.POINT_INTERSECTION; // everything intersecting at single point
    return outObj;
  }
  outObj.intersection = PolygonWithCellIntersectionState.NO_INTERSECTION;
  return outObj;
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

const STATIC = {
  PolygonWithPointIntersectionState,
  PolygonWithCellIntersectionState,
  pointInPolygon,
  getBounds,
  getNormal,
  isConvex,
  computeCentroid,
  computeArea,
  evaluatePosition,
  intersectWithLine,
  intersectConvex2DCells,
  interpolateFunctions,
  parameterizePolygon,
};

// ----------------------------------------------------------------------------
// vtkPolygon methods
// ----------------------------------------------------------------------------

function vtkPolygon(publicAPI, model) {
  // Set our classname
  model.classHierarchy.push('vtkPolygon');

  function toCorrectId(i, nbPoints) {
    return i < 0 ? nbPoints - 1 : i % nbPoints;
  }

  function computeMeasure(pointId, idsToHandle) {
    const v1 = [0, 0, 0];
    const v2 = [0, 0, 0];
    const v3 = [0, 0, 0];
    const v4 = [0, 0, 0];
    const i = idsToHandle.indexOf(pointId);
    const numPts = model.points.getNumberOfPoints();

    const current = [0, 0, 0];
    model.points.getPoint(idsToHandle[i], current);
    const next = [0, 0, 0];
    model.points.getPoint(
      toCorrectId(idsToHandle[toCorrectId(i + 1, idsToHandle.length)], numPts),
      next
    );
    const previous = [0, 0, 0];
    model.points.getPoint(
      toCorrectId(idsToHandle[toCorrectId(i - 1, idsToHandle.length)], numPts),
      previous
    );
    vtkMath.subtract(current, previous, v1);
    vtkMath.subtract(next, current, v2);
    vtkMath.subtract(previous, next, v3);
    vtkMath.cross(v1, v2, v4);

    const area = vtkMath.dot(v4, model.normal);

    if (area <= 0) {
      return -1;
    }

    const perimeter = vtkMath.norm(v1) + vtkMath.norm(v2) + vtkMath.norm(v3);

    return (perimeter * perimeter) / area;
  }

  function canRemoveVertex(pointId, idsToRemove) {
    if (model.points.getNumberOfPoints() <= 3) {
      return true;
    }

    const i = idsToRemove.indexOf(pointId);

    const previous = [0, 0, 0];
    const next = [0, 0, 0];
    const v = [0, 0, 0];
    const sN = [0, 0, 0];
    const nextNext = [0, 0, 0];

    const prevId = idsToRemove[toCorrectId(i - 1, idsToRemove.length)];
    const nextId = idsToRemove[toCorrectId(i + 1, idsToRemove.length)];

    model.points.getPoint(prevId, previous);
    model.points.getPoint(nextId, next);

    vtkMath.subtract(next, previous, v);

    vtkMath.cross(v, model.normal, sN);
    vtkMath.normalize(sN);
    if (vtkMath.norm(sN) === 0) {
      return false;
    }
    model.points.getPoint(
      idsToRemove[toCorrectId(i + 2, idsToRemove.length)],
      nextNext
    );

    let val = vtkPlane.evaluate(sN, previous, nextNext);
    // eslint-disable-next-line no-nested-ternary
    let currentSign = val > EPSILON ? 1 : val < -EPSILON ? -1 : 0;
    let oneNegative = currentSign < 0 ? 1 : 0;

    for (
      let vertexId = idsToRemove[toCorrectId(i + 3, idsToRemove.length)];
      vertexId !== prevId;
      vertexId = idsToRemove[toCorrectId(vertexId + 1, idsToRemove.length)]
    ) {
      const prevId2 =
        idsToRemove[toCorrectId(vertexId - 1, idsToRemove.length)];
      const previousVertex = [0, 0, 0];
      model.points.getPoint(prevId2, previousVertex);
      const vertex = [0, 0, 0];
      model.points.getPoint(vertexId, vertex);
      val = vtkPlane.evaluate(sN, previousVertex, vertex);
      // eslint-disable-next-line no-nested-ternary
      const sign = val > EPSILON ? 1 : val < -EPSILON ? -1 : 0;

      if (sign !== currentSign) {
        if (!oneNegative) {
          oneNegative = sign <= 0 ? 1 : 0;
        }

        if (
          vtkLine.intersection(
            previous,
            next,
            vertex,
            previousVertex,
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

  function removePoint(pointId, queue, idsToHandle) {
    const i = idsToHandle.indexOf(pointId);

    const prevId = idsToHandle[toCorrectId(i - 1, idsToHandle.length)];
    const nextId = idsToHandle[toCorrectId(i + 1, idsToHandle.length)];
    const currentId = idsToHandle[i];

    const previous = [0, 0, 0];
    model.points.getPoint(prevId, previous);
    const next = [0, 0, 0];
    model.points.getPoint(nextId, next);
    const toRemove = [0, 0, 0];
    model.points.getPoint(currentId, toRemove);

    queue.deleteById(prevId);
    queue.deleteById(nextId);

    idsToHandle.splice(i, 1);

    const previousMeasure = computeMeasure(prevId, idsToHandle);
    if (previousMeasure > 0) {
      queue.push(previousMeasure, prevId);
    } else {
      idsToHandle.splice(idsToHandle.indexOf(prevId), 1);
    }

    const nextMeasure = computeMeasure(nextId, idsToHandle);
    if (nextMeasure > 0) {
      queue.push(nextMeasure, nextId);
    } else {
      idsToHandle.splice(idsToHandle.indexOf(nextId), 1);
    }
    return [...toRemove, ...next, ...previous];
  }

  function earCutTriangulation() {
    if (model.points.getNumberOfPoints() < 3) return null;
    const vertexQueue = vtkPriorityQueue.newInstance();
    // The algorithm needs to remove points from the polygon, so it is handled here by storing
    // the ids of the points that remain to handle
    const idsToHandle = [...model.pointsIds];
    for (let i = 0; i < idsToHandle.length; i++) {
      const measure = computeMeasure(i, model.pointsIds);
      if (measure > 0) {
        vertexQueue.push(measure, i);
      }
    }
    const triangles = [];
    while (idsToHandle.length > 2 && vertexQueue.length() > 0) {
      if (idsToHandle.length === vertexQueue.length()) {
        // convex
        const idPointToRemove = vertexQueue.pop();
        triangles.push(
          ...removePoint(idPointToRemove, vertexQueue, idsToHandle)
        );
      } else {
        // concave
        const idPointToRemove = vertexQueue.pop();
        if (canRemoveVertex(idPointToRemove, idsToHandle)) {
          triangles.push(
            ...removePoint(idPointToRemove, vertexQueue, idsToHandle)
          );
        }
      }
    }

    return idsToHandle.length <= 2 ? triangles : null;
  }

  publicAPI.computeNormal = () => getNormal(model.points, model.normal);

  publicAPI.getBounds = () => getBounds(model.points);

  publicAPI.triangulate = () => {
    if (model.points.getNumberOfPoints() === 0) {
      return null;
    }

    return earCutTriangulation();
  };

  publicAPI.setPoints = (points, pointsIds) => {
    let pointsData = points;
    if (Array.isArray(pointsData[0])) {
      pointsData = points.flat(2);
    }
    model.points = vtkPoints.newInstance({ values: pointsData });
    if (!pointsIds) {
      model.pointsIds = new Array(pointsData.length / 3);
      for (let i = 0; i < points.length; i++) model.pointsIds[i] = i;
    } else {
      model.pointsIds = pointsIds;
    }
    publicAPI.computeNormal();
  };

  publicAPI.computeCentroid = () => computeCentroid(model.points, model.normal);

  //------------------------------------------------------------------------------
  // Compute the area of the polygon (oriented in 3D space). It uses an
  // efficient approach where the area is computed in 2D and then projected into
  // 3D space.
  publicAPI.computeArea = () => computeArea(model.points, model.normal);

  publicAPI.distanceToPolygon = (x, closest) =>
    distanceToPolygon(x, model.points, closest);

  publicAPI.isConvex = () => isConvex(model.points);

  publicAPI.pointInPolygon = (point) =>
    pointInPolygon(
      point,
      model.points.getData(),
      publicAPI.getBounds(),
      model.normal
    );

  //------------------------------------------------------------------------------
  // Compute interpolation weights using 1/r**2 normalized sum or mean value
  // coordinate.
  publicAPI.interpolateFunctions = (point, useMVCInterpolation) =>
    interpolateFunctions(point, model.points, useMVCInterpolation);

  //------------------------------------------------------------------------------
  //
  // Intersect this polygon with finite line defined by p1 & p2
  //
  publicAPI.intersectWithLine = (x1, x2) =>
    intersectWithLine(x1, x2, model.points, model.normal);

  publicAPI.intersectConvex2DCells = (cell) =>
    intersectConvex2DCells(cell, model.points, model.normal);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  points: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkCell.extend(publicAPI, model, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  vtkPolygon(publicAPI, model);
  model.normal = [];
  if (initialValues.points) {
    publicAPI.computeNormal();
  }
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPolygon');

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...STATIC };
