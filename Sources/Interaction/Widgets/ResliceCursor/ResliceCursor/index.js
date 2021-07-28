import macro from 'vtk.js/Sources/macros';

import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import { CenterProjectionType } from 'vtk.js/Sources/Interaction/Widgets/ResliceCursor/ResliceCursor/Constants';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkResliceCursor methods
// ----------------------------------------------------------------------------

function vtkResliceCursor(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkResliceCursor');

  const superClass = { ...publicAPI };

  function projectCenterToFitBounds(center, bounds) {
    if (
      center[0] >= bounds[0] &&
      center[0] <= bounds[1] &&
      center[1] >= bounds[2] &&
      center[1] <= bounds[3] &&
      center[2] >= bounds[4] &&
      center[2] <= bounds[5]
    ) {
      return center;
    }

    center[0] = vtkMath.clampValue(center[0], bounds[0], bounds[1]);
    center[1] = vtkMath.clampValue(center[1], bounds[2], bounds[3]);
    center[2] = vtkMath.clampValue(center[2], bounds[4], bounds[5]);

    return center;
  }
  //----------------------------------------------------------------------------
  // Public API methods
  //----------------------------------------------------------------------------

  publicAPI.buildCursorTopology = () => {
    for (let i = 0; i < 3; ++i) {
      // Set number of points
      model.centerlinesAxis[i].getPoints().setNumberOfPoints(2);

      // Define polys
      const cellsData = new Float32Array(3);
      const cells = vtkCellArray.newInstance({
        values: cellsData,
      });
      cellsData[0] = 2;
      cellsData[1] = 0;
      cellsData[2] = 1;
      model.centerlinesAxis[i].setLines(cells);
    }
  };

  publicAPI.buildCursorGeometry = () => {
    publicAPI.computeAxes();
    const bounds = model.image.getBounds();

    // Length of the principal diagonal.
    const pdLength =
      20 *
      0.5 *
      Math.sqrt(
        (bounds[1] - bounds[0]) * (bounds[1] - bounds[0]) +
          (bounds[3] - bounds[2]) * (bounds[3] - bounds[2]) +
          (bounds[5] - bounds[4]) * (bounds[5] - bounds[4])
      );

    // Precompute prior to use within the loop.
    const pts = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];

    for (let i = 0; i < 3; i++) {
      pts[0][i] = model.center[i] - pdLength * model.xAxis[i];
      pts[1][i] = model.center[i] + pdLength * model.xAxis[i];
      pts[2][i] = model.center[i] - pdLength * model.yAxis[i];
      pts[3][i] = model.center[i] + pdLength * model.yAxis[i];
      pts[4][i] = model.center[i] - pdLength * model.zAxis[i];
      pts[5][i] = model.center[i] + pdLength * model.zAxis[i];
    }

    for (let j = 0; j < 3; j++) {
      const points = model.centerlinesAxis[j].getPoints();
      const pointsData = points.getData();

      pointsData[0] = pts[2 * j][0];
      pointsData[1] = pts[2 * j][1];
      pointsData[2] = pts[2 * j][2];

      pointsData[3] = pts[2 * j + 1][0];
      pointsData[4] = pts[2 * j + 1][1];
      pointsData[5] = pts[2 * j + 1][2];

      model.centerlinesAxis[j].modified();
    }

    model.polyDataBuildTime.modified();
  };

  publicAPI.computeAxes = () => {
    const normals = [];

    for (let i = 0; i < 3; ++i) {
      normals[i] = publicAPI.getPlane(i).getNormal();
    }

    vtkMath.cross(normals[0], normals[1], model.zAxis);
    vtkMath.cross(normals[1], normals[2], model.xAxis);
    vtkMath.cross(normals[2], normals[0], model.yAxis);

    vtkMath.normalize(model.xAxis);
    vtkMath.normalize(model.yAxis);
    vtkMath.normalize(model.zAxis);
  };

  // Reset cursor to its initial position
  publicAPI.reset = () => {
    model.xAxis = [1, 0, 0];
    model.yAxis = [0, 1, 0];
    model.zAxis = [0, 0, 1];
    model.xViewUp = [0, 0, 1];
    model.yViewUp = [0, 0, 1];
    model.zViewUp = [0, -1, 0];

    if (publicAPI.getImage()) {
      model.center = publicAPI.getImage().getCenter();
    } else {
      model.center = [0, 0, 0];
    }

    for (let i = 0; i < 3; ++i) {
      publicAPI.getPlane(i).setOrigin(model.center);
    }

    model.reslicePlanes[0].setNormal([1, 0, 0]);
    model.reslicePlanes[1].setNormal([0, -1, 0]);
    model.reslicePlanes[2].setNormal([0, 0, 1]);

    publicAPI.buildCursorTopology();
    publicAPI.buildCursorGeometry();
  };

  publicAPI.getPlane = (i) => model.reslicePlanes[i];

  publicAPI.update = () => {
    if (!publicAPI.getImage()) {
      vtkErrorMacro('Image not set! ');
      return;
    }

    if (publicAPI.getMTime() > model.polyDataBuildTime.getMTime()) {
      publicAPI.buildCursorTopology();
      publicAPI.buildCursorGeometry();
    }
  };

  publicAPI.getPolyData = () => {
    publicAPI.update();
    return model.polyData;
  };

  publicAPI.setCenter = (
    center,
    centerProjectionType = CenterProjectionType.INSIDE_BOUNDS
  ) => {
    if (
      model.center[0] === center[0] &&
      model.center[1] === center[1] &&
      model.center[2] === center[2]
    ) {
      return;
    }

    if (model.image) {
      const bounds = model.image.getBounds();
      let newCenter = [...center];

      if (
        centerProjectionType === CenterProjectionType.INSIDE_BOUNDS &&
        (newCenter[0] < bounds[0] ||
          newCenter[0] > bounds[1] ||
          newCenter[1] < bounds[2] ||
          newCenter[1] > bounds[3] ||
          newCenter[2] < bounds[4] ||
          newCenter[2] > bounds[5])
      ) {
        return;
      }
      if (centerProjectionType === CenterProjectionType.FIT_BOUNDS) {
        newCenter = projectCenterToFitBounds(newCenter, bounds);

        if (newCenter.length !== 3) {
          return;
        }
      }

      model.center = newCenter;

      publicAPI.getPlane(0).setOrigin(model.center);
      publicAPI.getPlane(1).setOrigin(model.center);
      publicAPI.getPlane(2).setOrigin(model.center);

      publicAPI.modified();
    }
  };

  publicAPI.getCenterlineAxisPolyData = (axis) => {
    publicAPI.update();
    return model.centerlinesAxis[axis];
  };

  publicAPI.getAxis = (i) => {
    if (i === 0) {
      return model.xAxis;
    }
    if (i === 1) {
      return model.yAxis;
    }

    return model.zAxis;
  };

  publicAPI.getViewUp = (i) => {
    if (i === 0) {
      return model.xViewUp;
    }
    if (i === 1) {
      return model.yViewUp;
    }

    return model.zViewUp;
  };

  publicAPI.getMTime = () => {
    let mTime = superClass.getMTime();

    for (let i = 0; i < 3; ++i) {
      const planeMTime = publicAPI.getPlane(i).getMTime();

      if (planeMTime > mTime) {
        mTime = planeMTime;
      }
    }

    return mTime;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  image: null,
  center: [0, 0, 0],
  xAxis: [1, 0, 0],
  yAxis: [0, 1, 0],
  zAxis: [0, 0, 1],
  xViewUp: [0, 0, 1],
  yViewUp: [0, 0, 1],
  zViewUp: [0, -1, 0],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['image']);
  macro.setGetArray(
    publicAPI,
    model,
    ['xAxis', 'yAxis', 'zAxis', 'xViewUp', 'yViewUp', 'zViewUp'],
    3
  );
  macro.getArray(publicAPI, model, ['center'], 3);

  model.reslicePlanes = [];
  model.centerlinesAxis = [];

  model.polyDataBuildTime = {};
  macro.obj(model.polyDataBuildTime);

  // Object methods
  vtkResliceCursor(publicAPI, model);

  for (let i = 0; i < 3; ++i) {
    model.reslicePlanes.push(vtkPlane.newInstance());
    model.centerlinesAxis.push(vtkPolyData.newInstance());
  }

  model.reslicePlanes[0].setNormal([1, 0, 0]);
  model.reslicePlanes[1].setNormal([0, -1, 0]);
  model.reslicePlanes[2].setNormal([0, 0, -1]);

  publicAPI.buildCursorTopology();
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkResliceCursor');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
