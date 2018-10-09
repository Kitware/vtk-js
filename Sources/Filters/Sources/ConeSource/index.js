import macro from 'vtk.js/Sources/macro';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';

// ----------------------------------------------------------------------------
// vtkConeSource methods
// ----------------------------------------------------------------------------

function vtkConeSource(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkConeSource');

  function requestData(inData, outData) {
    if (model.deleted) {
      return;
    }

    let dataset = outData[0];

    const angle = (2 * Math.PI) / model.resolution;
    const xbot = -model.height / 2.0;
    const numberOfPoints = model.resolution + 1;
    const cellArraySize = 4 * model.resolution + 1 + model.resolution;

    // Points
    let pointIdx = 0;
    const points = new window[model.pointType](numberOfPoints * 3);

    // Cells
    let cellLocation = 0;
    const polys = new Uint32Array(cellArraySize);

    // Add summit point
    points[0] = model.height / 2.0;
    points[1] = 0.0;
    points[2] = 0.0;

    // Create bottom cell
    if (model.capping) {
      polys[cellLocation++] = model.resolution;
    }

    // Add all points
    for (let i = 0; i < model.resolution; i++) {
      pointIdx++;
      points[pointIdx * 3 + 0] = xbot;
      points[pointIdx * 3 + 1] = model.radius * Math.cos(i * angle);
      points[pointIdx * 3 + 2] = model.radius * Math.sin(i * angle);

      // Add points to bottom cell in reverse order
      if (model.capping) {
        polys[model.resolution - cellLocation++ + 1] = pointIdx;
      }
    }

    // Add all triangle cells
    for (let i = 0; i < model.resolution; i++) {
      polys[cellLocation++] = 3;
      polys[cellLocation++] = 0;
      polys[cellLocation++] = i + 1;
      polys[cellLocation++] = i + 2 > model.resolution ? 1 : i + 2;
    }

    // Apply tranformation to the points coordinates
    vtkMatrixBuilder
      .buildFromRadian()
      .translate(...model.center)
      .rotateFromDirections([1, 0, 0], model.direction)
      .apply(points);

    dataset = vtkPolyData.newInstance();
    dataset.getPoints().setData(points, 3);
    dataset.getPolys().setData(polys, 1);

    // Update output
    outData[0] = dataset;
  }

  // Expose methods
  publicAPI.requestData = requestData;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  height: 1.0,
  radius: 0.5,
  resolution: 6,
  center: [0, 0, 0],
  direction: [1.0, 0.0, 0.0],
  capping: true,
  pointType: 'Float32Array',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['height', 'radius', 'resolution', 'capping']);
  macro.setGetArray(publicAPI, model, ['center', 'direction'], 3);
  macro.algo(publicAPI, model, 0, 1);
  vtkConeSource(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkConeSource');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
