import macro from 'vtk.js/Sources/macros';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';

// ----------------------------------------------------------------------------

function vtkRTAnalyticSource(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkRTAnalyticSource');

  publicAPI.requestData = (inData, outData) => {
    if (model.deleted) {
      return;
    }

    const state = {};
    const dataset = {
      type: 'vtkImageData',
      mtime: model.mtime,
      metadata: {
        source: 'vtkRTAnalyticSource',
        state,
      },
    };

    // Add parameter used to create dataset as metadata.state[*]
    [
      'standardDeviation',
      'center',
      'frequency',
      'magnitude',
      'maximum',
    ].forEach((field) => {
      state[field] = [].concat(model[field]);
    });

    const id = vtkImageData.newInstance(dataset);

    id.setSpacing(1.0, 1.0, 1.0);
    id.setExtent.apply(this, model.wholeExtent);
    id.setOrigin(0.0, 0.0, 0.0);
    id.setDirection(model.dataDirection);

    let dims = [0, 0, 0];
    dims = dims.map(
      (_, i) => model.wholeExtent[i * 2 + 1] - model.wholeExtent[i * 2] + 1
    );

    const newArray = new Uint8Array(dims[0] * dims[1] * dims[2]);
    const temp2 =
      1.0 / (2.0 * model.standardDeviation * model.standardDeviation);

    let xval = 0;
    let yval = 0;
    let zval = 0;
    const scale = [
      1.0 / (model.wholeExtent[1] - model.wholeExtent[0]),
      1.0 / (model.wholeExtent[3] - model.wholeExtent[2]),
      1.0 / (model.wholeExtent[5] - model.wholeExtent[4]),
    ];

    let i = 0;
    for (let z = model.wholeExtent[4]; z <= model.wholeExtent[5]; z++) {
      zval = (model.center[2] - z) * scale[2];
      const zfactor = model.magnitude[2] * Math.cos(model.frequency[2] * zval);
      zval *= zval;
      for (let y = model.wholeExtent[2]; y <= model.wholeExtent[3]; y++) {
        yval = (model.center[1] - y) * scale[1];
        const yfactor =
          model.magnitude[1] * Math.sin(model.frequency[1] * yval);
        yval *= yval;
        for (let x = model.wholeExtent[0]; x <= model.wholeExtent[1]; x++) {
          xval = (model.center[0] - x) * scale[0];
          const sum = zval + yval + xval * xval;
          const xfactor =
            model.magnitude[0] * Math.sin(model.frequency[0] * xval);
          newArray[i] =
            model.maximum * Math.exp(-sum * temp2) +
            xfactor +
            yfactor +
            zfactor +
            model.offset;
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
  offset: 40,
  maximum: 120,
  center: [0, 0, 0],
  frequency: [60, 30, 40],
  magnitude: [10, 18, 5],
  standardDeviation: 0.5,
  wholeExtent: [-10, 10, -10, 10, -10, 10],
  dataDirection: [1, 0, 0, 0, 1, 0, 0, 0, 1],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  macro.setGet(publicAPI, model, ['offset', 'maximum', 'standardDeviation']);

  macro.setGetArray(publicAPI, model, ['center', 'frequency', 'magnitude'], 3);

  macro.setGetArray(publicAPI, model, ['wholeExtent'], 6);

  macro.setGetArray(publicAPI, model, ['dataDirection'], 9);

  macro.algo(publicAPI, model, 0, 1);
  vtkRTAnalyticSource(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkRTAnalyticSource');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
