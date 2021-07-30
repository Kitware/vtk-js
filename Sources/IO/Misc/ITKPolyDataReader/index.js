import macro from 'vtk.js/Sources/macros';
import vtk from 'vtk.js/Sources/vtk';

let readPolyDataArrayBuffer = null;
let resultPreprocessor = (result) => result;

function setReadPolyDataArrayBufferFromITK(fn) {
  readPolyDataArrayBuffer = fn;

  // first arg is a webworker if reuse is desired.
  readPolyDataArrayBuffer = (...args) => fn(null, ...args);

  // an object is now passed out which includes a webworker which we
  // should terminate
  resultPreprocessor = ({ webWorker, polyData }) => {
    webWorker.terminate();
    return polyData;
  };
}

// ----------------------------------------------------------------------------
// vtkITKPolyDataReader methods
// ----------------------------------------------------------------------------

function vtkITKPolyDataReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkITKPolyDataReader');

  // Returns a promise to signal when polyData is ready
  publicAPI.parseAsArrayBuffer = (arrayBuffer) => {
    if (!arrayBuffer || arrayBuffer === model.rawDataBuffer) {
      return Promise.resolve();
    }

    model.rawDataBuffer = arrayBuffer;

    return readPolyDataArrayBuffer(arrayBuffer, model.fileName)
      .then(resultPreprocessor)
      .then((polyData) => {
        model.output[0] = vtk(polyData);

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

  // vtkITKPolyDataReader methods
  vtkITKPolyDataReader(publicAPI, model);

  // Check that ITK function has been injected
  if (!readPolyDataArrayBuffer) {
    console.error(`
      // Dependency needs to be added inside your project
      import readPolyDataArrayBuffer from 'itk/readPolyDataArrayBuffer';
      vtkITKPolyDataReader.setReadPolyDataArrayBufferFromITK(readPolyDataArrayBuffer);
      `);
  }
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkITKPolyDataReader');

// ----------------------------------------------------------------------------

export default { newInstance, extend, setReadPolyDataArrayBufferFromITK };
