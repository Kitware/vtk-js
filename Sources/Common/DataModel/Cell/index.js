import macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';

// ----------------------------------------------------------------------------
// vtkCell methods
// ----------------------------------------------------------------------------

function vtkCell(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCell');

  publicAPI.initialize = (points, pointIdsList = null) => {
    if (!pointIdsList) {
      model.points = points;
      model.pointsIds = new Array(points.getNumberOfPoints());
      for (let i = points.getNumberOfPoints() - 1; i >= 0; --i) {
        model.pointsIds[i] = i;
      }
    } else {
      model.pointsIds = pointIdsList;
      let triangleData = model.points.getData();
      if (triangleData.length !== 3 * model.pointsIds.length) {
        triangleData = macro.newTypedArray(
          points.getDataType(),
          3 * model.pointsIds.length
        );
      }
      const pointsData = points.getData();
      model.pointsIds.forEach((pointId, index) => {
        // const start = 3 * pointId;
        // pointsData.set(p.subarray(start, start + 3), 3 * index);
        let pointOffset = 3 * pointId;
        let trianglePointOffset = 3 * index;
        triangleData[trianglePointOffset] = pointsData[pointOffset];
        triangleData[++trianglePointOffset] = pointsData[++pointOffset];
        triangleData[++trianglePointOffset] = pointsData[++pointOffset];
      });
      model.points.setData(triangleData);
    }
  };

  publicAPI.getBounds = () => {
    const nbPoints = model.points.getNumberOfPoints();
    const x = [];
    if (nbPoints) {
      model.points.getPoint(0, x);
      model.bounds[0] = x[0];
      model.bounds[1] = x[0];
      model.bounds[2] = x[1];
      model.bounds[3] = x[1];
      model.bounds[4] = x[2];
      model.bounds[5] = x[2];

      for (let i = 1; i < nbPoints; i++) {
        model.points.getPoint(i, x);
        model.bounds[0] = x[0] < model.bounds[0] ? x[0] : model.bounds[0];
        model.bounds[1] = x[0] > model.bounds[1] ? x[0] : model.bounds[1];
        model.bounds[2] = x[1] < model.bounds[2] ? x[1] : model.bounds[2];
        model.bounds[3] = x[1] > model.bounds[3] ? x[1] : model.bounds[3];
        model.bounds[4] = x[2] < model.bounds[4] ? x[2] : model.bounds[4];
        model.bounds[5] = x[2] > model.bounds[5] ? x[2] : model.bounds[5];
      }
    } else {
      vtkMath.uninitializeBounds(model.bounds);
    }
    return model.bounds;
  };

  publicAPI.getLength2 = () => {
    publicAPI.getBounds();
    let length = 0.0;
    let diff = 0;
    for (let i = 0; i < 3; i++) {
      diff = model.bounds[2 * i + 1] - model.bounds[2 * i];
      length += diff * diff;
    }
    return length;
  };

  publicAPI.getParametricDistance = (pcoords) => {
    let pDist;
    let pDistMax = 0.0;

    for (let i = 0; i < 3; i++) {
      if (pcoords[i] < 0.0) {
        pDist = -pcoords[i];
      } else if (pcoords[i] > 1.0) {
        pDist = pcoords[i] - 1.0;
      } else {
        // inside the cell in the parametric direction
        pDist = 0.0;
      }
      if (pDist > pDistMax) {
        pDistMax = pDist;
      }
    }
    return pDistMax;
  };

  publicAPI.getNumberOfPoints = () => model.points.getNumberOfPoints();

  publicAPI.deepCopy = (cell) => {
    cell.initialize(model.points, model.pointsIds);
  };

  publicAPI.getCellDimension = () => {}; // virtual
  publicAPI.intersectWithLine = (p1, p2, tol, t, x, pcoords, subId) => {}; // virtual
  publicAPI.evaluatePosition = (
    x,
    closestPoint,
    subId,
    pcoords,
    dist2,
    weights
  ) => {
    macro.vtkErrorMacro('vtkCell.evaluatePosition is not implemented.');
  }; // virtual
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  bounds: [-1, -1, -1, -1, -1, -1],
  pointsIds: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);

  if (!model.points) {
    model.points = vtkPoints.newInstance();
  }

  macro.get(publicAPI, model, ['points', 'pointsIds']);

  vtkCell(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCell');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
