import macro from 'vtk.js/Sources/macro';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkFastScalarToRGBA methods
// ----------------------------------------------------------------------------

// this is faster than vtkScalarToRGBA since we are using indexed LUT and pwf
function vtkFastScalarToRGBA(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkFastScalarToRGBA');

  const lut = {};

  publicAPI.addColor = (index, color) => {
    const extra = Array(4 - color.length).fill(1);
    const c = [].concat(color, extra);
    c[0] *= 255;
    c[1] *= 255;
    c[2] *= 255;
    c[3] *= 255;
    lut[index] = c;
    publicAPI.modified();
  };

  publicAPI.getColor = (index) => {
    if (index in lut) {
      const c = lut[index].slice();
      c[0] /= 255;
      c[1] /= 255;
      c[2] /= 255;
      c[3] /= 255;
      return c;
    }
    return null;
  };

  publicAPI.requestData = (inData, outData) => {
    // implement requestData
    const input = inData[0];

    if (!input) {
      vtkErrorMacro('Invalid or missing input');
      return;
    }

    const scalars = input.getPointData().getScalars();

    if (!scalars) {
      vtkErrorMacro('No scalars from input');
      return;
    }

    const data = scalars.getData();
    const rgbaArray = new Uint8Array(data.length * 4);
    let offset = 0;
    for (let idx = 0; idx < data.length; idx++) {
      const rgba = lut[data[idx]];
      rgbaArray[offset++] = rgba[0];
      rgbaArray[offset++] = rgba[1];
      rgbaArray[offset++] = rgba[2];
      rgbaArray[offset++] = rgba[3];
    }

    const colorArray = vtkDataArray.newInstance({
      name: 'rgba',
      numberOfComponents: 4,
      values: rgbaArray,
    });
    const datasetDefinition = input.get(
      'extent',
      'spacing',
      'origin',
      'direction'
    );
    const output = vtkImageData.newInstance(datasetDefinition);
    output.getPointData().setScalars(colorArray);

    outData[0] = output;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 1, 1);

  // Object specific methods
  vtkFastScalarToRGBA(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkFastScalarToRGBA');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
