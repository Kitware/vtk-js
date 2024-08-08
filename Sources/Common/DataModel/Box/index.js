import macro from 'vtk.js/Sources/macros';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';
import vtkImplicitFunction from 'vtk.js/Sources/Common/DataModel/ImplicitFunction';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

//------------------------------------------------------------------------------
// Bounding box intersection code from David Gobbi.  Go through the
// bounding planes one at a time and compute the parametric coordinate
// of each intersection and return the parametric values and the calculated points
export function intersectWithLine(bounds, p1, p2) {
  let plane1 = -1;
  let plane2 = -1;
  let t1 = 0.0;
  let t2 = 1.0;

  for (let j = 0; j < 3; j++) {
    for (let k = 0; k < 2; k++) {
      // Compute distances of p1 and p2 from the plane along the plane normal
      const i = 2 * j + k;
      const d1 = (bounds[i] - p1[j]) * (1 - 2 * k);
      const d2 = (bounds[i] - p2[j]) * (1 - 2 * k);

      // If both distances are positive, both points are outside
      if (d1 > 0 && d2 > 0) {
        return;
      }
      // If one of the distances is positive, the line crosses the plane
      if (d1 > 0 || d2 > 0) {
        // Compute fractional distance "t" of the crossing between p1 & p2
        let t = 0.0;
        if (d1 !== 0) {
          t = d1 / (d1 - d2);
        }

        // If point p1 was clipped, adjust t1
        if (d1 > 0) {
          if (t >= t1) {
            t1 = t;
            plane1 = i;
          }
        }
        // else point p2 was clipped, so adjust t2
        else if (t <= t2) {
          t2 = t;
          plane2 = i;
        }
        // If this happens, there's no line left
        if (t1 > t2) {
          // Allow for planes that are coincident or slightly inverted
          if (plane1 < 0 || plane2 < 0) {
            return;
          }
        }
      }
    }
  }

  function getValues(plane, t) {
    const x = [0, 0, 0];
    for (let count = 0; count < 2; count++) {
      for (let i = 0; i < 3; i++) {
        if (plane === 2 * i || plane === 2 * i + 1) {
          x[i] = bounds[plane];
        } else {
          x[i] = p1[i] * (1.0 - t) + p2[i] * t;
          if (x[i] < bounds[2 * i]) {
            x[i] = bounds[2 * i];
          }
          if (x[i] > bounds[2 * i + 1]) {
            x[i] = bounds[2 * i + 1];
          }
        }
      }
    }
    return x;
  }

  const x1 = getValues(plane1, t1);
  const x2 = getValues(plane2, t2);

  const outObject = { t1, t2, x1, x2 };

  // eslint-disable-next-line consistent-return
  return outObject;
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {};

// ----------------------------------------------------------------------------
// vtkBox methods
// ----------------------------------------------------------------------------
function vtkBox(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkBox');

  // TODO: replace with macro.setArray ?
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
      console.log('vtkBox.setBounds', boundsArray, bounds);
      return;
    }

    vtkBoundingBox.setBounds(model.bbox, boundsArray);
  };

  publicAPI.getBounds = () => model.bbox;

  publicAPI.evaluateFunction = (x, y, z) => {
    const point = Array.isArray(x) ? x : [x, y, z];

    let diff;
    let dist;
    let t;
    let minDistance = -Number.MAX_VALUE;
    let distance = 0;
    const minPoint = vtkBoundingBox.getMinPoint(model.bbox);
    const maxPoint = vtkBoundingBox.getMaxPoint(model.bbox);
    let inside = 1;
    for (let i = 0; i < 3; i++) {
      diff = vtkBoundingBox.getLength(model.bbox, i);
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
            // remember, it's negative
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

    vtkBoundingBox.addBounds(model.bbox, ...boundsArray);
    publicAPI.modified();
  };

  publicAPI.addBox = (other) => publicAPI.addBounds(other.getBounds());
  publicAPI.intersectWithLine = (p1, p2) =>
    intersectWithLine(model.bbox, p1, p2);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  bbox: [...vtkBoundingBox.INIT_BOUNDS],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  vtkImplicitFunction.extend(publicAPI, model, initialValues);

  vtkBox(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkBox');

// ----------------------------------------------------------------------------

export default { newInstance, extend, intersectWithLine, ...STATIC };
