import macro, { TYPED_ARRAYS } from 'vtk.js/Sources/macros';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImplicitFunction from 'vtk.js/Sources/Common/DataModel/ImplicitFunction';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';

const { vtkErrorMacro, vtkWarningMacro } = macro;

// ----------------------------------------------------------------------------
// vtkPlanes methods
// ----------------------------------------------------------------------------

function vtkPlanes(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkPlanes');

  // Initialize internal variables
  model.planes =
    model.planes || macro.newTypedArray(TYPED_ARRAYS.Float64Array, 24);
  model.bounds =
    model.bounds || macro.newTypedArray(TYPED_ARRAYS.Float64Array, 6);

  model.plane = vtkPlane.newInstance();

  // Public API methods
  publicAPI.setNormals = (normals) => {
    if (normals && normals.getNumberOfComponents() !== 3) {
      vtkWarningMacro(
        'This array does not have 3 components. Ignoring normals.'
      );
    }

    model.normals = normals;
    publicAPI.modified();

    return true;
  };

  /**
   * Evaluate the function at a point x
   * @param {*} x The point at which to evaluate the function
   * @returns The function value at the point x
   */
  publicAPI.evaluateFunction = (x) => {
    if (!model.points || !model.normals) {
      vtkErrorMacro('Please define points and/or normals!');
      return Number.MAX_VALUE;
    }

    const numPlanes = model.points.getNumberOfPoints();
    if (numPlanes !== model.normals.getNumberOfTuples()) {
      vtkErrorMacro('Number of normals/points inconsistent!');
      return Number.MAX_VALUE;
    }

    let maxVal = -Number.MAX_VALUE;
    const normal = [];
    const point = [];

    for (let i = 0; i < numPlanes; i++) {
      model.normals.getTuple(i, normal);
      model.points.getPoint(i, point);
      const val = vtkPlane.evaluate(normal, point, x);
      if (val > maxVal) {
        maxVal = val;
      }
    }

    return maxVal;
  };

  /**
   * Evaluate the gradient at a point x
   * @param {*} x The point at which to evaluate the gradient
   * @returns The gradient at the point x
   */
  publicAPI.evaluateGradient = (x) => {
    const retVal = [0, 0, 0];
    if (!model.points || !model.normals) {
      vtkErrorMacro('Define points and/or normals first!');
      return retVal;
    }

    const numPlanes = model.points.getNumberOfPoints();
    if (numPlanes !== model.normals.getNumberOfTuples()) {
      vtkErrorMacro('The number of normals/points is inconsistent!');
      return retVal;
    }

    let maxVal = -Number.MAX_VALUE;
    const nTemp = [];
    const pTemp = [];

    for (let i = 0; i < numPlanes; i++) {
      model.normals.getTuple(i, nTemp);
      model.points.getPoint(i, pTemp);
      const val = vtkPlane.evaluate(nTemp, pTemp, x);
      if (val > maxVal) {
        maxVal = val;
        retVal[0] = nTemp[0];
        retVal[1] = nTemp[1];
        retVal[2] = nTemp[2];
      }
    }

    return retVal;
  };

  /**
   * Set the frustum planes
   * @param {Number[]} planes The planes to set
   * @returns {Boolean} true if planes were set, false if they were already set
   */
  publicAPI.setFrustumPlanes = (planes) => {
    if (vtkMath.areEquals(model.planes, planes)) {
      return false;
    }

    model.planes = [...planes];

    const pts = vtkPoints.newInstance({ dataType: VtkDataTypes.DOUBLE });
    const normals = vtkDataArray.newInstance({
      numberOfComponents: 3,
      size: 6 * 3, // 6 planes, each with a normal
      dataType: VtkDataTypes.DOUBLE,
    });

    pts.setNumberOfPoints(6);

    publicAPI.setPoints(pts);
    publicAPI.setNormals(normals);

    const n = [];
    const x = [];

    for (let i = 0; i < 6; i++) {
      const planeOffset = 4 * i;
      n[0] = -planes[planeOffset];
      n[1] = -planes[planeOffset + 1];
      n[2] = -planes[planeOffset + 2];

      x[0] = 0.0;
      x[1] = 0.0;
      x[2] = 0.0;

      if (n[0] !== 0.0) {
        x[0] = planes[planeOffset + 3] / n[0];
      } else if (n[1] !== 0.0) {
        x[1] = planes[planeOffset + 3] / n[1];
      } else {
        x[2] = planes[planeOffset + 3] / n[2];
      }

      pts.setPoint(i, ...x);
      normals.setTuple(i, n);
    }

    publicAPI.modified();
    return true;
  };

  /**
   * Set the bounds of the planes
   * @param {*} bounds The bounds to set
   * @returns {Boolean} true if bounds were set, false if they were already set
   */
  publicAPI.setBounds = (bounds) => {
    if (vtkMath.areEquals(model.bounds, bounds)) {
      return false;
    }

    model.bounds = [...bounds];

    const pts = vtkPoints.newInstance();
    const normals = vtkDataArray.newInstance({
      numberOfComponents: 3,
      size: 6 * 3, // 6 planes, each with a normal
      dataType: VtkDataTypes.DOUBLE,
    });

    pts.setNumberOfPoints(6);

    publicAPI.setPoints(pts);
    publicAPI.setNormals(normals);

    const n = [];
    const x = [];

    // The x planes
    n[0] = -1.0;
    n[1] = 0.0;
    n[2] = 0.0;
    x[0] = bounds[0];
    x[1] = 0.0;
    x[2] = 0.0;
    pts.setPoint(0, ...x);
    normals.setTuple(0, n);

    n[0] = 1.0;
    x[0] = bounds[1];
    pts.setPoint(1, ...x);
    normals.setTuple(1, n);

    // The y planes
    n[0] = 0.0;
    n[1] = -1.0;
    n[2] = 0.0;
    x[0] = 0.0;
    x[1] = bounds[2];
    x[2] = 0.0;
    pts.setPoint(2, ...x);
    normals.setTuple(2, n);

    n[1] = 1.0;
    x[1] = bounds[3];
    pts.setPoint(3, ...x);
    normals.setTuple(3, n);

    // The z planes
    n[0] = 0.0;
    n[1] = 0.0;
    n[2] = -1.0;
    x[0] = 0.0;
    x[1] = 0.0;
    x[2] = bounds[4];
    pts.setPoint(4, ...x);
    normals.setTuple(4, n);

    n[2] = 1.0;
    x[2] = bounds[5];
    pts.setPoint(5, ...x);
    normals.setTuple(5, n);

    publicAPI.modified();
    return true;
  };

  /**
   * Get the number of planes
   * @returns {Number} the number of planes
   */
  publicAPI.getNumberOfPlanes = () => {
    if (model.points && model.normals) {
      const npts = model.points.getNumberOfPoints();
      const nnormals = model.normals.getNumberOfTuples();
      return Math.min(npts, nnormals);
    }
    return 0;
  };

  /**
   * Get the i-th plane
   * @param {*} i
   * @param {vtkPlane} plane the vtkPlane instance to fill
   * @returns {vtkPlane} the plane instance
   */
  publicAPI.getPlane = (i, plane = model.plane) => {
    if (i >= 0 && i < publicAPI.getNumberOfPlanes()) {
      const normal = model.normals.getTuple(i);
      const point = model.points.getPoint(i);
      plane.setNormal(normal);
      plane.setOrigin(point);
    }

    return plane;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  points: null,
  normals: null,
  planes: null,
  bounds: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  vtkImplicitFunction.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['points', 'normals']);
  macro.get(publicAPI, model, ['bounds', 'planes']);

  // Object methods
  vtkPlanes(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPlanes');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
