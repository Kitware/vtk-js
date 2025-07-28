import macro from 'vtk.js/Sources/macros';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';

// ----------------------------------------------------------------------------
// vtkTorusSource methods
// Adapted from three.js TorusGeometry
// ----------------------------------------------------------------------------

const TAU = Math.PI * 2;

function vtkTorusSource(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTorusSource');

  function requestData(inData, outData) {
    let dataset = outData[0];

    // Points
    const points = macro.newTypedArray(
      model.pointType,
      3 * (model.resolution + 1) * (model.tubeResolution + 1)
    );
    let pointIdx = 0;

    for (let ti = 0; ti <= model.tubeResolution; ti++) {
      const v = (ti / model.tubeResolution) * TAU;
      const cosV = Math.cos(v);
      const sinV = Math.sin(v);
      for (let ri = 0; ri <= model.resolution; ri++) {
        const u = (ri / model.resolution) * model.arcLength;
        points[pointIdx++] =
          (model.radius + model.tubeRadius * cosV) * Math.cos(u);
        points[pointIdx++] =
          (model.radius + model.tubeRadius * cosV) * Math.sin(u);
        points[pointIdx++] = model.tubeRadius * sinV;
      }
    }

    // Cells
    const cellArraySize = 4 * 2 * (model.resolution * model.tubeResolution);
    let cellLocation = 0;
    const polys = new Uint32Array(cellArraySize);

    for (let ti = 1; ti <= model.tubeResolution; ti++) {
      for (let ri = 1; ri <= model.resolution; ri++) {
        const a = (model.resolution + 1) * ti + ri - 1;
        const b = (model.resolution + 1) * (ti - 1) + ri - 1;
        const c = (model.resolution + 1) * (ti - 1) + ri;
        const d = (model.resolution + 1) * ti + ri;

        polys[cellLocation++] = 3;
        polys[cellLocation++] = a;
        polys[cellLocation++] = b;
        polys[cellLocation++] = d;

        polys[cellLocation++] = 3;
        polys[cellLocation++] = b;
        polys[cellLocation++] = c;
        polys[cellLocation++] = d;
      }
    }

    // Apply transformation to the points coordinates
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
  radius: 0.5,
  tubeRadius: 0.01,
  resolution: 64,
  tubeResolution: 64,
  arcLength: TAU,
  center: [0, 0, 0],
  direction: [1.0, 0.0, 0.0],
  pointType: 'Float64Array',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, [
    'radius',
    'tubeRadius',
    'resolution',
    'tubeResolution',
    'arcLength',
  ]);
  macro.setGetArray(publicAPI, model, ['center', 'direction'], 3);
  macro.algo(publicAPI, model, 0, 1);
  vtkTorusSource(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkTorusSource');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
