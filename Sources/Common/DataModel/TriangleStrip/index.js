import macro from 'vtk.js/Sources/macros';
import vtkCell from 'vtk.js/Sources/Common/DataModel/Cell';
import vtkLine from 'vtk.js/Sources/Common/DataModel/Line';
import vtkTriangle from 'vtk.js/Sources/Common/DataModel/Triangle';
import { CellType } from 'vtk.js/Sources/Common/DataModel/CellTypes/Constants';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

function notImplemented(method) {
  return () => vtkErrorMacro(`vtkTriangleStrip.${method} - NOT IMPLEMENTED`);
}

/**
 * Decomposes a triangle strip into individual triangles.
 * @param {*} pts Points of the triangle strip
 * @param {*} polys Cell array to store the resulting triangles
 */
function decomposeStrip(pts, polys) {
  if (!Array.isArray(pts) || pts.length < 3) {
    vtkErrorMacro('decomposeStrip - Invalid points array');
    return;
  }

  let p1 = pts[0];
  let p2 = pts[1];

  for (let i = 0; i < pts.length - 2; i++) {
    const p3 = pts[i + 2];

    if (i % 2) {
      // Flip ordering to preserve consistency
      polys.insertNextCell([p2, p1, p3]);
    } else {
      polys.insertNextCell([p1, p2, p3]);
    }

    p1 = p2;
    p2 = p3;
  }
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {
  decomposeStrip,
};

// ----------------------------------------------------------------------------
// vtkTriangleStrip methods
// ----------------------------------------------------------------------------

function vtkTriangleStrip(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTriangleStrip');

  const superInitialize = publicAPI.initialize;
  publicAPI.initialize = (points, pointsIds) => {
    model.triangle.initialize(points, pointsIds);
    superInitialize(points, pointsIds);
  };

  /**
   * Get the cell type.
   * @returns {number} Cell type
   */
  publicAPI.getCellType = () => CellType.VTK_TRIANGLE_STRIP;

  /**
   * Get the cell dimension.
   * The dimension of a triangle strip is always 2.
   * @returns {number} Cell dimension
   */
  publicAPI.getCellDimension = () => 2;

  /**
   * Get the number of edges.
   * @returns {number} Number of edges
   */
  publicAPI.getNumberOfEdges = () => model.pointsIds.length;

  /**
   * Get the number of faces.
   * @returns {number} Number of faces
   */
  publicAPI.getNumberOfFaces = () => 0;

  /**
   * Evaluate the position within the triangle strip.
   * @param {*} x Intersection point
   * @param {*} closestPoint Closest point on the triangle
   * @param {*} pcoords Parametric coordinates
   * @param {*} dist2 Squared distance to the closest point
   * @param {*} weights Weights for interpolation
   * @returns {number} Evaluation status
   */
  publicAPI.evaluatePosition = (x, closestPoint, pcoords, dist2, weights) => {
    const pc = [0, 0, 0];
    let minDist2 = Number.MAX_VALUE;
    let returnStatus = 0;
    const tempWeights = [];
    const activeWeights = [];
    const closest = [];

    pcoords[2] = 0.0;
    activeWeights[0] = 0.0;
    activeWeights[1] = 0.0;
    activeWeights[2] = 0.0;

    const points = model.triangle.getPoints();
    points.setNumberOfPoints(3);

    const pointsIds = model.triangle.getPointsIds();
    const numPoints = pointsIds.length;

    // Initialize weights
    for (let i = 0; i < numPoints; i++) {
      weights[i] = 0.0;
    }

    // Iterate through triangles in the strip
    for (let i = 0; i < numPoints - 2; i++) {
      // Set triangle points
      const pt0 = [];
      points.getPoint(i, pt0);
      const pt1 = [];
      points.getPoint(i + 1, pt1);
      const pt2 = [];
      points.getPoint(i + 2, pt2);

      points.setData(Float32Array.from([...pt0, ...pt1, ...pt2]), 3);

      // Use dist2 from triangle's evaluatePosition return value
      const status = model.triangle.evaluatePosition(
        x,
        closest,
        pc,
        tempWeights
      );
      const currentDist2 = status.dist2;

      if (
        status.evaluation >= 0 &&
        (currentDist2 < minDist2 ||
          (currentDist2 === minDist2 && returnStatus === 0))
      ) {
        returnStatus = status;
        if (closestPoint) {
          closestPoint[0] = closest[0];
          closestPoint[1] = closest[1];
          closestPoint[2] = closest[2];
        }
        pcoords[0] = pc[0];
        pcoords[1] = pc[1];
        minDist2 = currentDist2;
        activeWeights[0] = tempWeights[0];
        activeWeights[1] = tempWeights[1];
        activeWeights[2] = tempWeights[2];
      }
    }

    dist2[0] = minDist2;
    weights[0] = activeWeights[0];
    weights[1] = activeWeights[1];
    weights[2] = activeWeights[2];

    return returnStatus;
  };

  /**
   * Evaluate the location within the triangle strip.
   * @param {*} subId Sub-Id of the triangle
   * @param {*} pcoords Parametric coordinates
   * @param {*} x Intersection point
   * @param {*} weights Weights for interpolation
   */
  publicAPI.evaluateLocation = (subId, pcoords, x, weights) => {
    const idx = [
      [0, 1, 2],
      [1, 0, 2],
    ];
    const order = subId % 2;
    const numPoints = model.pointsIds.length;

    // Initialize weights
    for (let i = 0; i < numPoints; i++) {
      weights[i] = 0.0;
    }

    const u3 = 1.0 - pcoords[0] - pcoords[1];
    weights[subId] = u3;
    weights[subId + 1] = pcoords[0];
    weights[subId + 2] = pcoords[1];

    // Get points
    const pt1 = [];
    model.points.getPoint(subId + idx[order][0], pt1);
    const pt2 = [];
    model.points.getPoint(subId + idx[order][1], pt2);
    const pt3 = [];
    model.points.getPoint(subId + idx[order][2], pt3);

    // Interpolate position
    for (let i = 0; i < 3; i++) {
      x[i] =
        pt1[i] * weights[subId] +
        pt2[i] * weights[subId + 1] +
        pt3[i] * weights[subId + 2];
    }
  };

  /**
   * Get the cell boundary of the triangle strip.
   * @param {Number} subId The sub-id of the cell.
   * @param {Vector3} pcoords The parametric coordinates.
   * @param {Vector2} pts The points of the cell.
   */
  publicAPI.cellBoundary = (subId, pcoords, pts) => {
    const idx = [
      [0, 1, 2],
      [1, 0, 2],
    ];

    const order = subId % 2;

    const pointsIds = model.triangle.getPointsIds();
    pointsIds[0] = model.pointsIds[idx[order][0]];
    pointsIds[1] = model.pointsIds[idx[order][1]];
    pointsIds[2] = model.pointsIds[idx[order][2]];

    return model.triangle.cellBoundary(0, pcoords, pts);
  };

  /**
   * Get the edge of the triangle strip.
   * @param {Number} edgeId Edge index (0 to n-1)
   * @returns {vtkLine} The edge as a vtkLine instance
   */
  publicAPI.getEdge = (edgeId) => {
    let id1;
    let id2;
    const numPoints = model.pointsIds.length;

    if (edgeId === 0) {
      id1 = 0;
      id2 = 1;
    } else if (edgeId === numPoints - 1) {
      id1 = edgeId - 1;
      id2 = edgeId;
    } else {
      id1 = edgeId - 1;
      id2 = edgeId + 1;
    }

    model.line.getPointsIds()[0] = model.pointsIds[id1];
    model.line.getPointsIds()[1] = model.pointsIds[id2];
    model.line.getPoints().setPoint(0, model.points.getPoint(id1));
    model.line.getPoints().setPoint(1, model.points.getPoint(id2));

    return model.line;
  };

  /**
   * Intersects a line with the triangle strip.
   * @param {Vector3} p1 Start point of the line
   * @param {Vector3} p2 End point of the line
   * @param {number} tol Tolerance for intersection
   * @param {Vector3} x Intersection point
   * @param {Vector3} pcoords Parametric coordinates of the intersection
   * @returns {Boolean} True if the line intersects the triangle strip
   */
  publicAPI.intersectWithLine = (p1, p2, tol, x, pcoords) => {
    const numTris = model.pointsIds.length - 2;

    const points = model.triangle.getPoints();
    points.setNumberOfPoints(3);

    for (let i = 0; i < numTris; i++) {
      const pt0 = [];
      model.points.getPoint(model.pointsIds[i], pt0);
      const pt1 = [];
      model.points.getPoint(model.pointsIds[i + 1], pt1);
      const pt2 = [];
      model.points.getPoint(model.pointsIds[i + 2], pt2);
      points.setData(Float32Array.from([...pt0, ...pt1, ...pt2]), 3);
      const ret = model.triangle.intersectWithLine(p1, p2, tol, x, pcoords);
      if (ret.intersect) {
        return ret;
      }
    }

    return false;
  };

  // Triangulate
  /**
   * Triangulate the triangle strip.
   * @returns {Boolean} True if the triangulation is successful.
   */
  publicAPI.triangulate = () => {
    const numTris = model.points.getNumberOfPoints() - 2;
    model.tris = new Array(3 * numTris);

    const idx = [
      [0, 1, 2],
      [1, 0, 2],
    ];

    for (let subId = 0; subId < numTris; subId++) {
      const order = subId % 2;
      for (let i = 0; i < 3; i++) {
        model.tris[subId * 3 + i] = subId + idx[order][i];
      }
    }

    return true;
  };

  /**
   * Get the point array of the triangle strip.
   * @returns {Array} The point array.
   */
  publicAPI.getPointArray = () => model.tris;

  // Derivatives
  /**
   * Get the derivatives of the triangle strip.
   * @param {Number} subId - The sub-id of the triangle.
   * @param {Vector3} pcoords - The parametric coordinates.
   * @param {Number[]} values - The values at the points.
   * @param {Number} dim - The dimension.
   * @param {Number[]} derivs - The derivatives.
   */
  publicAPI.derivatives = (subId, pcoords, values, dim, derivs) => {
    const pt0 = [];
    model.points.getPoint(subId, pt0);
    const pt1 = [];
    model.points.getPoint(subId + 1, pt1);
    const pt2 = [];
    model.points.getPoint(subId + 2, pt2);

    const points = model.triangle.getPoints();

    points.setPoint(0, ...pt0);
    points.setPoint(1, ...pt1);
    points.setPoint(2, ...pt2);

    model.triangle.derivatives(0, pcoords, values, dim, derivs);
  };

  /**
   * Get the parametric center of the triangle strip.
   * @param {Vector3} pcoords - The parametric coordinates.
   * @returns {Number} The parametric center.
   */
  publicAPI.getParametricCenter = (pcoords) => {
    pcoords[0] = 0.333333;
    pcoords[1] = 0.333333;
    pcoords[2] = 0.0;
    return Math.floor((model.pointsIds.length - 2) / 2);
  };

  /**
   * Contour the triangle strip.
   * @param {*} value
   * @param {*} cellScalars
   * @param {*} locator
   * @param {*} verts
   * @param {*} lines
   * @param {*} polys
   * @param {*} inPd
   * @param {*} outPd
   * @param {*} inCd
   * @param {*} cellId
   * @param {*} outCd
   * @returns
   */
  publicAPI.contour = (
    value,
    cellScalars,
    locator,
    verts,
    lines,
    polys,
    inPd,
    outPd,
    inCd,
    cellId,
    outCd
  ) => notImplemented('contour')();

  /**
   * Clip the triangle strip.
   * @param {*} value Clipping value
   * @param {*} cellScalars Cell scalars
   * @param {*} locator Locator
   * @param {*} tris Triangle indices
   * @param {*} inPd Input point data
   * @param {*} outPd Output point data
   * @param {*} inCd
   * @param {*} cellId
   * @param {*} outCd
   * @param {*} insideOut
   * @returns
   */
  publicAPI.clip = (
    value,
    cellScalars,
    locator,
    tris,
    inPd,
    outPd,
    inCd,
    cellId,
    outCd,
    insideOut
  ) => notImplemented('clip')();
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  line: null,
  triangle: null,
  tris: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkCell.extend(publicAPI, model, initialValues);

  if (!model.line) {
    model.line = vtkLine.newInstance();
  }

  if (!model.triangle) {
    model.triangle = vtkTriangle.newInstance();
  }

  // Build VTK API
  vtkTriangleStrip(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkTriangleStrip');

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...STATIC };
