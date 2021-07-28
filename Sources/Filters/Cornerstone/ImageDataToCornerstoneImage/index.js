import macro from 'vtk.js/Sources/macros';

const { vtkErrorMacro } = macro;

// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// TODO:
// - Support image stack
// - Support slice orientation (see stack?)
// - may need some data conversion
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

// ----------------------------------------------------------------------------
// vtkImageDataToCornerstoneImage methods
// ----------------------------------------------------------------------------

function vtkImageDataToCornerstoneImage(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageDataToCornerstoneImage');

  publicAPI.requestData = (inData, outData) => {
    // implement requestData
    const input = inData[0];

    if (!input) {
      vtkErrorMacro('Invalid or missing input');
      return;
    }

    // Retrieve output and volume data
    // const origin = input.getOrigin();
    const spacing = input.getSpacing();
    const dims = input.getDimensions();
    const scalars = input.getPointData().getScalars();
    const dataRange = scalars.getRange(0);
    const rawData = scalars.getData();

    // FIXME probably need to expand to RGBA
    let pixelData = null;
    if (dims[2] === 1) {
      pixelData = !scalars.data ? rawData : scalars.data;
    } else {
      const offset =
        model.sliceIndex * dims[0] * dims[1] * rawData.BYTES_PER_ELEMENT;
      pixelData = macro.newTypedArray(
        scalars.getDataType(),
        rawData.buffer,
        offset,
        dims[0] * dims[1]
      );
    }

    const cornerstoneImage = {
      imageId: model.imageId,
      color: scalars.getNumberOfComponents() > 1,

      columnPixelSpacing: spacing[0],
      columns: dims[0],
      width: dims[0],

      rowPixelSpacing: spacing[1],
      rows: dims[1],
      height: dims[1],

      intercept: 0,
      invert: false,
      minPixelValue: dataRange[0],
      maxPixelValue: dataRange[1],

      sizeInBytes: pixelData.length * pixelData.BYTES_PER_ELEMENT,
      slope: 1,

      windowCenter: Math.round((dataRange[0] + dataRange[1]) / 2),
      windowWidth: dataRange[1] - dataRange[0],
      decodeTimeInMS: 0,

      getPixelData() {
        return pixelData;
      },
    };

    outData[0] = cornerstoneImage;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  imageId: 'default-image-id',
  sliceIndex: 0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 1, 1);

  macro.setGet(publicAPI, model, ['imageId', 'sliceIndex']);

  // Object specific methods
  macro.algo(publicAPI, model, 1, 1);
  vtkImageDataToCornerstoneImage(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkImageDataToCornerstoneImage'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
