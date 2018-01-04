import macro from 'vtk.js/Sources/macro';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';

// ----------------------------------------------------------------------------
// vtkImageGridSource methods
// ----------------------------------------------------------------------------

function vtkImageGridSource(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageGridSource');

  publicAPI.requestData = (inData, outData) => {
    if (model.deleted) {
      return;
    }

    const state = {};
    const dataset = {
      type: 'vtkImageData',
      mtime: model.mtime,
      metadata: {
        source: 'vtkImageGridSource',
        state,
      },
    };

    // Add parameter used to create dataset as metadata.state[*]
    ['gridSpacing', 'gridOrigin', 'dataSpacing', 'dataOrigin'].forEach(
      (field) => {
        state[field] = [].concat(model[field]);
      }
    );

    const id = vtkImageData.newInstance(dataset);
    id.setOrigin(model.dataOrigin[0], model.dataOrigin[1], model.dataOrigin[2]);
    id.setSpacing(
      model.dataSpacing[0],
      model.dataSpacing[1],
      model.dataSpacing[2]
    );
    id.setExtent.apply(this, model.dataExtent);
    id.setDirection(model.dataDirection);

    let dims = [0, 0, 0];
    dims = dims.map(
      (_, i) => model.dataExtent[i * 2 + 1] - model.dataExtent[i * 2] + 1
    );

    const newArray = new Uint8Array(dims[0] * dims[1] * dims[2]);

    let xval = 0;
    let yval = 0;
    let zval = 0;
    let i = 0;
    for (let z = model.dataExtent[4]; z <= model.dataExtent[5]; z++) {
      if (model.gridSpacing[2]) {
        zval = z % model.gridSpacing[2] === model.gridOrigin[2];
      } else {
        zval = 0;
      }
      for (let y = model.dataExtent[2]; y <= model.dataExtent[3]; y++) {
        if (model.gridSpacing[1]) {
          yval = y % model.gridSpacing[1] === model.gridOrigin[1];
        } else {
          yval = 0;
        }
        for (let x = model.dataExtent[0]; x <= model.dataExtent[1]; x++) {
          if (model.gridSpacing[0]) {
            xval = x % model.gridSpacing[0] === model.gridOrigin[0];
          } else {
            xval = 0;
          }
          newArray[i] =
            zval || yval || xval ? model.lineValue : model.fillValue;
          i++;
        }
      }
    }

    const da = vtkDataArray.newInstance({
      numberOfComponents: 1,
      values: newArray,
    });
    da.setName('scalars');

    const cpd = id.getPointData();
    cpd.setScalars(da);

    // Update output
    outData[0] = id;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  lineValue: 0,
  fillValue: 255,
  gridSpacing: [10, 10, 0],
  gridOrigin: [0, 0, 0],
  dataSpacing: [1.0, 1.0, 1.0],
  dataOrigin: [0.0, 0.0, 0.0],
  dataExtent: [0, 255, 0, 255, 0, 0],
  dataDirection: [1, 0, 0, 0, 1, 0, 0, 0, 1],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  macro.setGet(publicAPI, model, ['lineValue', 'fillValue']);

  macro.setGetArray(
    publicAPI,
    model,
    ['gridOrigin', 'gridSpacing', 'dataOrigin', 'dataSpacing'],
    3
  );

  macro.setGetArray(publicAPI, model, ['dataExtent'], 6);

  macro.setGetArray(publicAPI, model, ['dataDirection'], 9);

  macro.algo(publicAPI, model, 0, 1);
  vtkImageGridSource(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageGridSource');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
