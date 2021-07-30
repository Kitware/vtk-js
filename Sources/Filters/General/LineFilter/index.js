import macro from 'vtk.js/Sources/macros';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

// ----------------------------------------------------------------------------
// vtkLineFilter methods
// ----------------------------------------------------------------------------

function vtkLineFilter(publicAPI, model) {
  // Set our classname
  model.classHierarchy.push('vtkLineFilter');

  publicAPI.requestData = (inData, outData) => {
    const dataset = vtkPolyData.newInstance();

    dataset.getPoints().setData(inData[0].getPoints().getData());
    dataset.getLines().setData(inData[0].getLines().getData());

    outData[0] = dataset;
  };
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.setGet(publicAPI, model, []);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 1, 1);

  // Object specific methods
  vtkLineFilter(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkLineFilter');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
