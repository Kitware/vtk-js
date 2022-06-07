import macro from 'vtk.js/Sources/macros';
import vtkCell from 'vtk.js/Sources/Common/DataModel/Cell';
import vtkLine from 'vtk.js/Sources/Common/DataModel/Line';

function vtkPolyLine(publicAPI, model) {
  model.classHierarchy.push('vtkPolyLine');
  const superClass = { ...publicAPI };

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

    const numLines = superClass.getPoints().getNumberOfPoints() - 1;
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
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkCell.extend(publicAPI, model, initialValues);

  vtkPolyLine(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPolyLine');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
