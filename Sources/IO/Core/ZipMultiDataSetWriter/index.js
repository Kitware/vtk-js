import { zipSync } from 'fflate';

import macro from 'vtk.js/Sources/macros';
import vtkSerializer from 'vtk.js/Sources/IO/Core/Serializer';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkAppendPolyData methods
// ----------------------------------------------------------------------------

function vtkZipMultiDataSetWriter(publicAPI, model) {
  // Set our classname
  model.classHierarchy.push('vtkZipMultiDataSetWriter');

  publicAPI.requestData = (inData, outData) => {
    // implement requestData
    const numberOfInputs = publicAPI.getNumberOfInputPorts();
    if (!numberOfInputs) {
      vtkErrorMacro('No input specified.');
      return;
    }

    // Default array handler
    const arrayHandler = vtkSerializer.vtkArraySerializer.newInstance();
    model.datasets = [];
    for (let i = 0; i < numberOfInputs; i++) {
      const ds = inData[i];
      const serializer = vtkSerializer.getSerializer(ds);
      if (serializer) {
        model.datasets.push(serializer.serialize(ds, arrayHandler));
      } else {
        console.error('Could not find serializer for', ds.getClassName());
      }
    }
    model.arrays = arrayHandler.arrays;
  };

  publicAPI.write = () => {
    publicAPI.update();

    const zipInfo = Object.create(null);

    // Write metadata
    zipInfo['datasets.json'] = JSON.stringify(model.datasets);

    // Write Arrays
    for (let i = 0; i < model.arrays.length; i++) {
      zipInfo[`array_${vtkDataArray.getDataType(model.arrays[i])}_${i}`] =
        model.arrays[i];
    }

    model.blob = new Blob([zipSync(zipInfo)]);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  compressionLevel: 6,
  blob: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 1, 0);
  macro.setGet(publicAPI, model, ['compressionLevel']);
  macro.get(publicAPI, model, ['blob']);

  // Object specific methods
  vtkZipMultiDataSetWriter(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkZipMultiDataSetWriter'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
