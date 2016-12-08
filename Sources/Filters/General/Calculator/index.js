import * as macro from '../../../macro';
import vtkDataArray from '../../../Common/Core/DataArray';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// vtkCalculator methods
// ----------------------------------------------------------------------------

function vtkCalculator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkCalculator');

  publicAPI.requestData = (inData, outData) => { // implement requestData
    if (!outData[0] || inData[0].getMTime() > outData[0].getMTime()) {
      const newArray = new Float32Array(inData[0].getPoints().getNumberOfTuples());

      /* eslint-disable no-new-func */
      const func = new Function('index', 'points', 'pd', `return ${model.function}`);
      /* eslint-enable no-new-func */
      const points = inData[0].getPoints();
      const pointData = inData[0].getPointsData();
      for (let i = 0; i < newArray.length; i++) {
        newArray[i] = func(i, points, pointData);
      }

      const da = vtkDataArray.newInstance({ values: newArray });
      da.setName(model.arrayName);

      const outDS = inData[0].shallowCopy();
      outDS.getPointData().addArray(da);
      outDS.getPointData().setActiveScalars(da.getName());

      outData[0] = outDS;
    }

    return 1;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  arrayName: 'Result',
  function: '0',
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 1, 1);

  // Generate macros for properties
  macro.setGet(publicAPI, model, [
    'arrayName',
    'function',
  ]);

  // Object specific methods
  vtkCalculator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWarpScalar');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
