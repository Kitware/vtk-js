import macro from 'vtk.js/Sources/macros';
import vtkCell from 'vtk.js/Sources/Common/DataModel/Cell';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import { CellType } from 'vtk.js/Sources/Common/DataModel/CellTypes/Constants';
import vtkTriangle from 'vtk.js/Sources/Common/DataModel/Triangle';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';

function intersectionStruct() {
  return {
    intersected: false,
    subId: -1,
    x: [0.0, 0.0, 0.0],
    pCoords: [0.0, 0.0, 0.0],
    t: -1,
  };
}

function vtkQuad(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkQuad');

  publicAPI.getCellDimension = () => 2;
  publicAPI.getCellType = () => CellType.VTK_QUAD;
  publicAPI.getNumberOfEdges = () => 4;
  publicAPI.getNumberOfFaces = () => 0;

  publicAPI.intersectWithLine = (p1, p2, tol, x, pcoords) => {
    let outObj = {
      subId: 0,
      t: Number.MAX_VALUE,
      intersect: 0,
      betweenPoints: false,
    };
    let diagonalCase;
    const point0 = model.points.getPoint(0, []);
    const point1 = model.points.getPoint(1, []);
    const point2 = model.points.getPoint(2, []);
    const point3 = model.points.getPoint(3, []);
    const d1 = vtkMath.distance2BetweenPoints(point0, point2);
    const d2 = vtkMath.distance2BetweenPoints(point1, point3);

    /* Figure out how to uniquely tessellate the quad. Watch out for
     * equivalent triangulations (i.e., the triangulation is equivalent
     * no matter where the diagonal). In this case use the point ids as
     * a tie breaker to ensure unique triangulation across the quad.
     */

    // rare case; discriminate based on point id
    if (d1 === d2) {
      // find the maximum id
      let id;
      let maxId = 0;
      let maxIdx = 0;
      for (let i = 0; i < 4; i++) {
        id = model.pointsIds[i];
        if (id > maxId) {
          maxId = id;
          maxIdx = i;
        }
      }
      if (maxIdx === 0 || maxIdx === 2) {
        diagonalCase = 0;
      } else {
        diagonalCase = 1;
      }
    } else if (d1 < d2) {
      diagonalCase = 0;
    } else {
      diagonalCase = 1;
    }
    let points = null;
    if (!model.triangle) {
      model.triangle = vtkTriangle.newInstance();
      points = vtkPoints.newInstance();
      points.setNumberOfPoints(3);
      model.triangle.initialize(points);
    } else {
      points = model.triangle.getPoints();
    }

    let firstIntersect;
    const firstIntersectTmpObj = intersectionStruct();

    let secondIntersect;
    const secondIntersectTmpObj = intersectionStruct();

    let useFirstIntersection;
    let useSecondIntersection;

    switch (diagonalCase) {
      case 0:
        points.setPoint(0, ...point0);
        points.setPoint(1, ...point1);
        points.setPoint(2, ...point2);
        firstIntersect = model.triangle.intersectWithLine(
          p1,
          p2,
          tol,
          firstIntersectTmpObj.x,
          firstIntersectTmpObj.pCoords
        );

        points.setPoint(0, ...point2);
        points.setPoint(1, ...point3);
        points.setPoint(2, ...point0);
        secondIntersect = model.triangle.intersectWithLine(
          p1,
          p2,
          tol,
          secondIntersectTmpObj.x,
          secondIntersectTmpObj.pCoords
        );

        useFirstIntersection =
          firstIntersect.intersect && secondIntersect.intersect
            ? firstIntersect.t <= secondIntersect.t
            : firstIntersect.intersect;

        useSecondIntersection =
          firstIntersect.intersect && secondIntersect.intersect
            ? secondIntersect.t < firstIntersect.t
            : secondIntersect.intersect;

        if (useFirstIntersection) {
          outObj = firstIntersect;

          x[0] = firstIntersectTmpObj.x[0];
          x[1] = firstIntersectTmpObj.x[1];
          x[2] = firstIntersectTmpObj.x[2];

          pcoords[0] =
            firstIntersectTmpObj.pCoords[0] + firstIntersectTmpObj.pCoords[1];
          pcoords[1] = firstIntersectTmpObj.pCoords[1];
          pcoords[2] = firstIntersectTmpObj.pCoords[2];
        } else if (useSecondIntersection) {
          outObj = secondIntersect;
          x[0] = secondIntersectTmpObj.x[0];
          x[1] = secondIntersectTmpObj.x[1];
          x[2] = secondIntersectTmpObj.x[2];

          pcoords[0] =
            1.0 -
            (secondIntersectTmpObj.pCoords[0] +
              secondIntersectTmpObj.pCoords[1]);
          pcoords[1] = 1 - secondIntersectTmpObj.pCoords[1];
          pcoords[2] = secondIntersectTmpObj.pCoords[2];
        }

        break;
      case 1:
        points.setPoint(0, ...point0);
        points.setPoint(1, ...point1);
        points.setPoint(2, ...point3);
        firstIntersect = model.triangle.intersectWithLine(
          p1,
          p2,
          tol,
          firstIntersectTmpObj.x,
          firstIntersectTmpObj.pCoords
        );

        points.setPoint(0, ...point2);
        points.setPoint(1, ...point3);
        points.setPoint(2, ...point1);
        secondIntersect = model.triangle.intersectWithLine(
          p1,
          p2,
          tol,
          secondIntersectTmpObj.x,
          secondIntersectTmpObj.pCoords
        );

        useFirstIntersection =
          firstIntersect.intersect && secondIntersect.intersect
            ? firstIntersect.t <= secondIntersect.t
            : firstIntersect.intersect;

        useSecondIntersection =
          firstIntersect.intersect && secondIntersect.intersect
            ? secondIntersect.t < firstIntersect.t
            : secondIntersect.intersect;

        if (useFirstIntersection) {
          outObj = firstIntersect;
          x[0] = firstIntersectTmpObj.x[0];
          x[1] = firstIntersectTmpObj.x[1];
          x[2] = firstIntersectTmpObj.x[2];

          pcoords[0] = firstIntersectTmpObj.pCoords[0];
          pcoords[1] = firstIntersectTmpObj.pCoords[1];
          pcoords[2] = firstIntersectTmpObj.pCoords[2];
        } else if (useSecondIntersection) {
          outObj = secondIntersect;

          x[0] = secondIntersectTmpObj.x[0];
          x[1] = secondIntersectTmpObj.x[1];
          x[2] = secondIntersectTmpObj.x[2];
          pcoords[0] = 1 - secondIntersectTmpObj.pCoords[0];
          pcoords[1] = 1 - secondIntersectTmpObj.pCoords[1];
          pcoords[2] = secondIntersectTmpObj.pCoords[2];
        }
        break;
      default:
        break;
    }
    return outObj;
  };

  publicAPI.interpolationFunctions = (pcoords, weights) => {
    const rm = 1 - pcoords[0];
    const sm = 1 - pcoords[1];

    weights[0] = rm * sm;
    weights[1] = pcoords[0] * sm;
    weights[2] = pcoords[0] * pcoords[1];
    weights[3] = rm * pcoords[1];
  };

  publicAPI.evaluateLocation = (pcoords, x, weights) => {
    const point = [];

    // Calculate the weights
    publicAPI.interpolationFunctions(pcoords, weights);

    x[0] = 0.0;
    x[1] = 0.0;
    x[2] = 0.0;

    for (let i = 0; i < 4; i++) {
      model.points.getPoint(i, point);
      for (let j = 0; j < 3; j++) {
        x[j] += point[j] * weights[i];
      }
    }
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

  vtkQuad(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkQuad');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
