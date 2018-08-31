import macro from 'vtk.js/Sources/macro';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkTextureMapToPlane methods
// ----------------------------------------------------------------------------

function vtkTextureMapToPlane(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTextureMapToPlane');

  function computeNormal(output) {
    const VTK_TOLERANCE = 0.001;
    //  First thing to do is to get an initial normal and point to define
    //  the plane.  Then, use this information to construct better
    //  matrices.  If problem occurs, then the point and plane becomes the
    //  fallback value

    const nbPoints = output.getPoints().getNumberOfPoints();
    let dir = 0;
    const m = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    const x = [0, 0, 0];
    const v = [0, 0, 0];

    //  Get minimum width of bounding box.
    const bounds = output.getBounds();
    const minBounds = [bounds[0], bounds[2], bounds[4]];
    const maxBounds = [bounds[1], bounds[3], bounds[5]];
    const length = Math.sqrt(
      vtkMath.distance2BetweenPoints(minBounds, maxBounds)
    );
    let w = length;
    let i = 0;
    for (; i < 3; i++) {
      model.normal[i] = 0.0;
      if (bounds[2 * i + 1] - bounds[2 * i] < w) {
        dir = i;
        w = bounds[2 * i + 1] - bounds[2 * i];
      }
    }

    //  If the bounds is perpendicular to one of the axes, then can
    //  quickly compute normal.
    //
    model.normal[dir] = 1.0;
    if (w <= length * VTK_TOLERANCE) {
      return;
    }

    //  Need to compute least squares approximation.  Depending on major
    //  normal direction (dir), construct matrices appropriately.
    //
    //  Compute 3x3 least squares matrix
    v[0] = 0.0;
    v[1] = 0.0;
    v[2] = 0.0;
    for (i = 0; i < 9; i++) {
      m[i] = 0.0;
    }

    for (let ptId = 0; ptId < nbPoints; ptId++) {
      output.getPoints().getPoint(ptId, x);

      v[0] += x[0] * x[2];
      v[1] += x[1] * x[2];
      v[2] += x[2];

      m[0] += x[0] * x[0];
      m[1] += x[0] * x[1];
      m[2] += x[0];

      m[3] += x[0] * x[1];
      m[4] += x[1] * x[1];
      m[5] += x[1];

      m[6] += x[0];
      m[7] += x[1];
    }
    m[8] = nbPoints;

    //  Solve linear system using Kramers rule

    const c1 = [m[0], m[1], m[2]];
    const c2 = [m[3], m[4], m[5]];
    const c3 = [m[6], m[7], m[8]];
    const matrix = [c1, c2, c3];
    const det = vtkMath.determinant3x3(matrix);
    if (det <= VTK_TOLERANCE) {
      return;
    }

    matrix[0] = v;
    matrix[1] = c2;
    matrix[2] = c3;
    model.normal[0] = vtkMath.determinant3x3(matrix) / det;
    matrix[0] = c1;
    matrix[1] = v;
    matrix[2] = c3;
    model.normal[1] = vtkMath.determinant3x3(matrix) / det;
    // because of the formulation
    model.normal[2] = -1.0;
  }

  publicAPI.requestData = (inData, outData) => {
    if (model.deleted) {
      return;
    }
    const input = inData[0];
    const nbPoints = input.getPoints().getNumberOfPoints();
    if (nbPoints < 3 && model.automaticPlaneGeneration) {
      vtkErrorMacro("Can't generate texture coordinates without points");
      return;
    }

    const output = vtkPolyData.newInstance();
    output
      .getPoints()
      .setData(new Float32Array(input.getPoints().getData()), 3);
    output.getPolys().setData(new Uint32Array(input.getPolys().getData()));

    const tcoordsData = [];

    let minProj = 0;
    let i = 0;
    let j = 0;
    let proj = 0;
    const axis = [0, 0, 0];
    let dir = 0;
    const tAxis = [0, 0, 0];
    const sAxis = [0, 0, 0];
    let s = 0;
    let t = 0;
    let sSf = 0;
    let tSf = 0;
    const p = [0, 0, 0];

    //  Compute least squares plane if on automatic mode; otherwise use
    //  normal specified or plane specified
    if (
      model.automaticPlaneGeneration &&
      model.origin[0] === 0 &&
      model.origin[1] === 0 &&
      model.origin[2] === 0 &&
      model.point1[0] === 0 &&
      model.point1[1] === 0 &&
      model.point2[0] === 0 &&
      model.point2[1] === 0
    ) {
      if (model.automaticPlaneGeneration) {
        computeNormal(output);
      }

      vtkMath.normalize(model.normal);

      //  Now project each point onto plane generating s,t texture coordinates
      //
      //  Create local s-t coordinate system.  Need to find the two axes on
      //  the plane and encompassing all the points.  Hence use the bounding
      //  box as a reference.
      minProj = 1.0;
      i = 0;
      for (; i < 3; i++) {
        axis[0] = 0.0;
        axis[1] = 0.0;
        axis[2] = 0.0;
        axis[i] = 1.0;
        proj = Math.abs(vtkMath.dot(model.normal, axis));
        if (proj < minProj) {
          minProj = proj;
          dir = i;
        }
      }
      axis[0] = 0.0;
      axis[1] = 0.0;
      axis[2] = 0.0;
      axis[dir] = 1.0;

      vtkMath.cross(model.normal, axis, tAxis);
      vtkMath.normalize(tAxis);

      vtkMath.cross(tAxis, model.normal, sAxis);

      //  Construct projection matrices
      //
      //  Arrange s-t axes so that parametric location of points will fall
      //  between s_range and t_range.  Simplest to do by projecting maximum
      //  corner of bounding box unto plane and backing out scale factors.
      //
      const bounds = output.getBounds();
      for (i = 0; i < 3; i++) {
        axis[i] = bounds[2 * i + 1] - bounds[2 * i];
      }

      s = vtkMath.dot(sAxis, axis);
      t = vtkMath.dot(tAxis, axis);

      sSf = (model.sRange[1] - model.sRange[0]) / s;
      tSf = (model.tRange[1] - model.tRange[0]) / t;
      //  Now can loop over all points, computing parametric coordinates.
      for (i = 0; i < nbPoints; i++) {
        output.getPoints().getPoint(i, p);
        for (j = 0; j < 3; j++) {
          axis[j] = p[j] - bounds[2 * j];
        }

        tcoordsData.push(model.sRange[0] + vtkMath.dot(sAxis, axis) * sSf);
        tcoordsData.push(model.tRange[0] + vtkMath.dot(tAxis, axis) * tSf);
      }
    } else {
      let num = 0;

      // compute axes
      for (i = 0; i < 3; i++) {
        sAxis[i] = model.point1[i] - model.origin[i];
        tAxis[i] = model.point2[i] - model.origin[i];
      }

      let sDenom = vtkMath.dot(sAxis, sAxis);
      let tDenom = vtkMath.dot(tAxis, tAxis);

      if (sDenom === 0.0 || tDenom === 0.0) {
        vtkErrorMacro('Bad plane definition');
        sDenom = 1.0;
        tDenom = 1.0;
      }

      // compute s-t coordinates
      for (i = 0; i < nbPoints; i++) {
        output.getPoints().getPoint(i, p);
        for (j = 0; j < 3; j++) {
          axis[j] = p[j] - model.origin[j];
        }

        // s-coordinate
        num = sAxis[0] * axis[0] + sAxis[1] * axis[1] + sAxis[2] * axis[2];
        tcoordsData.push(num / sDenom);

        // t-coordinate
        num = tAxis[0] * axis[0] + tAxis[1] * axis[1] + tAxis[2] * axis[2];
        tcoordsData.push(num / tDenom);
      }
    }

    const tCoords = vtkDataArray.newInstance({
      name: 'Texture Coordinates',
      numberOfComponents: 2,
      size: nbPoints,
      values: tcoordsData,
    });

    output.getPointData().setTCoords(tCoords);

    // Update output
    outData[0] = output;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  origin: [0, 0, 0],
  point1: [0, 0, 0],
  point2: [0, 0, 0],
  normal: [0, 0, 0],
  sRange: [0, 1],
  tRange: [0, 1],
  automaticPlaneGeneration: 1,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  macro.setGetArray(
    publicAPI,
    model,
    ['origin', 'point1', 'point2', 'normal', 'sRange', 'tRange'],
    3
  );
  macro.setGet(publicAPI, model, ['automaticPlaneGeneration']);

  macro.algo(publicAPI, model, 1, 1);
  vtkTextureMapToPlane(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkTextureMapToPlane');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
