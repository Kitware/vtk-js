import macro            from 'vtk.js/Sources/macro';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';

// ----------------------------------------------------------------------------
// vtkCell methods
// ----------------------------------------------------------------------------

function vtkCell(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCell');

  publicAPI.initialize = (npts, pointIdsList, pointList) => {
    model.pointsIds = [];
    model.points = vtkPoints.newInstance();
    model.points.setNumberOfPoints(npts);
    const p = [];
    for (let i = 0; i < npts; i++) {
      pointList.getPoint(i, p);
      model.pointsIds.push(pointIdsList[i]);
      model.points.setPoint(i, p[0], p[1], p[2]);
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
        model.bounds[0] = (x[0] < model.bounds[0] ? x[0] : model.bounds[0]);
        model.bounds[1] = (x[0] > model.bounds[1] ? x[0] : model.bounds[1]);
        model.bounds[2] = (x[1] < model.bounds[2] ? x[1] : model.bounds[2]);
        model.bounds[3] = (x[1] > model.bounds[3] ? x[1] : model.bounds[3]);
        model.bounds[4] = (x[2] < model.bounds[4] ? x[2] : model.bounds[4]);
        model.bounds[5] = (x[2] > model.bounds[5] ? x[2] : model.bounds[5]);
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
      diff = model.bounds[(2 * i) + 1] - model.bounds[2 * i];
      length += diff * diff;
    }
    return length;
  };

  publicAPI.getNumberOfPoints = () => model.points.getNumberOfPoints();

  publicAPI.getCellDimension = () => {}; // virtual
  publicAPI.intersectWithLine = (p1, p2, tol, t, x, pcoords, subId) => {}; // virtual
  publicAPI.evaluatePosition = (x, closestPoint, subId, pcoords, dist2, weights) => {}; // virtual
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

  model.points = vtkPoints.newInstance();

  macro.get(publicAPI, macro, ['points', 'pointsIds']);

  vtkCell(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCell');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
