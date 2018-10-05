import macro from 'vtk.js/Sources/macro';
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

function isValid(bounds) {
  return (
    bounds[0] <= bounds[1] && bounds[2] <= bounds[3] && bounds[4] <= bounds[5]
  );
}

function getCenter(bounds) {
  return [
    0.5 * (bounds[0] + bounds[1]),
    0.5 * (bounds[2] + bounds[3]),
    0.5 * (bounds[4] + bounds[5]),
  ];
}

function getLength(bounds, index) {
  return bounds[index * 2 + 1] - bounds[index * 2];
}

function getLengths(bounds) {
  return [getLength(bounds, 0), getLength(bounds, 1), getLength(bounds, 2)];
}

function getXRange(bounds) {
  return bounds.slice(0, 2);
}

function getYRange(bounds) {
  return bounds.slice(2, 4);
}

function getZRange(bounds) {
  return bounds.slice(4, 6);
}

function getMaxLength(bounds) {
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

function getDiagonalLength(bounds) {
  if (isValid(bounds)) {
    const l = getLengths(bounds);
    return Math.sqrt(l[0] * l[0] + l[1] * l[1] + l[2] * l[2]);
  }
  return null;
}

function oppositeSign(a, b) {
  return (a <= 0 && b >= 0) || (a >= 0 && b <= 0);
}

function getCorners(bounds, corners) {
  let count = 0;
  for (let ix = 0; ix < 2; ix++) {
    for (let iy = 2; iy < 4; iy++) {
      for (let iz = 4; iz < 6; iz++) {
        corners[count] = [bounds[ix], bounds[iy], bounds[iz]];
        count++;
      }
    }
  }
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {
  isValid,
  getCenter,
  getLength,
  getLengths,
  getMaxLength,
  getDiagonalLength,
  getXRange,
  getYRange,
  getZRange,
  getCorners,
  INIT_BOUNDS,
};

// ----------------------------------------------------------------------------
// vtkBoundingBox methods
// ----------------------------------------------------------------------------

function vtkBoundingBox(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkBoundingBox');

  publicAPI.clone = () => {
    const bounds = [].concat(model.bounds);
    /* eslint-disable no-use-before-define */
    return newInstance({ bounds });
    /* eslint-enable no-use-before-define */
  };

  publicAPI.equals = (other) => {
    const a = model.bounds;
    const b = other.getBounds();
    return (
      a[0] === b[0] &&
      a[1] === b[1] &&
      a[2] === b[2] &&
      a[3] === b[3] &&
      a[4] === b[4] &&
      a[5] === b[5]
    );
  };

  publicAPI.setMinPoint = (x, y, z) => {
    const [xMin, xMax, yMin, yMax, zMin, zMax] = model.bounds;
    model.bounds = [
      x,
      x > xMax ? x : xMax,
      y,
      y > yMax ? y : yMax,
      z,
      z > zMax ? z : zMax,
    ];

    return xMin !== x || yMin !== y || zMin !== z;
  };

  publicAPI.setMaxPoint = (x, y, z) => {
    const [xMin, xMax, yMin, yMax, zMin, zMax] = model.bounds;
    model.bounds = [
      x < xMin ? x : xMin,
      x,
      y < yMin ? y : yMin,
      y,
      z < zMin ? z : zMin,
      z,
    ];

    return xMax !== x || yMax !== y || zMax !== z;
  };

  publicAPI.addPoint = (...xyz) => {
    model.bounds = model.bounds.map((value, index) => {
      if (index % 2 === 0) {
        const idx = index / 2;
        return value < xyz[idx] ? value : xyz[idx];
      }
      const idx = (index - 1) / 2;
      return value > xyz[idx] ? value : xyz[idx];
    });
  };

  publicAPI.addBounds = (xMin, xMax, yMin, yMax, zMin, zMax) => {
    const [_xMin, _xMax, _yMin, _yMax, _zMin, _zMax] = model.bounds;
    model.bounds = [
      Math.min(xMin, _xMin),
      Math.max(xMax, _xMax),
      Math.min(yMin, _yMin),
      Math.max(yMax, _yMax),
      Math.min(zMin, _zMin),
      Math.max(zMax, _zMax),
    ];
  };

  publicAPI.addBox = (other) => {
    publicAPI.addBounds(...other.getBounds());
  };

  publicAPI.isValid = () => isValid(model.bounds);

  publicAPI.intersect = (bbox) => {
    if (!(publicAPI.isValid() && bbox.isValid())) {
      return false;
    }

    const newBounds = [0, 0, 0, 0, 0, 0];
    const bBounds = bbox.getBounds();
    let intersects;
    for (let i = 0; i < 3; i++) {
      intersects = false;
      if (
        bBounds[i * 2] >= model.bounds[i * 2] &&
        bBounds[i * 2] <= model.bounds[i * 2 + 1]
      ) {
        intersects = true;
        newBounds[i * 2] = bBounds[i * 2];
      } else if (
        model.bounds[i * 2] >= bBounds[i * 2] &&
        model.bounds[i * 2] <= bBounds[i * 2 + 1]
      ) {
        intersects = true;
        newBounds[i * 2] = model.bounds[i * 2];
      }

      if (
        bBounds[i * 2 + 1] >= model.bounds[i * 2] &&
        bBounds[i * 2 + 1] <= model.bounds[i * 2 + 1]
      ) {
        intersects = true;
        newBounds[i * 2 + 1] = bbox.MaxPnt[i];
      } else if (
        model.bounds[i * 2 + 1] >= bbox.MinPnt[i * 2] &&
        model.bounds[i * 2 + 1] <= bbox.MaxPnt[i * 2 + 1]
      ) {
        intersects = true;
        newBounds[i * 2 + 1] = model.bounds[i * 2 + 1];
      }

      if (!intersects) {
        return false;
      }
    }

    // OK they did intersect - set the box to be the result
    model.bounds = newBounds;
    return true;
  };

  publicAPI.intersects = (bbox) => {
    if (!(publicAPI.isValid() && bbox.isValid())) {
      return false;
    }
    const bBounds = bbox.getBounds();
    /* eslint-disable no-continue */
    for (let i = 0; i < 3; i++) {
      if (
        bBounds[i * 2] >= model.bounds[i * 2] &&
        bBounds[i * 2] <= model.bounds[i * 2 + 1]
      ) {
        continue;
      } else if (
        model.bounds[i * 2] >= bBounds[i * 2] &&
        model.bounds[i * 2] <= bBounds[i * 2 + 1]
      ) {
        continue;
      }

      if (
        bBounds[i * 2 + 1] >= model.bounds[i * 2] &&
        bBounds[i * 2 + 1] <= model.bounds[i * 2 + 1]
      ) {
        continue;
      } else if (
        model.bounds[i * 2 + 1] >= bbox.MinPnt[i * 2] &&
        model.bounds[i * 2 + 1] <= bbox.MaxPnt[i * 2 + 1]
      ) {
        continue;
      }
      return false;
    }
    /* eslint-enable no-continue */

    return true;
  };

  publicAPI.intersectPlane = (origin, normal) => {
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
          const x = [model.bounds[ix], model.bounds[iy], model.bounds[iz]];
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
    const size = Math.abs(
      (model.bounds[dir * 2 + 1] - model.bounds[dir * 2]) * normal[dir]
    );
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
    const bound =
      (1.0 - t) * model.bounds[dir * 2] + t * model.bounds[dir * 2 + 1];

    if (sign > 0) {
      model.bounds[dir * 2] = bound;
    } else {
      model.bounds[dir * 2 + 1] = bound;
    }

    return true;
  };

  publicAPI.containsPoint = (x, y, z) => {
    if (x < model.bounds[0] || x > model.bounds[1]) {
      return false;
    }

    if (y < model.bounds[2] || y > model.bounds[3]) {
      return false;
    }

    if (z < model.bounds[4] || z > model.bounds[5]) {
      return false;
    }

    return true;
  };

  publicAPI.getMinPoint = () => [
    model.bounds[0],
    model.bounds[2],
    model.bounds[4],
  ];
  publicAPI.getMaxPoint = () => [
    model.bounds[1],
    model.bounds[3],
    model.bounds[5],
  ];
  publicAPI.getBound = (index) => model.bound[index];

  publicAPI.contains = (bbox) => {
    // if either box is not valid or they don't intersect
    if (!publicAPI.intersects(bbox)) {
      return false;
    }

    if (!publicAPI.containsPoint(...bbox.getMinPoint())) {
      return false;
    }

    if (!publicAPI.containsPoint(...bbox.getMaxPoint())) {
      return 0;
    }

    return true;
  };

  publicAPI.getCenter = () => getCenter(model.bounds);
  publicAPI.getLength = (index) => getLength(model.bounds, index);
  publicAPI.getLengths = () => getLengths(model.bounds);
  publicAPI.getMaxLength = () => getMaxLength(model.bounds);
  publicAPI.getDiagonalLength = () => getDiagonalLength(model.bounds);

  publicAPI.reset = () => publicAPI.setBounds([].concat(INIT_BOUNDS));

  publicAPI.inflate = (delta) => {
    model.bounds = model.bounds.map((value, index) => {
      if (index % 2 === 0) {
        return value - delta;
      }
      return value + delta;
    });
  };

  publicAPI.getCorners = () => {
    getCorners(model.bounds, model.corners);
    return model.corners;
  };

  publicAPI.scale = (sx, sy, sz) => {
    if (publicAPI.isValid()) {
      const newBounds = [].concat(model.bounds);
      if (sx >= 0.0) {
        newBounds[0] *= sx;
        newBounds[1] *= sx;
      } else {
        newBounds[0] = sx * model.bounds[1];
        newBounds[1] = sx * model.bounds[0];
      }

      if (sy >= 0.0) {
        newBounds[2] *= sy;
        newBounds[3] *= sy;
      } else {
        newBounds[2] = sy * model.bounds[3];
        newBounds[3] = sy * model.bounds[2];
      }

      if (sz >= 0.0) {
        newBounds[4] *= sz;
        newBounds[5] *= sz;
      } else {
        newBounds[4] = sz * model.bounds[5];
        newBounds[5] = sz * model.bounds[4];
      }

      model.bounds = newBounds;
      return true;
    }
    return false;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  type: 'vtkBoundingBox',
  bounds: [].concat(INIT_BOUNDS),
  corners: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['bounds']);
  vtkBoundingBox(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkBoundingBox');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, STATIC);
