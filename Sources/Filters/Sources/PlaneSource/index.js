import { vec3, mat4 } from 'gl-matrix';
import macro from 'vtk.js/Sources/macros';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';

import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

const { vtkWarningMacro } = macro;

const EPSILON = 1e-6;

// ----------------------------------------------------------------------------
// vtkPlaneSource methods
// ----------------------------------------------------------------------------

function vtkPlaneSource(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPlaneSource');

  publicAPI.requestData = (inData, outData) => {
    if (model.deleted) {
      return;
    }

    const dataset = outData[0];

    // Check input
    const pointDataType = dataset
      ? dataset.getPoints().getDataType()
      : model.pointType;
    const pd = vtkPolyData.newInstance();
    const v10 = [];
    const v20 = [];
    vtkMath.subtract(model.point1, model.origin, v10);
    vtkMath.subtract(model.point2, model.origin, v20);

    if (!publicAPI.updatePlane(v10, v20)) {
      vtkWarningMacro('Bad plane definition');
      return;
    }

    // hand create a plane with special scalars
    const xres = model.xResolution;
    const yres = model.yResolution;
    const numPts = (xres + 1) * (yres + 1);
    const numPolys = xres * yres;

    // Points
    const points = macro.newTypedArray(pointDataType, numPts * 3);
    pd.getPoints().setData(points, 3);

    // Cells
    const polys = new Uint32Array(5 * numPolys);
    pd.getPolys().setData(polys, 1);

    // Normals
    const normalsData = new Float32Array(numPts * 3);
    const normals = vtkDataArray.newInstance({
      numberOfComponents: 3,
      values: normalsData,
      name: 'Normals',
    });
    pd.getPointData().setNormals(normals);

    // Texture coords
    const tcData = new Float32Array(numPts * 2);
    const tcoords = vtkDataArray.newInstance({
      numberOfComponents: 2,
      values: tcData,
      name: 'TextureCoordinates',
    });
    pd.getPointData().setTCoords(tcoords);

    const tc = new Float32Array(2);
    let idx = 0;
    for (let j = 0; j < yres + 1; j++) {
      tc[1] = j / yres;
      for (let i = 0; i < xres + 1; i++) {
        tc[0] = i / xres;

        points[idx * 3] = model.origin[0] + tc[0] * v10[0] + tc[1] * v20[0];
        points[idx * 3 + 1] = model.origin[1] + tc[0] * v10[1] + tc[1] * v20[1];
        points[idx * 3 + 2] = model.origin[2] + tc[0] * v10[2] + tc[1] * v20[2];

        tcData[idx * 2] = tc[0];
        tcData[idx * 2 + 1] = tc[1];

        normalsData[idx * 3] = model.normal[0];
        normalsData[idx * 3 + 1] = model.normal[1];
        normalsData[idx * 3 + 2] = model.normal[2];

        idx++;
      }
    }

    // Generate polygon connectivity
    //
    idx = 0;
    for (let j = 0; j < yres; j++) {
      for (let i = 0; i < xres; i++) {
        polys[idx * 5 + 0] = 4;
        polys[idx * 5 + 1] = i + j * (xres + 1);
        polys[idx * 5 + 2] = polys[idx * 5 + 1] + 1;
        polys[idx * 5 + 3] = polys[idx * 5 + 1] + xres + 2;
        polys[idx * 5 + 4] = polys[idx * 5 + 1] + xres + 1;

        idx++;
      }
    }

    // Update output
    outData[0] = pd;
  };

  publicAPI.setNormal = (...normal) => {
    let n = [];

    if (normal.length === 1 || Array.isArray(normal[0])) {
      n = [...normal[0]];
    } else if (normal.length === 3) {
      n = [normal[0], normal[1], normal[2]];
    }

    if (vtkMath.normalize(n) !== 0) {
      const dp = vtkMath.dot(model.normal, n);

      let theta = 0;
      const rotationVector = [];

      if (dp < 1.0) {
        if (dp <= -1.0) {
          theta = vtkMath.radiansFromDegrees(180.0);
          vtkMath.subtract(model.point1, model.origin, rotationVector);
        } else {
          vtkMath.cross(model.normal, n, rotationVector);
          theta = Math.acos(dp);
        }
        publicAPI.rotate(theta, rotationVector);
      }
    }
  };

  /**
   * Rotate plane around a given axis
   * @param {float} theta Angle (radian) to rotate about
   * @param {vec3} rotationAxis Axis to rotate around
   */
  publicAPI.rotate = (angle, rotationAxis) => {
    if (Math.abs(angle) < EPSILON) {
      return;
    }
    // Create rotation matrix
    const transform = mat4.identity(new Float64Array(16));
    const negCenter = [];
    vec3.negate(negCenter, model.center);

    mat4.translate(transform, transform, model.center);
    mat4.rotate(transform, transform, angle, rotationAxis);
    mat4.translate(transform, transform, negCenter);

    vec3.transformMat4(model.origin, model.origin, transform);
    vec3.transformMat4(model.point1, model.point1, transform);
    vec3.transformMat4(model.point2, model.point2, transform);

    vtkMatrixBuilder
      .buildFromRadian()
      .rotate(angle, rotationAxis)
      .apply(model.normal);

    publicAPI.modified();
  };

  publicAPI.setCenter = (...center) => {
    let c = [];

    if (center.length === 1 || Array.isArray(center[0])) {
      c = [...center[0]];
    } else if (center.length === 3) {
      c = [center[0], center[1], center[2]];
    }

    if (!vec3.exactEquals(c, model.center)) {
      const v1 = [];
      vtkMath.subtract(model.point1, model.origin, v1);

      const v2 = [];
      vtkMath.subtract(model.point2, model.origin, v2);

      for (let i = 0; i < 3; i++) {
        model.center[i] = c[i];
        model.origin[i] = model.center[i] - 0.5 * (v1[i] + v2[i]);
        model.point1[i] = model.origin[i] + v1[i];
        model.point2[i] = model.origin[i] + v2[i];
      }
      publicAPI.modified();
    }
  };

  publicAPI.setPoint1 = (...point) => {
    let point1 = [];

    if (point.length === 1 || Array.isArray(point[0])) {
      point1 = [...point[0]];
    } else if (point.length === 3) {
      point1 = [point[0], point[1], point[2]];
    }

    if (!vec3.exactEquals(point1, model.point1)) {
      const v1 = [];
      const v2 = [];

      model.point1 = [...point1];
      vtkMath.subtract(model.point1, model.origin, v1);
      vtkMath.subtract(model.point2, model.origin, v2);

      // set plane normal
      publicAPI.updatePlane(v1, v2);
      publicAPI.modified();
    }
  };

  publicAPI.setPoint2 = (...point) => {
    let point2 = [];

    if (point.length === 1 || Array.isArray(point[0])) {
      point2 = [...point[0]];
    } else if (point.length === 3) {
      point2 = [point[0], point[1], point[2]];
    }

    if (!vec3.exactEquals(point2, model.point2)) {
      const v1 = [];
      const v2 = [];

      model.point2 = [...point2];
      vtkMath.subtract(model.point1, model.origin, v1);
      vtkMath.subtract(model.point2, model.origin, v2);

      // set plane normal
      publicAPI.updatePlane(v1, v2);
      publicAPI.modified();
    }
  };

  publicAPI.updatePlane = (v1, v2) => {
    // set plane center
    for (let i = 0; i < 3; i++) {
      model.center[i] = model.origin[i] + 0.5 * (v1[i] + v2[i]);
    }

    // set plane normal
    vtkMath.cross(v1, v2, model.normal);

    return vtkMath.normalize(model.normal) !== 0.0;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  xResolution: 10,
  yResolution: 10,
  origin: [0, 0, 0],
  point1: [1, 0, 0],
  point2: [0, 1, 0],
  pointType: 'Float64Array',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  model.normal = [0, 0, 1];
  model.center = [0, 0, 0];

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['xResolution', 'yResolution']);
  macro.setGetArray(publicAPI, model, ['origin'], 3);
  macro.getArray(publicAPI, model, ['point1', 'point2', 'normal', 'center'], 3);

  macro.algo(publicAPI, model, 0, 1);
  vtkPlaneSource(publicAPI, model);

  publicAPI.setPoint1(model.point1);
  publicAPI.setPoint2(model.point2);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPlaneSource');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
