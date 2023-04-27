import macro from 'vtk.js/Sources/macros';
import vtkCell from 'vtk.js/Sources/Common/DataModel/Cell';
import vtkLine from 'vtk.js/Sources/Common/DataModel/Line';
import { vec3 } from 'gl-matrix';

function vtkPolyLine(publicAPI, model) {
  model.classHierarchy.push('vtkPolyLine');

  const line = vtkLine.newInstance();
  line.getPoints().setNumberOfPoints(2);

  publicAPI.getCellDimension = () => 1;
  publicAPI.intersectWithLine = (t1, t2, p1, p2, tol, x, pcoords) => {
    const outObj = {
      intersect: 0,
      t: Number.MAX_VALUE,
      subId: 0,
      betweenPoints: null,
    };

    const numLines = publicAPI.getNumberOfPoints() - 1;
    let pDistMin = Number.MAX_VALUE;
    const minXYZ = [0, 0, 0];
    const minPCoords = [0, 0, 0];
    for (let subId = 0; subId < numLines; subId++) {
      const pCoords = [0, 0, 0];

      line
        .getPoints()
        .getData()
        .set(model.points.getData().subarray(3 * subId, 3 * (subId + 2)));

      const lineIntersected = line.intersectWithLine(p1, p2, tol, x, pcoords);

      if (
        lineIntersected.intersect === 1 &&
        lineIntersected.t <= outObj.t + tol &&
        lineIntersected.t >= t1 &&
        lineIntersected.t <= t2
      ) {
        outObj.intersect = 1;
        const pDist = line.getParametricDistance(pCoords);
        if (
          pDist < pDistMin ||
          (pDist === pDistMin && lineIntersected.t < outObj.t)
        ) {
          outObj.subId = subId;
          outObj.t = lineIntersected.t;
          pDistMin = pDist;
          for (let k = 0; k < 3; k++) {
            minXYZ[k] = x[k];
            minPCoords[k] = pCoords[k];
          }
        }
      }
    }

    return outObj;
  };

  publicAPI.evaluateLocation = (subId, pcoords, x, weights) => {
    line
      .getPoints()
      .getData()
      .set(model.points.getData().subarray(3 * subId, 3 * (subId + 2)));

    return line.evaluateLocation(pcoords, x, weights);
  };

  publicAPI.evaluateOrientation = (subId, pcoords, q, weights) => {
    if (model.orientations) {
      line.setOrientations([
        model.orientations[subId],
        model.orientations[subId + 1],
      ]);
    } else {
      line.setOrientations(null);
    }

    return line.evaluateOrientation(pcoords, q, weights);
  };

  publicAPI.getDistancesToFirstPoint = () => {
    if (model.distancesTime.getMTime() < model.points.getMTime()) {
      const numPoints = publicAPI.getNumberOfPoints();
      if (!model.distances) {
        model.distances = new Array(numPoints);
      } else {
        model.distances.length = numPoints;
      }
      if (numPoints > 0) {
        const previousPoint = new Array(3);
        const currentPoint = new Array(3);
        let totalDistance = 0;
        model.distances[0] = totalDistance;
        model.points.getPoint(0, previousPoint);
        for (let i = 1; i < numPoints; ++i) {
          model.points.getPoint(i, currentPoint);
          totalDistance += vec3.dist(previousPoint, currentPoint);
          model.distances[i] = totalDistance;
          vec3.copy(previousPoint, currentPoint);
        }
      }
      model.distancesTime.modified();
    }
    return model.distances;
  };

  publicAPI.findPointIdAtDistanceFromFirstPoint = (distance) => {
    const distances = publicAPI.getDistancesToFirstPoint();
    // At least two points to return an ID
    if (distances.length < 2) {
      return -1;
    }
    // Binary search in the distance array
    let minId = 0;
    let maxId = distances.length - 1;
    if (
      distance < distances[minId] ||
      distance > distances[maxId] ||
      distances[maxId] === 0
    ) {
      return -1;
    }
    while (maxId - minId > 1) {
      const midId = Math.floor((minId + maxId) / 2);
      if (distances[midId] <= distance) {
        minId = midId;
      } else {
        maxId = midId;
      }
    }
    return minId;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  orientations: null, // an array of quat or null
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkCell.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['orientations']);

  model.distancesTime = {};
  macro.obj(model.distancesTime, { mtime: 0 });

  vtkPolyLine(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPolyLine');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
