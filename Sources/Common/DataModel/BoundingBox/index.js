import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import { vec3 } from 'gl-matrix';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';

const INIT_BOUNDS = [
  Number.MAX_VALUE,
  -Number.MAX_VALUE, // X
  Number.MAX_VALUE,
  -Number.MAX_VALUE, // Y
  Number.MAX_VALUE,
  -Number.MAX_VALUE, // Z
];

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

export function equals(a, b) {
  return (
    a[0] === b[0] &&
    a[1] === b[1] &&
    a[2] === b[2] &&
    a[3] === b[3] &&
    a[4] === b[4] &&
    a[5] === b[5]
  );
}

export function isValid(bounds) {
  return (
    bounds?.length >= 6 &&
    bounds[0] <= bounds[1] &&
    bounds[2] <= bounds[3] &&
    bounds[4] <= bounds[5]
  );
}

export function setBounds(bounds, otherBounds) {
  bounds[0] = otherBounds[0];
  bounds[1] = otherBounds[1];
  bounds[2] = otherBounds[2];
  bounds[3] = otherBounds[3];
  bounds[4] = otherBounds[4];
  bounds[5] = otherBounds[5];
  return bounds;
}

export function reset(bounds) {
  return setBounds(bounds, INIT_BOUNDS);
}

export function addPoint(bounds, x, y, z) {
  const [xMin, xMax, yMin, yMax, zMin, zMax] = bounds;
  bounds[0] = xMin < x ? xMin : x;
  bounds[1] = xMax > x ? xMax : x;
  bounds[2] = yMin < y ? yMin : y;
  bounds[3] = yMax > y ? yMax : y;
  bounds[4] = zMin < z ? zMin : z;
  bounds[5] = zMax > z ? zMax : z;
  return bounds;
}

export function addPoints(bounds, points) {
  if (points.length === 0) {
    return bounds;
  }
  if (Array.isArray(points[0])) {
    for (let i = 0; i < points.length; ++i) {
      addPoint(bounds, ...points[i]);
    }
  } else {
    for (let i = 0; i < points.length; i += 3) {
      addPoint(bounds, ...points.slice(i, i + 3));
    }
  }
  return bounds;
}

export function addBounds(bounds, xMin, xMax, yMin, yMax, zMin, zMax) {
  const [_xMin, _xMax, _yMin, _yMax, _zMin, _zMax] = bounds;
  if (zMax === undefined) {
    bounds[0] = Math.min(xMin[0], _xMin);
    bounds[1] = Math.max(xMin[1], _xMax);
    bounds[2] = Math.min(xMin[2], _yMin);
    bounds[3] = Math.max(xMin[3], _yMax);
    bounds[4] = Math.min(xMin[4], _zMin);
    bounds[5] = Math.max(xMin[5], _zMax);
  } else {
    bounds[0] = Math.min(xMin, _xMin);
    bounds[1] = Math.max(xMax, _xMax);
    bounds[2] = Math.min(yMin, _yMin);
    bounds[3] = Math.max(yMax, _yMax);
    bounds[4] = Math.min(zMin, _zMin);
    bounds[5] = Math.max(zMax, _zMax);
  }
  return bounds;
}

export function setMinPoint(bounds, x, y, z) {
  const [xMin, xMax, yMin, yMax, zMin, zMax] = bounds;
  bounds[0] = x;
  bounds[1] = x > xMax ? x : xMax;
  bounds[2] = y;
  bounds[3] = y > yMax ? y : yMax;
  bounds[4] = z;
  bounds[5] = z > zMax ? z : zMax;
  return xMin !== x || yMin !== y || zMin !== z;
}

export function setMaxPoint(bounds, x, y, z) {
  const [xMin, xMax, yMin, yMax, zMin, zMax] = bounds;
  bounds[0] = x < xMin ? x : xMin;
  bounds[1] = x;
  bounds[2] = y < yMin ? y : yMin;
  bounds[3] = y;
  bounds[4] = z < zMin ? z : zMin;
  bounds[5] = z;

  return xMax !== x || yMax !== y || zMax !== z;
}

function inflate(bounds, delta) {
  if (delta == null) {
    // eslint-disable-next-line no-use-before-define
    return minInflate(bounds);
  }
  bounds[0] -= delta;
  bounds[1] += delta;
  bounds[2] -= delta;
  bounds[3] += delta;
  bounds[4] -= delta;
  bounds[5] += delta;
  return bounds;
}

function minInflate(bounds) {
  const nonZero = [0, 0, 0];
  let maxIdx = -1;
  let max = 0.0;
  let w = 0.0;
  for (let i = 0; i < 3; ++i) {
    w = bounds[i * 2 + 1] - bounds[i * 2];
    if (w > max) {
      max = w;
      maxIdx = i;
    }
    nonZero[i] = w > 0.0 ? 1 : 0;
  }

  if (maxIdx < 0) {
    return inflate(bounds, 0.5);
  }

  // Any zero width sides are bumped out 1% of max side
  for (let i = 0; i < 3; ++i) {
    if (!nonZero[i]) {
      const d = 0.005 * max;
      bounds[i * 2] -= d;
      bounds[i * 2 + 1] += d;
    }
  }
  return bounds;
}

export function scale(bounds, sx, sy, sz) {
  if (!isValid(bounds)) {
    return false;
  }
  if (sx >= 0.0) {
    bounds[0] *= sx;
    bounds[1] *= sx;
  } else {
    bounds[0] = sx * bounds[1];
    bounds[1] = sx * bounds[0];
  }

  if (sy >= 0.0) {
    bounds[2] *= sy;
    bounds[3] *= sy;
  } else {
    bounds[2] = sy * bounds[3];
    bounds[3] = sy * bounds[2];
  }

  if (sz >= 0.0) {
    bounds[4] *= sz;
    bounds[5] *= sz;
  } else {
    bounds[4] = sz * bounds[5];
    bounds[5] = sz * bounds[4];
  }

  return true;
}

export function getCenter(bounds) {
  return [
    0.5 * (bounds[0] + bounds[1]),
    0.5 * (bounds[2] + bounds[3]),
    0.5 * (bounds[4] + bounds[5]),
  ];
}

export function scaleAboutCenter(bounds, sx, sy, sz) {
  if (!isValid(bounds)) {
    return false;
  }
  const center = getCenter(bounds);
  bounds[0] -= center[0];
  bounds[1] -= center[0];
  bounds[2] -= center[1];
  bounds[3] -= center[1];
  bounds[4] -= center[2];
  bounds[5] -= center[2];
  scale(bounds, sx, sy, sz);
  bounds[0] += center[0];
  bounds[1] += center[0];
  bounds[2] += center[1];
  bounds[3] += center[1];
  bounds[4] += center[2];
  bounds[5] += center[2];

  return true;
}

export function getLength(bounds, index) {
  return bounds[index * 2 + 1] - bounds[index * 2];
}

export function getLengths(bounds) {
  return [getLength(bounds, 0), getLength(bounds, 1), getLength(bounds, 2)];
}

export function getXRange(bounds) {
  return bounds.slice(0, 2);
}

export function getYRange(bounds) {
  return bounds.slice(2, 4);
}

export function getZRange(bounds) {
  return bounds.slice(4, 6);
}

export function getMaxLength(bounds) {
  const l = getLengths(bounds);
  if (l[0] > l[1]) {
    if (l[0] > l[2]) {
      return l[0];
    }
    return l[2];
  }

  if (l[1] > l[2]) {
    return l[1];
  }

  return l[2];
}

export function getDiagonalLength2(bounds) {
  if (isValid(bounds)) {
    const l = getLengths(bounds);
    return l[0] * l[0] + l[1] * l[1] + l[2] * l[2];
  }
  return null;
}

export function getDiagonalLength(bounds) {
  const lenght2 = getDiagonalLength2(bounds);
  return lenght2 !== null ? Math.sqrt(lenght2) : null;
}

export function getMinPoint(bounds) {
  return [bounds[0], bounds[2], bounds[4]];
}

export function getMaxPoint(bounds) {
  return [bounds[1], bounds[3], bounds[5]];
}

function oppositeSign(a, b) {
  return (a <= 0 && b >= 0) || (a >= 0 && b <= 0);
}

export function getCorners(bounds, corners) {
  corners[0] = [bounds[0], bounds[2], bounds[4]];
  corners[1] = [bounds[0], bounds[2], bounds[5]];
  corners[2] = [bounds[0], bounds[3], bounds[4]];
  corners[3] = [bounds[0], bounds[3], bounds[5]];
  corners[4] = [bounds[1], bounds[2], bounds[4]];
  corners[5] = [bounds[1], bounds[2], bounds[5]];
  corners[6] = [bounds[1], bounds[3], bounds[4]];
  corners[7] = [bounds[1], bounds[3], bounds[5]];
  return corners;
}

// Computes the two corners with minimal and maximal coordinates
export function computeCornerPoints(bounds, point1, point2) {
  point1[0] = bounds[0];
  point1[1] = bounds[2];
  point1[2] = bounds[4];

  point2[0] = bounds[1];
  point2[1] = bounds[3];
  point2[2] = bounds[5];
  return point1;
}

export function transformBounds(bounds, transform, out = []) {
  const corners = getCorners(bounds, []);
  for (let i = 0; i < corners.length; ++i) {
    vec3.transformMat4(corners[i], corners[i], transform);
  }
  reset(out);
  return addPoints(out, corners);
}

export function computeScale3(bounds, scale3 = []) {
  scale3[0] = 0.5 * (bounds[1] - bounds[0]);
  scale3[1] = 0.5 * (bounds[3] - bounds[2]);
  scale3[2] = 0.5 * (bounds[5] - bounds[4]);
  return scale3;
}

/**
 * Compute local bounds.
 * Not as fast as vtkPoints.getBounds() if u, v, w form a natural basis.
 * @param {vtkPoints} points
 * @param {array} u first vector
 * @param {array} v second vector
 * @param {array} w third vector
 */
export function computeLocalBounds(points, u, v, w) {
  const bounds = [].concat(INIT_BOUNDS);
  const pointsData = points.getData();
  for (let i = 0; i < pointsData.length; i += 3) {
    const point = [pointsData[i], pointsData[i + 1], pointsData[i + 2]];
    const du = vtkMath.dot(point, u);
    bounds[0] = Math.min(du, bounds[0]);
    bounds[1] = Math.max(du, bounds[1]);
    const dv = vtkMath.dot(point, v);
    bounds[2] = Math.min(dv, bounds[2]);
    bounds[3] = Math.max(dv, bounds[3]);
    const dw = vtkMath.dot(point, w);
    bounds[4] = Math.min(dw, bounds[4]);
    bounds[5] = Math.max(dw, bounds[5]);
  }
  return bounds;
}

// The method returns a non-zero value if the bounding box is hit.
// Origin[3] starts the ray, dir[3] is the vector components of the ray in the x-y-z
// directions, coord[3] is the location of hit, and t is the parametric
// coordinate along line. (Notes: the intersection ray dir[3] is NOT
// normalized.  Valid intersections will only occur between 0<=t<=1.)
export function intersectBox(bounds, origin, dir, coord, tolerance) {
  let inside = true;
  const quadrant = [];
  let whichPlane = 0;
  const maxT = [];
  const candidatePlane = [0.0, 0.0, 0.0];
  const RIGHT = 0;
  const LEFT = 1;
  const MIDDLE = 2;

  // First find closest planes
  for (let i = 0; i < 3; i++) {
    if (origin[i] < bounds[2 * i]) {
      quadrant[i] = LEFT;
      candidatePlane[i] = bounds[2 * i];
      inside = false;
    } else if (origin[i] > bounds[2 * i + 1]) {
      quadrant[i] = RIGHT;
      candidatePlane[i] = bounds[2 * i + 1];
      inside = false;
    } else {
      quadrant[i] = MIDDLE;
    }
  }

  // Check whether origin of ray is inside bbox
  if (inside) {
    coord[0] = origin[0];
    coord[1] = origin[1];
    coord[2] = origin[2];
    tolerance[0] = 0;
    return 1;
  }

  // Calculate parametric distance to plane
  for (let i = 0; i < 3; i++) {
    if (quadrant[i] !== MIDDLE && dir[i] !== 0.0) {
      maxT[i] = (candidatePlane[i] - origin[i]) / dir[i];
    } else {
      maxT[i] = -1.0;
    }
  }

  // Find the largest parametric value of intersection
  for (let i = 0; i < 3; i++) {
    if (maxT[whichPlane] < maxT[i]) {
      whichPlane = i;
    }
  }

  // Check for value intersection along line
  if (maxT[whichPlane] > 1.0 || maxT[whichPlane] < 0.0) {
    return 0;
  }

  tolerance[0] = maxT[whichPlane];

  // Intersection point along line is okay. Check bbox.
  for (let i = 0; i < 3; i++) {
    if (whichPlane !== i) {
      coord[i] = origin[i] + maxT[whichPlane] * dir[i];
      if (coord[i] < bounds[2 * i] || coord[i] > bounds[2 * i + 1]) {
        return 0;
      }
    } else {
      coord[i] = candidatePlane[i];
    }
  }

  return 1;
}

// Plane intersection with box
// The plane is infinite in extent and defined by an origin and normal.The function indicates
// whether the plane intersects, not the particulars of intersection points and such
// The function returns non-zero if the plane and box intersect; zero otherwise.
export function intersectPlane(bounds, origin, normal) {
  const p = [];
  let d = 0;
  let sign = 1;
  let firstOne = 1;

  // Evaluate the eight points. If there is a sign change, there is an intersection
  for (let z = 4; z <= 5; ++z) {
    p[2] = bounds[z];
    for (let y = 2; y <= 3; ++y) {
      p[1] = bounds[y];
      for (let x = 0; x <= 1; ++x) {
        p[0] = bounds[x];
        d = vtkPlane.evaluate(normal, origin, p);
        if (firstOne) {
          sign = d >= 0 ? 1 : -1;
          firstOne = 0;
        }
        if (d === 0.0 || (sign > 0 && d < 0.0) || (sign < 0 && d > 0.0)) {
          return 1;
        }
      }
    }
  }

  return 0; // no intersection
}

export function intersect(bounds, bBounds) {
  if (!(isValid(bounds) && isValid(bBounds))) {
    return false;
  }

  const newBounds = [0, 0, 0, 0, 0, 0];
  let intersection;
  for (let i = 0; i < 3; i++) {
    intersection = false;
    if (
      bBounds[i * 2] >= bounds[i * 2] &&
      bBounds[i * 2] <= bounds[i * 2 + 1]
    ) {
      intersection = true;
      newBounds[i * 2] = bBounds[i * 2];
    } else if (
      bounds[i * 2] >= bBounds[i * 2] &&
      bounds[i * 2] <= bBounds[i * 2 + 1]
    ) {
      intersection = true;
      newBounds[i * 2] = bounds[i * 2];
    }

    if (
      bBounds[i * 2 + 1] >= bounds[i * 2] &&
      bBounds[i * 2 + 1] <= bounds[i * 2 + 1]
    ) {
      intersection = true;
      newBounds[i * 2 + 1] = bBounds[2 * i + 1];
    } else if (
      bounds[i * 2 + 1] >= bBounds[i * 2] &&
      bounds[i * 2 + 1] <= bBounds[i * 2 + 1]
    ) {
      intersection = true;
      newBounds[i * 2 + 1] = bounds[i * 2 + 1];
    }

    if (!intersection) {
      return false;
    }
  }

  // OK they did intersect - set the box to be the result
  bounds[0] = newBounds[0];
  bounds[1] = newBounds[1];
  bounds[2] = newBounds[2];
  bounds[3] = newBounds[3];
  bounds[4] = newBounds[4];
  bounds[5] = newBounds[5];
  return true;
}

export function intersects(bounds, bBounds) {
  if (!(isValid(bounds) && isValid(bBounds))) {
    return false;
  }
  /* eslint-disable no-continue */
  for (let i = 0; i < 3; i++) {
    if (
      bBounds[i * 2] >= bounds[i * 2] &&
      bBounds[i * 2] <= bounds[i * 2 + 1]
    ) {
      continue;
    } else if (
      bounds[i * 2] >= bBounds[i * 2] &&
      bounds[i * 2] <= bBounds[i * 2 + 1]
    ) {
      continue;
    }

    if (
      bBounds[i * 2 + 1] >= bounds[i * 2] &&
      bBounds[i * 2 + 1] <= bounds[i * 2 + 1]
    ) {
      continue;
    } else if (
      bounds[i * 2 + 1] >= bBounds[i * 2] &&
      bounds[i * 2 + 1] <= bBounds[i * 2 + 1]
    ) {
      continue;
    }
    return false;
  }
  /* eslint-enable no-continue */

  return true;
}

export function containsPoint(bounds, x, y, z) {
  if (x < bounds[0] || x > bounds[1]) {
    return false;
  }

  if (y < bounds[2] || y > bounds[3]) {
    return false;
  }

  if (z < bounds[4] || z > bounds[5]) {
    return false;
  }

  return true;
}

export function contains(bounds, otherBounds) {
  // if either box is not valid or they don't intersect
  if (!intersects(bounds, otherBounds)) {
    return false;
  }

  if (!containsPoint(bounds, ...getMinPoint(otherBounds))) {
    return false;
  }

  if (!containsPoint(bounds, ...getMaxPoint(otherBounds))) {
    return false;
  }

  return true;
}

/**
 * Returns true if plane intersects bounding box.
 * If so, the box is cut by the plane
 * @param {array} origin
 * @param {array} normal
 */
export function cutWithPlane(bounds, origin, normal) {
  // Index[0..2] represents the order of traversing the corners of a cube
  // in (x,y,z), (y,x,z) and (z,x,y) ordering, respectively
  const index = [
    [0, 1, 2, 3, 4, 5, 6, 7],
    [0, 1, 4, 5, 2, 3, 6, 7],
    [0, 2, 4, 6, 1, 3, 5, 7],
  ];

  // stores the signed distance to a plane
  const d = [0, 0, 0, 0, 0, 0, 0, 0];
  let idx = 0;
  for (let ix = 0; ix < 2; ix++) {
    for (let iy = 2; iy < 4; iy++) {
      for (let iz = 4; iz < 6; iz++) {
        const x = [bounds[ix], bounds[iy], bounds[iz]];
        d[idx++] = vtkPlane.evaluate(normal, origin, x);
      }
    }
  }

  let dir = 2;
  while (dir--) {
    // in each direction, we test if the vertices of two orthogonal faces
    // are on either side of the plane
    if (
      oppositeSign(d[index[dir][0]], d[index[dir][4]]) &&
      oppositeSign(d[index[dir][1]], d[index[dir][5]]) &&
      oppositeSign(d[index[dir][2]], d[index[dir][6]]) &&
      oppositeSign(d[index[dir][3]], d[index[dir][7]])
    ) {
      break;
    }
  }

  if (dir < 0) {
    return false;
  }

  const sign = Math.sign(normal[dir]);
  const size = Math.abs((bounds[dir * 2 + 1] - bounds[dir * 2]) * normal[dir]);
  let t = sign > 0 ? 1 : 0;
  /* eslint-disable no-continue */
  for (let i = 0; i < 4; i++) {
    if (size === 0) {
      continue; // shouldn't happen
    }
    const ti = Math.abs(d[index[dir][i]]) / size;
    if (sign > 0 && ti < t) {
      t = ti;
    }

    if (sign < 0 && ti > t) {
      t = ti;
    }
  }
  /* eslint-enable no-continue */
  const bound = (1.0 - t) * bounds[dir * 2] + t * bounds[dir * 2 + 1];

  if (sign > 0) {
    bounds[dir * 2] = bound;
  } else {
    bounds[dir * 2 + 1] = bound;
  }

  return true;
}

/**
 * Clamp the divisions to ensure the total number doesn't exceed targetBins
 * @param {Number} targetBins - Maximum number of bins allowed
 * @param {Array} divs - Divisions array to adjust [divX, divY, divZ]
 */
export function clampDivisions(targetBins, divs) {
  for (let i = 0; i < 3; ++i) {
    divs[i] = divs[i] < 1 ? 1 : divs[i];
  }

  let numBins = divs[0] * divs[1] * divs[2];
  while (numBins > targetBins) {
    for (let i = 0; i < 3; ++i) {
      divs[i] = divs[i] > 1 ? divs[i] - 1 : 1;
    }
    numBins = divs[0] * divs[1] * divs[2];
  }
}

/**
 * Compute the number of divisions given the current bounding box and a
 * target number of buckets/bins. Handles degenerate bounding boxes properly.
 * @param {Bounds} bounds - The bounding box
 * @param {Number} totalBins - Target number of bins
 * @param {Array} divs - Output array to store divisions [divX, divY, divZ]
 * @param {Array} [adjustedBounds] - Output array to store adjusted bounds if needed
 * @returns {Number} The actual total number of bins
 */
export function computeDivisions(bounds, totalBins, divs, adjustedBounds = []) {
  // This will always produce at least one bin
  // eslint-disable-next-line no-param-reassign
  totalBins = totalBins <= 0 ? 1 : totalBins;

  // First determine the maximum length of the side of the bounds. Keep track
  // of zero width sides of the bounding box.
  let numNonZero = 0;
  const nonZero = [0, 0, 0];
  let maxIdx = -1;
  let max = 0.0;
  const lengths = getLengths(bounds);

  // Use a finite tolerance when detecting zero width sides
  const totLen = lengths[0] + lengths[1] + lengths[2];
  const zeroDetectionTolerance = totLen * (0.001 / 3.0);

  for (let i = 0; i < 3; ++i) {
    if (lengths[i] > max) {
      maxIdx = i;
      max = lengths[i];
    }
    if (lengths[i] > zeroDetectionTolerance) {
      nonZero[i] = 1;
      numNonZero++;
    } else {
      nonZero[i] = 0;
    }
  }

  // Get min and max points
  const minPoint = getMinPoint(bounds);
  const maxPoint = getMaxPoint(bounds);

  // If the bounding box is degenerate, then one bin of arbitrary size
  if (numNonZero < 1) {
    divs[0] = 1;
    divs[1] = 1;
    divs[2] = 1;
    adjustedBounds[0] = minPoint[0] - 0.5;
    adjustedBounds[1] = maxPoint[0] + 0.5;
    adjustedBounds[2] = minPoint[1] - 0.5;
    adjustedBounds[3] = maxPoint[1] + 0.5;
    adjustedBounds[4] = minPoint[2] - 0.5;
    adjustedBounds[5] = maxPoint[2] + 0.5;
    return 1;
  }

  // Compute the divisions roughly in proportion to the bounding box edge lengths
  let f = totalBins;
  f /= nonZero[0] ? lengths[0] / totLen : 1.0;
  f /= nonZero[1] ? lengths[1] / totLen : 1.0;
  f /= nonZero[2] ? lengths[2] / totLen : 1.0;
  f **= 1.0 / numNonZero;

  for (let i = 0; i < 3; ++i) {
    divs[i] = nonZero[i] ? Math.floor((f * lengths[i]) / totLen) : 1;
    divs[i] = divs[i] < 1 ? 1 : divs[i];
  }

  // Make sure that we do not exceed the totalBins
  clampDivisions(totalBins, divs);

  // Now compute the final bounds, making sure it is a non-zero volume
  const delta = (0.5 * lengths[maxIdx]) / divs[maxIdx];
  for (let i = 0; i < 3; ++i) {
    if (nonZero[i]) {
      adjustedBounds[2 * i] = minPoint[i];
      adjustedBounds[2 * i + 1] = maxPoint[i];
    } else {
      adjustedBounds[2 * i] = minPoint[i] - delta;
      adjustedBounds[2 * i + 1] = maxPoint[i] + delta;
    }
  }

  return divs[0] * divs[1] * divs[2];
}

/**
 * Calculate the squared distance from point x to the specified bounds.
 * @param {Vector3} x  The point coordinates
 * @param {Bounds} bounds  The bounding box coordinates
 * @returns {Number} The squared distance to the bounds
 */
export function distance2ToBounds(x, bounds) {
  // Are we within the bounds?
  if (
    x[0] >= bounds[0] &&
    x[0] <= bounds[1] &&
    x[1] >= bounds[2] &&
    x[1] <= bounds[3] &&
    x[2] >= bounds[4] &&
    x[2] <= bounds[5]
  ) {
    return 0.0;
  }

  const deltas = [0.0, 0.0, 0.0];

  // dx
  if (x[0] < bounds[0]) {
    deltas[0] = bounds[0] - x[0];
  } else if (x[0] > bounds[1]) {
    deltas[0] = x[0] - bounds[1];
  }

  // dy
  if (x[1] < bounds[2]) {
    deltas[1] = bounds[2] - x[1];
  } else if (x[1] > bounds[3]) {
    deltas[1] = x[1] - bounds[3];
  }

  // dz
  if (x[2] < bounds[4]) {
    deltas[2] = bounds[4] - x[2];
  } else if (x[2] > bounds[5]) {
    deltas[2] = x[2] - bounds[5];
  }

  return vtkMath.dot(deltas, deltas);
}

// ----------------------------------------------------------------------------
// Light Weight class
// ----------------------------------------------------------------------------

class BoundingBox {
  constructor(refBounds) {
    this.bounds = refBounds;
    if (!this.bounds) {
      this.bounds = new Float64Array(INIT_BOUNDS);
    }
  }

  getBounds() {
    return this.bounds;
  }

  equals(otherBounds) {
    return equals(this.bounds, otherBounds);
  }

  isValid() {
    return isValid(this.bounds);
  }

  setBounds(otherBounds) {
    return setBounds(this.bounds, otherBounds);
  }

  reset() {
    return reset(this.bounds);
  }

  addPoint(...xyz) {
    return addPoint(this.bounds, ...xyz);
  }

  addPoints(points) {
    return addPoints(this.bounds, points);
  }

  addBounds(xMin, xMax, yMin, yMax, zMin, zMax) {
    return addBounds(this.bounds, xMin, xMax, yMin, yMax, zMin, zMax);
  }

  setMinPoint(x, y, z) {
    return setMinPoint(this.bounds, x, y, z);
  }

  setMaxPoint(x, y, z) {
    return setMaxPoint(this.bounds, x, y, z);
  }

  inflate(delta) {
    return inflate(this.bounds, delta);
  }

  scale(sx, sy, sz) {
    return scale(this.bounds, sx, sy, sz);
  }

  getCenter() {
    return getCenter(this.bounds);
  }

  getLength(index) {
    return getLength(this.bounds, index);
  }

  getLengths() {
    return getLengths(this.bounds);
  }

  getMaxLength() {
    return getMaxLength(this.bounds);
  }

  getDiagonalLength() {
    return getDiagonalLength(this.bounds);
  }

  getDiagonalLength2() {
    return getDiagonalLength2(this.bounds);
  }

  getMinPoint() {
    return getMinPoint(this.bounds);
  }

  getMaxPoint() {
    return getMaxPoint(this.bounds);
  }

  getXRange() {
    return getXRange(this.bounds);
  }

  getYRange() {
    return getYRange(this.bounds);
  }

  getZRange() {
    return getZRange(this.bounds);
  }

  getCorners(corners) {
    return getCorners(this.bounds, corners);
  }

  computeCornerPoints(point1, point2) {
    return computeCornerPoints(this.bounds, point1, point2);
  }

  computeLocalBounds(u, v, w) {
    return computeLocalBounds(this.bounds, u, v, w);
  }

  transformBounds(transform, out = []) {
    return transformBounds(this.bounds, transform, out);
  }

  computeScale3(scale3) {
    return computeScale3(this.bounds, scale3);
  }

  cutWithPlane(origin, normal) {
    return cutWithPlane(this.bounds, origin, normal);
  }

  intersectBox(origin, dir, coord, tolerance) {
    return intersectBox(this.bounds, origin, dir, coord, tolerance);
  }

  intersectPlane(origin, normal) {
    return intersectPlane(this.bounds, origin, normal);
  }

  intersect(otherBounds) {
    return intersect(this.bounds, otherBounds);
  }

  intersects(otherBounds) {
    return intersects(this.bounds, otherBounds);
  }

  containsPoint(x, y, z) {
    return containsPoint(this.bounds, x, y, z);
  }

  contains(otherBounds) {
    return intersects(this.bounds, otherBounds);
  }

  computeDivisions(totalBins, divs, adjustedBounds = []) {
    return computeDivisions(this.bounds, totalBins, divs, adjustedBounds);
  }

  distance2ToBounds(x) {
    return distance2ToBounds(x, this.bounds);
  }
}

function newInstance(initialValues) {
  const bounds = initialValues && initialValues.bounds;
  return new BoundingBox(bounds);
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {
  equals,
  isValid,
  setBounds,
  reset,
  addPoint,
  addPoints,
  addBounds,
  setMinPoint,
  setMaxPoint,
  inflate,
  scale,
  scaleAboutCenter,
  getCenter,
  getLength,
  getLengths,
  getMaxLength,
  getDiagonalLength,
  getMinPoint,
  getMaxPoint,
  getXRange,
  getYRange,
  getZRange,
  getCorners,
  computeCornerPoints,
  computeLocalBounds,
  transformBounds,
  computeScale3,
  cutWithPlane,
  intersectBox,
  intersectPlane,
  intersect,
  intersects,
  containsPoint,
  contains,
  computeDivisions,
  clampDivisions,
  distance2ToBounds,
  INIT_BOUNDS,
};

export default { newInstance, ...STATIC };
