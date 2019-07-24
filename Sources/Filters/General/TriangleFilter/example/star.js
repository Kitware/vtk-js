import macro from 'vtk.js/Sources/macro';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

// ----------------------------------------------------------------------------
// vtkStar methods
// ----------------------------------------------------------------------------

function vtkStar(publicAPI, model) {
  // Set our classname
  model.classHierarchy.push('vtkStar');

  publicAPI.requestData = (inData, outData) => {
    const dataset = vtkPolyData.newInstance();

    const points = new Float32Array(10 * 3);
    const edges = new Uint32Array(12);
    edges[0] = 11;
    edges[11] = 0;
    for (let i = 0; i < 10; i++) {
      const radius = i % 2 === 1 ? 2 : 0.8;
      points[3 * i + 0] = radius * Math.cos(((2 * i - 1) * Math.PI) / 10);
      points[3 * i + 1] = radius * Math.sin(((2 * i - 1) * Math.PI) / 10);
      points[3 * i + 2] = 0;

      edges[1 + i] = i;
    }

    dataset.getPoints().setData(points, 3);
    dataset.getPolys().setData(edges, 1);

    outData[0] = dataset;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.algo(publicAPI, model, 0, 1);
  vtkStar(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkStar');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
