import macro from 'vtk.js/Sources/macro';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// The method returns a non-zero value if the bounding box is hit.
// Origin[3] starts the ray, dir[3] is the vector components of the ray in the x-y-z
// directions, coord[3] is the location of hit, and t is the parametric
// coordinate along line. (Notes: the intersection ray dir[3] is NOT
// normalized.  Valid intersections will only occur between 0<=t<=1.)
function intersectBox(bounds, origin, dir, coord, tolerance) {
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

  // Check for valie intersection along line
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
function intersectPlane(bounds, origin, normal) {
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

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {
  intersectBox,
  intersectPlane,
};

// ----------------------------------------------------------------------------
// vtkBox methods
// ----------------------------------------------------------------------------

function vtkBox(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkBox');

  publicAPI.setBounds = (...bounds) => {
    let boundsArray = [];

    if (Array.isArray(bounds[0])) {
      boundsArray = bounds[0];
    } else {
      for (let i = 0; i < bounds.length; i++) {
        boundsArray.push(bounds[i]);
      }
    }

    if (boundsArray.length !== 6) {
      return;
    }

    model.bbox.setBounds(boundsArray);
  };

  publicAPI.getBounds = () => model.bbox.getBounds();

  publicAPI.evaluateFunction = (x, y, z) => {
    const point = Array.isArray(x) ? x : [x, y, z];

    let diff;
    let dist;
    let t;
    let minDistance = -Number.MAX_VALUE;
    let distance = 0;
    const minPoint = model.bbox.getMinPoint();
    const maxPoint = model.bbox.getMaxPoint();
    let inside = 1;
    for (let i = 0; i < 3; i++) {
      diff = model.bbox.getLength(i);
      if (diff !== 0.0) {
        t = (point[i] - minPoint[i]) / diff;
        if (t < 0.0) {
          inside = 0;
          dist = minPoint[i] - point[i];
        } else if (t > 1.0) {
          inside = 0;
          dist = point[i] - maxPoint[i];
        } else {
          // want negative distance, we are inside
          if (t <= 0.5) {
            dist = minPoint[i] - point[i];
          } else {
            dist = point[i] - maxPoint[i];
          }
          if (dist > minDistance) {
            // remember, it's engative
            minDistance = dist;
          }
        } // end if inside
      } else {
        dist = Math.abs(point[i] - minPoint[i]);
        if (dist > 0.0) {
          inside = 0;
        }
      }
      if (dist > 0.0) {
        distance += dist * dist;
      }
    } // end for i
    distance = Math.sqrt(distance);
    if (inside) {
      return minDistance;
    }
    return distance;
  };

  publicAPI.addBounds = (...bounds) => {
    let boundsArray = [];

    if (Array.isArray(bounds[0])) {
      boundsArray = bounds[0];
    } else {
      for (let i = 0; i < bounds.length; i++) {
        boundsArray.push(bounds[i]);
      }
    }

    if (boundsArray.length !== 6) {
      return;
    }

    model.bbox.addBounds(...boundsArray);
    model.bbox.modified();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);

  if (!model.bbox) {
    model.bbox = vtkBoundingBox.newInstance();
  }

  vtkBox(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkBox');

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...STATIC };
