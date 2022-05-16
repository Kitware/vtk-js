import macro from 'vtk.js/Sources/macros';
import vtkCellTypes from 'vtk.js/Sources/Common/DataModel/CellTypes';
import vtkLine from 'vtk.js/Sources/Common/DataModel/Line';
import vtkPicker from 'vtk.js/Sources/Rendering/Core/Picker';
import vtkPolyLine from 'vtk.js/Sources/Common/DataModel/PolyLine';
import vtkTriangle from 'vtk.js/Sources/Common/DataModel/Triangle';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import { CellType } from 'vtk.js/Sources/Common/DataModel/CellTypes/Constants';
import { vec3 } from 'gl-matrix';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

function createCellMap() {
  return {
    [CellType.VTK_LINE]: vtkLine.newInstance(),
    [CellType.VTK_POLY_LINE]: vtkPolyLine.newInstance(),
    [CellType.VTK_TRIANGLE]: vtkTriangle.newInstance(),
  };
}

function clipLineWithPlane(mapper, matrix, p1, p2) {
  const outObj = { planeId: -1, t1: 0.0, t2: 1.0, intersect: 0 };
  const nbClippingPlanes = mapper.getNumberOfClippingPlanes();
  const plane = [];
  for (let i = 0; i < nbClippingPlanes; i++) {
    mapper.getClippingPlaneInDataCoords(matrix, i, plane);

    const d1 =
      plane[0] * p1[0] + plane[1] * p1[1] + plane[2] * p1[2] + plane[3];
    const d2 =
      plane[0] * p2[0] + plane[1] * p2[1] + plane[2] * p2[2] + plane[3];

    // If both distances are negative, both points are outside
    if (d1 < 0 && d2 < 0) {
      return 0;
    }

    if (d1 < 0 || d2 < 0) {
      // If only one of the distances is negative, the line crosses the plane
      // Compute fractional distance "t" of the crossing between p1 & p2
      let t = 0.0;

      // The "if" here just avoids an expensive division when possible
      if (d1 !== 0) {
        // We will never have d1==d2 since they have different signs
        t = d1 / (d1 - d2);
      }

      // If point p1 was clipped, adjust t1
      if (d1 < 0) {
        if (t >= outObj.t1) {
          outObj.t1 = t;
          outObj.planeId = i;
        }
      } else if (t <= outObj.t2) {
        // else point p2 was clipped, so adjust t2
        outObj.t2 = t;
      }
      // If this happens, there's no line left
      if (outObj.t1 > outObj.t2) {
        outObj.intersect = 0;
        return outObj;
      }
    }
  }
  outObj.intersect = 1;
  return outObj;
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {
  clipLineWithPlane,
};

// ----------------------------------------------------------------------------
// vtkCellPicker methods
// ----------------------------------------------------------------------------

function vtkCellPicker(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCellPicker');

  const superClass = { ...publicAPI };

  function resetCellPickerInfo() {
    model.cellId = -1;

    model.pCoords[0] = 0.0;
    model.pCoords[1] = 0.0;
    model.pCoords[2] = 0.0;

    model.cellIJK[0] = 0.0;
    model.cellIJK[1] = 0.0;
    model.cellIJK[2] = 0.0;

    model.mapperNormal[0] = 0.0;
    model.mapperNormal[1] = 0.0;
    model.mapperNormal[2] = 1.0;

    model.pickNormal[0] = 0.0;
    model.pickNormal[1] = 0.0;
    model.pickNormal[2] = 1.0;
  }

  function resetPickInfo() {
    model.dataSet = null;
    model.mapper = null;
    resetCellPickerInfo();
  }

  publicAPI.initialize = () => {
    resetPickInfo();
    superClass.initialize();
  };

  publicAPI.computeSurfaceNormal = (data, cell, weights, normal) => {
    const normals = data.getPointData().getNormals();
    // TODO add getCellDimension on vtkCell
    const cellDimension = 0;
    if (normals) {
      normal[0] = 0.0;
      normal[1] = 0.0;
      normal[2] = 0.0;
      const pointNormal = [];
      for (let i = 0; i < 3; i++) {
        normals.getTuple(cell.getPointsIds()[i], pointNormal);
        normal[0] += pointNormal[0] * weights[i];
        normal[1] += pointNormal[1] * weights[i];
        normal[2] += pointNormal[2] * weights[i];
      }
      vtkMath.normalize(normal);
    } else if (cellDimension === 2) {
      // TODO
    } else {
      return 0;
    }
    return 1;
  };

  publicAPI.pick = (selection, renderer) => {
    publicAPI.initialize();
    const pickResult = superClass.pick(selection, renderer);
    if (pickResult) {
      const camera = renderer.getActiveCamera();
      const cameraPos = [];
      camera.getPosition(cameraPos);

      if (camera.getParallelProjection()) {
        // For parallel projection, use -ve direction of projection
        const cameraFocus = [];
        camera.getFocalPoint(cameraFocus);
        model.pickNormal[0] = cameraPos[0] - cameraFocus[0];
        model.pickNormal[1] = cameraPos[1] - cameraFocus[1];
        model.pickNormal[2] = cameraPos[2] - cameraFocus[2];
      } else {
        // Get the vector from pick position to the camera
        model.pickNormal[0] = cameraPos[0] - model.pickPosition[0];
        model.pickNormal[1] = cameraPos[1] - model.pickPosition[1];
        model.pickNormal[2] = cameraPos[2] - model.pickPosition[2];
      }
      vtkMath.normalize(model.pickNormal);
    }
    return pickResult;
  };

  publicAPI.intersectWithLine = (p1, p2, tol, mapper) => {
    let tMin = Number.MAX_VALUE;
    const t1 = 0.0;
    const t2 = 1.0;

    const vtkCellPickerPlaneTol = 1e-14;

    const clipLine = clipLineWithPlane(
      mapper,
      model.transformMatrix,
      p1,
      p2,
      t1,
      t2
    );
    if (mapper && !clipLine.intersect) {
      return Number.MAX_VALUE;
    }

    if (mapper.isA('vtkImageMapper')) {
      const pickData = mapper.intersectWithLineForCellPicking(p1, p2);
      if (pickData) {
        tMin = pickData.t;
        model.cellIJK = pickData.ijk;
        model.pCoords = pickData.pCoords;
      }
    } else if (mapper.isA('vtkMapper')) {
      tMin = publicAPI.intersectActorWithLine(p1, p2, t1, t2, tol, mapper);
    }

    if (tMin < model.globalTMin) {
      model.globalTMin = tMin;
      if (
        Math.abs(tMin - t1) < vtkCellPickerPlaneTol &&
        clipLine.clippingPlaneId >= 0
      ) {
        model.mapperPosition[0] = p1[0] * (1 - t1) + p2[0] * t1;
        model.mapperPosition[1] = p1[1] * (1 - t1) + p2[1] * t1;
        model.mapperPosition[2] = p1[2] * (1 - t1) + p2[2] * t1;
        const plane = [];
        mapper.getClippingPlaneInDataCoords(
          model.transformMatrix,
          clipLine.clippingPlaneId,
          plane
        );
        vtkMath.normalize(plane);
        // Want normal outward from the planes, not inward
        model.mapperNormal[0] = -plane[0];
        model.mapperNormal[1] = -plane[1];
        model.mapperNormal[2] = -plane[2];
      }
      vec3.transformMat4(
        model.pickPosition,
        model.mapperPosition,
        model.transformMatrix
      );
      // Transform vector
      const mat = model.transformMatrix;
      model.mapperNormal[0] =
        mat[0] * model.pickNormal[0] +
        mat[4] * model.pickNormal[1] +
        mat[8] * model.pickNormal[2];
      model.mapperNormal[1] =
        mat[1] * model.pickNormal[0] +
        mat[5] * model.pickNormal[1] +
        mat[9] * model.pickNormal[2];
      model.mapperNormal[2] =
        mat[2] * model.pickNormal[0] +
        mat[6] * model.pickNormal[1] +
        mat[10] * model.pickNormal[2];
    }

    return tMin;
  };

  publicAPI.intersectActorWithLine = (p1, p2, t1, t2, tol, mapper) => {
    let tMin = Number.MAX_VALUE;
    const minXYZ = [0, 0, 0];
    let pDistMin = Number.MAX_VALUE;
    const minPCoords = [0, 0, 0];
    let minCellId = null;
    let minCell = null;
    let minCellType = null;
    let subId = null;
    const x = [];
    const data = mapper.getInputData();
    const isPolyData = 1;

    // Make a new p1 and p2 using the clipped t1 and t2
    const q1 = [0, 0, 0];
    const q2 = [0, 0, 0];
    q1[0] = p1[0];
    q1[1] = p1[1];
    q1[2] = p1[2];
    q2[0] = p2[0];
    q2[1] = p2[1];
    q2[2] = p2[2];
    if (t1 !== 0.0 || t2 !== 1.0) {
      for (let j = 0; j < 3; j++) {
        q1[j] = p1[j] * (1.0 - t1) + p2[j] * t1;
        q2[j] = p1[j] * (1.0 - t2) + p2[j] * t2;
      }
    }

    const locator = null;
    if (locator) {
      // TODO when cell locator will be implemented
    } else if (data.getCells) {
      if (!data.getCells()) {
        data.buildLinks();
      }

      const tempCellMap = createCellMap();
      const minCellMap = createCellMap();

      const numberOfCells = data.getNumberOfCells();

      for (let cellId = 0; cellId < numberOfCells; cellId++) {
        const pCoords = [0, 0, 0];

        minCellType = data.getCellType(cellId);
        const cell = tempCellMap[minCellType];

        if (cell == null) {
          // eslint-disable-next-line no-continue
          continue;
        }

        minCell = minCellMap[minCellType];

        data.getCell(cellId, cell);

        let cellPicked;

        if (isPolyData) {
          if (vtkCellTypes.hasSubCells(minCellType)) {
            cellPicked = cell.intersectWithLine(
              t1,
              t2,
              p1,
              p2,
              tol,
              x,
              pCoords
            );
          } else {
            cellPicked = cell.intersectWithLine(p1, p2, tol, x, pCoords);
          }
        } else {
          cellPicked = cell.intersectWithLine(q1, q2, tol, x, pCoords);
          if (t1 !== 0.0 || t2 !== 1.0) {
            cellPicked.t = t1 * (1.0 - cellPicked.t) + t2 * cellPicked.t;
          }
        }

        if (
          cellPicked.intersect === 1 &&
          cellPicked.t <= tMin + model.tolerance &&
          cellPicked.t >= t1 &&
          cellPicked.t <= t2
        ) {
          const pDist = cell.getParametricDistance(pCoords);

          if (pDist < pDistMin || (pDist === pDistMin && cellPicked.t < tMin)) {
            tMin = cellPicked.t;
            pDistMin = pDist;
            subId = cellPicked.subId;
            minCellId = cellId;
            cell.deepCopy(minCell);
            for (let k = 0; k < 3; k++) {
              minXYZ[k] = x[k];
              minPCoords[k] = pCoords[k];
            }
          }
        }
      }
    }

    if (minCellId >= 0 && tMin < model.globalTMin) {
      resetPickInfo();
      const nbPointsInCell = minCell.getNumberOfPoints();
      const weights = new Array(nbPointsInCell);
      for (let i = 0; i < nbPointsInCell; i++) {
        weights[i] = 0.0;
      }
      const point = [];

      if (vtkCellTypes.hasSubCells(minCellType)) {
        minCell.evaluateLocation(subId, minPCoords, point, weights);
      } else {
        minCell.evaluateLocation(minPCoords, point, weights);
      }

      // Return the polydata to the user
      model.dataSet = data;
      model.cellId = minCellId;
      model.pCoords[0] = minPCoords[0];
      model.pCoords[1] = minPCoords[1];
      model.pCoords[2] = minPCoords[2];

      // Find the point with the maximum weight
      let maxWeight = 0;
      let iMaxWeight = -1;
      for (let i = 0; i < nbPointsInCell; i++) {
        if (weights[i] > maxWeight) {
          iMaxWeight = i;
          maxWeight = weights[i];
        }
      }

      // If maximum weight is found, use it to get the PointId
      if (iMaxWeight !== -1) {
        model.pointId = minCell.getPointsIds()[iMaxWeight];
      }

      // Set the mapper position
      model.mapperPosition[0] = minXYZ[0];
      model.mapperPosition[1] = minXYZ[1];
      model.mapperPosition[2] = minXYZ[2];

      // Compute the normal
      if (
        !publicAPI.computeSurfaceNormal(
          data,
          minCell,
          weights,
          model.mapperNormal
        )
      ) {
        // By default, the normal points back along view ray
        model.mapperNormal[0] = p1[0] - p2[0];
        model.mapperNormal[1] = p1[1] - p2[1];
        model.mapperNormal[2] = p1[2] - p2[2];
        vtkMath.normalize(model.mapperNormal);
      }
    }

    return tMin;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  cellId: -1,
  pCoords: [],
  cellIJK: [],
  pickNormal: [],
  mapperNormal: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkPicker.extend(publicAPI, model, initialValues);

  macro.getArray(publicAPI, model, [
    'pickNormal',
    'mapperNormal',
    'pCoords',
    'cellIJK',
  ]);
  macro.get(publicAPI, model, ['cellId']);

  // Object methods
  vtkCellPicker(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCellPicker');

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...STATIC };
