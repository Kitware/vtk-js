import macro from 'vtk.js/Sources/macro';
import ITKHelper from 'vtk.js/Sources/Common/DataModel/ITKHelper';

const { convertItkToVtkImage } = ITKHelper;
let readImageArrayBuffer = null;
let resultPreprocessor = (result) => result;

function getArrayName(filename) {
  const idx = filename.lastIndexOf('.');
  const name = idx > -1 ? filename.substring(0, idx) : filename;
  return `Scalars ${name}`;
}

function setReadImageArrayBufferFromITK(fn) {
  readImageArrayBuffer = fn;

  // itk.js 9.0.0 introduced breaking changes, which can be detected
  // by an updated function signature.
  if (readImageArrayBuffer.length === 4) {
    // first arg is a webworker if reuse is desired.
    readImageArrayBuffer = (...args) => fn(null, ...args);

    // an object is now passed out which includes a webworker which we
    // should terminate
    resultPreprocessor = ({ webWorker, image }) => {
      webWorker.terminate();
      return image;
    };
  }
}

// ----------------------------------------------------------------------------
// vtkITKImageReader methods
// ----------------------------------------------------------------------------

function vtkITKImageReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkITKImageReader');

  // Returns a promise to signal when image is ready
  publicAPI.parseAsArrayBuffer = (arrayBuffer) => {
    if (!arrayBuffer || arrayBuffer === model.rawDataBuffer) {
      return Promise.resolve();
    }

    model.rawDataBuffer = arrayBuffer;

    return readImageArrayBuffer(arrayBuffer, model.fileName)
      .then(resultPreprocessor)
      .then((itkImage) => {
        const imageData = convertItkToVtkImage(itkImage, {
          scalarArrayName: model.arrayName || getArrayName(model.fileName),
        });
        model.output[0] = imageData;

        publicAPI.modified();
      });
  };

  publicAPI.requestData = (inData, outData) => {
    publicAPI.parseAsArrayBuffer(model.rawDataBuffer, model.fileName);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  fileName: '',
  // If null/undefined a unique array will be generated
  arrayName: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.algo(publicAPI, model, 0, 1);
  macro.setGet(publicAPI, model, ['fileName', 'arrayName']);

  // vtkITKImageReader methods
  vtkITKImageReader(publicAPI, model);

  // Check that ITK function has been injected
  if (!readImageArrayBuffer) {
    console.error(`
      // Dependency needs to be added inside your project
      import readImageArrayBuffer from 'itk/readImageArrayBuffer';
      vtkITKImageReader.setReadImageArrayBufferFromITK(readImageArrayBuffer);
      `);
  }
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkITKImageReader');

// ----------------------------------------------------------------------------

export default { newInstance, extend, setReadImageArrayBufferFromITK };
