import macro from 'vtk.js/Sources/macros';
import vtkImplicitFunction from 'vtk.js/Sources/Common/DataModel/ImplicitFunction';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

function evaluate(radius, center, xyz) {
  if (!Array.isArray(radius)) {
    const retVal =
      (xyz[0] - center[0]) * (xyz[0] - center[0]) +
      (xyz[1] - center[1]) * (xyz[1] - center[1]) +
      (xyz[2] - center[2]) * (xyz[2] - center[2]) -
      radius * radius;

    return retVal;
  }
  const r = [
    (xyz[0] - center[0]) / radius[0],
    (xyz[1] - center[1]) / radius[1],
    (xyz[2] - center[2]) / radius[2],
  ];

  return r[0] * r[0] + r[1] * r[1] + r[2] * r[2] - 1;
}

function setPointFromArray(dst, pts, pointId) {
  const offset = 3 * pointId;
  dst[0] = pts[offset];
  dst[1] = pts[offset + 1];
  dst[2] = pts[offset + 2];
}

function copyPoint(dst, src) {
  dst[0] = src[0];
  dst[1] = src[1];
  dst[2] = src[2];
}

function copySphere(dst, src) {
  dst[0] = src[0];
  dst[1] = src[1];
  dst[2] = src[2];
  dst[3] = src[3];
}

// Inspired by Graphics Gems Vol. I ("An Efficient Bounding Sphere" by Jack Ritter).
function computeBoundingSphere(pts, numPts, hints) {
  const actualNumPts = numPts ?? Math.floor(pts.length / 3);
  const sphere = [0, 0, 0, 0];
  if (actualNumPts < 1) {
    return sphere;
  }

  const d1 = [0, 0, 0];
  const d2 = [0, 0, 0];

  if (hints && hints.length >= 2) {
    setPointFromArray(d1, pts, hints[0]);
    setPointFromArray(d2, pts, hints[1]);
  } else {
    const xMin = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE];
    const yMin = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE];
    const zMin = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE];
    const xMax = [-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE];
    const yMax = [-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE];
    const zMax = [-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE];
    const p = [0, 0, 0];

    for (let i = 0; i < actualNumPts; i++) {
      setPointFromArray(p, pts, i);
      if (p[0] < xMin[0]) copyPoint(xMin, p);
      if (p[0] > xMax[0]) copyPoint(xMax, p);
      if (p[1] < yMin[1]) copyPoint(yMin, p);
      if (p[1] > yMax[1]) copyPoint(yMax, p);
      if (p[2] < zMin[2]) copyPoint(zMin, p);
      if (p[2] > zMax[2]) copyPoint(zMax, p);
    }

    const xSpan = vtkMath.distance2BetweenPoints(xMax, xMin);
    const ySpan = vtkMath.distance2BetweenPoints(yMax, yMin);
    const zSpan = vtkMath.distance2BetweenPoints(zMax, zMin);

    if (xSpan > ySpan) {
      if (xSpan > zSpan) {
        copyPoint(d1, xMin);
        copyPoint(d2, xMax);
      } else {
        copyPoint(d1, zMin);
        copyPoint(d2, zMax);
      }
    } else if (ySpan > zSpan) {
      copyPoint(d1, yMin);
      copyPoint(d2, yMax);
    } else {
      copyPoint(d1, zMin);
      copyPoint(d2, zMax);
    }
  }

  sphere[0] = (d1[0] + d2[0]) / 2;
  sphere[1] = (d1[1] + d2[1]) / 2;
  sphere[2] = (d1[2] + d2[2]) / 2;
  let r2 = vtkMath.distance2BetweenPoints(d1, d2) / 4;
  sphere[3] = Math.sqrt(r2);

  const p = [0, 0, 0];
  for (let i = 0; i < actualNumPts; i++) {
    setPointFromArray(p, pts, i);
    const dist2 = vtkMath.distance2BetweenPoints(p, sphere);
    if (dist2 > r2) {
      const dist = Math.sqrt(dist2);
      sphere[3] = (sphere[3] + dist) / 2;
      r2 = sphere[3] * sphere[3];
      const delta = dist - sphere[3];
      sphere[0] = (sphere[3] * sphere[0] + delta * p[0]) / dist;
      sphere[1] = (sphere[3] * sphere[1] + delta * p[1]) / dist;
      sphere[2] = (sphere[3] * sphere[2] + delta * p[2]) / dist;
    }
  }

  return sphere;
}

function computeBoundingSphereFromSpheres(spheres, numSpheres, hints) {
  const actualNumSpheres = numSpheres ?? spheres.length;
  const sphere = [0, 0, 0, 0];
  if (actualNumSpheres < 1) {
    return sphere;
  }
  if (actualNumSpheres === 1) {
    copySphere(sphere, spheres[0]);
    return sphere;
  }

  const s1 = [0, 0, 0, 0];
  const s2 = [0, 0, 0, 0];

  if (hints && hints.length >= 2) {
    copySphere(s1, spheres[hints[0]]);
    copySphere(s2, spheres[hints[1]]);
  } else {
    const xMin = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, 0];
    const yMin = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, 0];
    const zMin = [Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, 0];
    const xMax = [-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE, 0];
    const yMax = [-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE, 0];
    const zMax = [-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE, 0];

    for (let i = 0; i < actualNumSpheres; i++) {
      const s = spheres[i];
      if (s[0] - s[3] < xMin[0] - xMin[3]) copySphere(xMin, s);
      if (s[0] + s[3] > xMax[0] + xMax[3]) copySphere(xMax, s);
      if (s[1] - s[3] < yMin[1] - yMin[3]) copySphere(yMin, s);
      if (s[1] + s[3] > yMax[1] + yMax[3]) copySphere(yMax, s);
      if (s[2] - s[3] < zMin[2] - zMin[3]) copySphere(zMin, s);
      if (s[2] + s[3] > zMax[2] + zMax[3]) copySphere(zMax, s);
    }

    const xSpan =
      (xMax[0] + xMax[3] - (xMin[0] - xMin[3])) *
        (xMax[0] + xMax[3] - (xMin[0] - xMin[3])) +
      (xMax[1] + xMax[3] - (xMin[1] - xMin[3])) *
        (xMax[1] + xMax[3] - (xMin[1] - xMin[3])) +
      (xMax[2] + xMax[3] - (xMin[2] - xMin[3])) *
        (xMax[2] + xMax[3] - (xMin[2] - xMin[3]));
    const ySpan =
      (yMax[0] + yMax[3] - (yMin[0] - yMin[3])) *
        (yMax[0] + yMax[3] - (yMin[0] - yMin[3])) +
      (yMax[1] + yMax[3] - (yMin[1] - yMin[3])) *
        (yMax[1] + yMax[3] - (yMin[1] - yMin[3])) +
      (yMax[2] + yMax[3] - (yMin[2] - yMin[3])) *
        (yMax[2] + yMax[3] - (yMin[2] - yMin[3]));
    const zSpan =
      (zMax[0] + zMax[3] - (zMin[0] - zMin[3])) *
        (zMax[0] + zMax[3] - (zMin[0] - zMin[3])) +
      (zMax[1] + zMax[3] - (zMin[1] - zMin[3])) *
        (zMax[1] + zMax[3] - (zMin[1] - zMin[3])) +
      (zMax[2] + zMax[3] - (zMin[2] - zMin[3])) *
        (zMax[2] + zMax[3] - (zMin[2] - zMin[3]));

    if (xSpan > ySpan) {
      if (xSpan > zSpan) {
        copySphere(s1, xMin);
        copySphere(s2, xMax);
      } else {
        copySphere(s1, zMin);
        copySphere(s2, zMax);
      }
    } else if (ySpan > zSpan) {
      copySphere(s1, yMin);
      copySphere(s2, yMax);
    } else {
      copySphere(s1, zMin);
      copySphere(s2, zMax);
    }
  }

  let r2 = vtkMath.distance2BetweenPoints(s1, s2) / 4;
  sphere[3] = r2 > 0 ? Math.sqrt(r2) : s1[3];
  const t1 = -s1[3] / (2 * sphere[3]);
  const t2 = 1 + s2[3] / (2 * sphere[3]);
  const v = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    v[i] = s2[i] - s1[i];
    const tmp = s1[i] + t1 * v[i];
    s2[i] = s1[i] + t2 * v[i];
    s1[i] = tmp;
    sphere[i] = (s1[i] + s2[i]) / 2;
  }
  r2 = vtkMath.distance2BetweenPoints(s1, s2) / 4;
  if (r2 > 0) {
    sphere[3] = Math.sqrt(r2);
  } else {
    sphere[3] = s1[3];
    r2 = sphere[3] * sphere[3];
  }

  for (let i = 0; i < actualNumSpheres; i++) {
    const s = spheres[i];
    const sR2 = s[3] * s[3];
    let dist2 = vtkMath.distance2BetweenPoints(s, sphere);
    if (dist2 <= 0) {
      dist2 = s[3];
    }
    const fac = sR2 > dist2 ? 2 * sR2 : 2 * dist2;
    if (dist2 + fac + sR2 > r2) {
      const dist = Math.sqrt(dist2);
      if ((dist + s[3]) * (dist + s[3]) > r2) {
        for (let j = 0; j < 3; j++) {
          v[j] = s[j] - sphere[j];
          s1[j] = sphere[j] - (sphere[3] / dist) * v[j];
          s2[j] = sphere[j] + (1 + s[3] / dist) * v[j];
          sphere[j] = (s1[j] + s2[j]) / 2;
        }
        r2 = vtkMath.distance2BetweenPoints(s1, s2) / 4;
        if (r2 > 0) {
          sphere[3] = Math.sqrt(r2);
        } else {
          sphere[3] = Math.max(s1[3], sphere[3]);
          r2 = sphere[3] * sphere[3];
        }
      }
    }
  }

  return sphere;
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {
  evaluate,
  computeBoundingSphere,
  computeBoundingSphereFromSpheres,
};

// ----------------------------------------------------------------------------
// vtkSphere methods
// ----------------------------------------------------------------------------

function vtkSphere(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSphere');

  publicAPI.evaluateFunction = (xyz) =>
    evaluate(model.radius, model.center, xyz);

  publicAPI.evaluateGradient = (xyz) => {
    const retVal = [
      2.0 - (xyz[0] - model.center[0]),
      2.0 - (xyz[1] - model.center[1]),
      2.0 - (xyz[2] - model.center[2]),
    ];
    return retVal;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  radius: 0.5,
  center: [0.0, 0.0, 0.0],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  vtkImplicitFunction.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, ['radius']);
  macro.setGetArray(publicAPI, model, ['center'], 3);

  vtkSphere(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkSphere');

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...STATIC };
