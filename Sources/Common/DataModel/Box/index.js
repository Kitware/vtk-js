import macro from 'vtk.js/Sources/macros';
import vtkBoundingBox from 'vtk.js/Sources/Common/DataModel/BoundingBox';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

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

    vtkBoundingBox.addBounds(model.bbox, ...boundsArray);
    publicAPI.modified();
  };

  publicAPI.addBox = (other) => publicAPI.addBounds(other.getBounds());
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
  macro.obj(publicAPI, model);

  vtkBox(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkBox');

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...STATIC };
