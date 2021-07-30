import JSZip from 'jszip';

import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';
import macro from 'vtk.js/Sources/macros';

// Enable data soure for DataAccessHelper
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper';// Just need HTTP
import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper'; // HTTP + zip
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HtmlDataAccessHelper'; // html + base64 + zip
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/JSZipDataAccessHelper'; // zip

// ----------------------------------------------------------------------------
// vtkAppendPolyData methods
// ----------------------------------------------------------------------------

function vtkZipMultiDataSetReader(publicAPI, model) {
  // Set our classname
  model.classHierarchy.push('vtkZipMultiDataSetReader');

  // Create default dataAccessHelper if not available
  if (!model.dataAccessHelper) {
    model.dataAccessHelper = DataAccessHelper.get('http');
  }

  // Internal method to fetch Array
  function fetchData(url, option = {}) {
    return model.dataAccessHelper.fetchBinary(url, option);
  }

  // Set DataSet url
  publicAPI.setUrl = (url, option = {}) => {
    model.url = url;

    // Remove the file in the URL
    const path = url.split('/');
    path.pop();
    model.baseURL = path.join('/');

    // Fetch metadata
    return publicAPI.loadData(option);
  };

  // Fetch the actual data arrays
  publicAPI.loadData = (option = {}) =>
    fetchData(model.url, option).then(publicAPI.parseAsArrayBuffer);

  publicAPI.parseAsArrayBuffer = (arrayBuffer) => {
    if (!arrayBuffer) {
      return Promise.reject(new Error('No ArrayBuffer to parse'));
    }

    return new Promise((resolve, reject) => {
      model.arrays = [];
      const zip = new JSZip();
      zip
        .loadAsync(arrayBuffer)
        .then(() => {
          let processing = 0;
          zip.forEach((relativePath, zipEntry) => {
            if (relativePath.match(/datasets\.json$/i)) {
              processing++;
              zipEntry
                .async('string')
                .then((txt) => {
                  model.datasets = JSON.parse(txt);
                  processing--;
                  if (!processing) {
                    resolve();
                  }
                })
                .catch(reject);
            }
            if (relativePath.match(/array_[a-zA-Z]+_[0-9]+/)) {
              processing++;
              zipEntry.async('arraybuffer').then((arraybuffer) => {
                processing--;
                const [type, id] = relativePath.split('_').slice(-2);
                model.arrays[id] = macro.newTypedArray(type, arraybuffer);
                if (!processing) {
                  resolve();
                }
              });
            }
          });
        })
        .catch(reject);
    });
  };

  publicAPI.requestData = (inData, outData) => {
    // perform deserialization
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
  macro.algo(publicAPI, model, 0, 0);
  macro.get(publicAPI, model, ['url', 'baseURL']);
  macro.setGet(publicAPI, model, ['dataAccessHelper']);

  // Object specific methods
  vtkZipMultiDataSetReader(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkZipMultiDataSetReader'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
