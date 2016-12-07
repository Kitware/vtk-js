import * as macro   from '../../../macro';
import vtkImageData from '../../../Common/DataModel/ImageData';
import vtkDataArray from '../../../Common/Core/DataArray';

// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------

export function vtkConstVectorSource(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkConstVectorSource');

  function requestData(inData, outData) {
    if (model.deleted) {
      return;
    }

    let dataset = outData[0];
    if (!dataset || dataset.getMTime() < model.mtime) {
      const state = {};
      dataset = {
        type: 'vtkImageData',
        mtime: model.mtime,
        metadata: {
          source: 'vtkConstVectorSource',
          state,
        },
      };

      // Add parameter used to create dataset as metadata.state[*]
      ['dataSpacing', 'dataOrigin'].forEach((field) => {
        state[field] = [].concat(model[field]);
      });

      const id = vtkImageData.newInstance(dataset);
      id.setOrigin(model.dataOrigin[0], model.dataOrigin[1], model.dataOrigin[2]);
      id.setSpacing(model.dataSpacing[0], model.dataSpacing[1], model.dataSpacing[2]);
      id.setExtent.apply(this, model.dataExtent);

      let dims = [0, 0, 0];
      dims = dims.map((_, i) => model.dataExtent[(i * 2) + 1] - model.dataExtent[i * 2] + 1);

      const newArray = new Float32Array(3 * dims[0] * dims[1] * dims[2]);

      let i = 0;
      for (let z = model.dataExtent[4]; z <= model.dataExtent[5]; z++) {
        for (let y = model.dataExtent[2]; y <= model.dataExtent[3]; y++) {
          for (let x = model.dataExtent[0]; x <= model.dataExtent[1]; x++) {
            // newArray[i++] = 1;
            // newArray[i++] = 2;
            newArray[i++] = model.dataOrigin[0] + (model.dataSpacing[0] * x);
            const v = model.dataOrigin[1] + (model.dataSpacing[1] * y);
            newArray[i++] = (v * v) * 10.0;
            newArray[i++] = 0;
          }
        }
      }

      const da = vtkDataArray.newInstance({ numberOfComponents: 3, values: newArray });
      da.setName('scalars');

      const cpd = id.getPointData();
      cpd.setScalars(da);

      // Update output
      outData[0] = id;
    }
  }

  // Expose methods
  publicAPI.requestData = requestData;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  dataSpacing: [1.0, 1.0, 1.0],
  dataOrigin: [0.0, 0.0, 0.0],
  dataExtent: [0, 255, 0, 255, 0, 0],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  macro.setGetArray(publicAPI, model, [
    'dataOrigin',
    'dataSpacing',
  ], 3);

  macro.setGetArray(publicAPI, model, [
    'dataExtent',
  ], 6);

  macro.algo(publicAPI, model, 0, 1);
  vtkConstVectorSource(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
