import macro from 'vtk.js/Sources/macros';

// Enable data soure for DataAccessHelper
import 'vtk.js/Sources/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper'; // Just need HTTP
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper'; // HTTP + zip
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HtmlDataAccessHelper'; // html + base64 + zip
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/JSZipDataAccessHelper'; // zip

import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import UTIF from 'utif';

// ----------------------------------------------------------------------------
// vtkTIFFReader methods
// ----------------------------------------------------------------------------

function vtkTIFFReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkTIFFReader');

  // Create default dataAccessHelper if not available
  if (!model.dataAccessHelper) {
    model.dataAccessHelper = DataAccessHelper.get('http');
  }

  // Internal method to fetch Array
  function fetchData(url, option = {}) {
    const { compression, progressCallback } = model;
    return model.dataAccessHelper.fetchBinary(url, {
      compression,
      progressCallback,
    });
  }

  // Set DataSet url
  publicAPI.setUrl = (url, option = { binary: true }) => {
    model.url = url;

    // Remove the file in the URL
    const path = url.split('/');
    path.pop();
    model.baseURL = path.join('/');

    model.compression = option.compression;

    // Fetch metadata
    return publicAPI.loadData({
      progressCallback: option.progressCallback,
    });
  };

  // Fetch the actual data arrays
  publicAPI.loadData = (option = {}) => {
    const promise = fetchData(model.url, option);
    promise.then(publicAPI.parse);
    return promise;
  };

  publicAPI.parse = (content) => {
    publicAPI.parseAsArrayBuffer(content);
  };

  publicAPI.parseAsArrayBuffer = (content) => {
    if (!content) {
      return;
    }

    // Read Header
    const ifds = UTIF.decode(content);
    UTIF.decodeImage(content, ifds[0]);
    const data = UTIF.toRGBA8(ifds[0]);

    const width = ifds[0].width;
    const height = ifds[0].height;
    const output = new Uint8Array(data.length);

    if (model.flipY) {
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const srcIndex = (y * width + x) * 4;
          const destIndex = ((height - y - 1) * width + x) * 4;

          output[destIndex] = data[srcIndex]; // R
          output[destIndex + 1] = data[srcIndex + 1]; // G
          output[destIndex + 2] = data[srcIndex + 2]; // B
          output[destIndex + 3] = data[srcIndex + 3]; // A
        }
      }
    }

    const dataExtent = [0, width - 1, 0, height - 1];
    const dataSpacing = [1, 1, 1];

    const imageData = vtkImageData.newInstance();
    imageData.setDimensions(width, height, 1);
    imageData.setExtent(dataExtent);
    imageData.setSpacing(dataSpacing);

    const dataArray = vtkDataArray.newInstance({
      name: 'TIFFImage',
      numberOfComponents: 4,
      values: output,
    });

    imageData.getPointData().setScalars(dataArray);
    model.output[0] = imageData;
  };

  publicAPI.requestData = (inData, outData) => {
    publicAPI.parse(model.parseData);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  flipY: true,
  compression: null,
  progressCallback: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Make this a VTK object
  macro.obj(publicAPI, model);

  // Also make it an algorithm with one input and one output
  macro.algo(publicAPI, model, 0, 1);

  macro.get(publicAPI, model, ['url', 'baseURL']);
  macro.setGet(publicAPI, model, ['dataAccessHelper', 'flipY']);

  // Object specific methods
  vtkTIFFReader(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkTIFFReader');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
