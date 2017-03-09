// For vtk factory
import 'vtk.js/Sources/Common/DataModel/ImageData';
import 'vtk.js/Sources/Common/DataModel/PolyData';

import vtk              from 'vtk.js/Sources/vtk';
import macro            from 'vtk.js/Sources/macro';
import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';
import vtkDataArray     from 'vtk.js/Sources/Common/Core/DataArray';

const fieldDataLocations = ['pointData', 'cellData', 'fieldData'];

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

const GEOMETRY_ARRAYS = {
  vtkPolyData(dataset) {
    const arrayToDownload = [];
    arrayToDownload.push(dataset.points);
    ['verts', 'lines', 'polys', 'strips'].forEach((cellName) => {
      if (dataset[cellName]) {
        arrayToDownload.push(dataset[cellName]);
      }
    });

    return arrayToDownload;
  },

  vtkImageData(dataset) {
    return [];
  },

  vtkUnstructuredGrid(dataset) {
    const arrayToDownload = [];
    arrayToDownload.push(dataset.points);
    arrayToDownload.push(dataset.cells);
    arrayToDownload.push(dataset.cellTypes);

    return arrayToDownload;
  },

  vtkRectilinearGrid(dataset) {
    const arrayToDownload = [];
    arrayToDownload.push(dataset.xCoordinates);
    arrayToDownload.push(dataset.yCoordinates);
    arrayToDownload.push(dataset.zCoordinates);

    return arrayToDownload;
  },
};


// ----------------------------------------------------------------------------
// vtkHttpDataSetReader methods
// ----------------------------------------------------------------------------

export function vtkHttpDataSetReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkHttpDataSetReader');

  // Empty output by default
  model.output[0] = vtk({ vtkClass: 'vtkPolyData' });

  // Create default dataAccessHelper if not available
  if (!model.dataAccessHelper) {
    model.dataAccessHelper = DataAccessHelper.get('http');
  }

  // Internal method to fetch Array
  function fetchArray(array, fetchGzip = false) {
    return model.dataAccessHelper.fetchArray(publicAPI, model.baseURL, array, fetchGzip);
  }

  // Fetch dataset (metadata)
  publicAPI.updateMetadata = () =>
    new Promise((resolve, reject) => {
      model.dataAccessHelper
        .fetchJSON(publicAPI, model.url)
        .then(
          (dataset) => {
            const enable = model.enableArray;

            // Generate array list
            model.arrays = [];

            fieldDataLocations.forEach((location) => {
              if (dataset[location]) {
                dataset[location].arrays.map(i => i.data).forEach((array) => {
                  model.arrays.push({ name: array.name, enable, location, array, registration: array.ref.registration || 'addArray' });
                });

                // Reset data arrays
                dataset[location].arrays = [];
              }
            });

            // Fetch geometry arrays
            const pendingPromises = [];
            GEOMETRY_ARRAYS[dataset.vtkClass](dataset).forEach((array) => {
              pendingPromises.push(fetchArray(array, model.fetchGzip));
            });

            // Wait for all geometry array to be fetched
            if (pendingPromises.length) {
              Promise.all(pendingPromises)
                .then(
                  (ok) => {
                    model.dataset = vtk(dataset);
                    model.output[0] = model.dataset;
                    resolve(publicAPI, model.output[0]);
                  },
                  (err) => {
                    reject(err);
                  }
                );
            } else {
              model.dataset = vtk(dataset);
              model.output[0] = model.dataset;
              resolve(publicAPI, model.output[0]);
            }
          },
          (xhr, e) => {
            reject(xhr, e);
          }
        );
    });

  // Set DataSet url
  publicAPI.setUrl = (url) => {
    if (url.indexOf('index.json') === -1) {
      model.baseURL = url;
      model.url = `${url}/index.json`;
    } else {
      model.url = url;

      // Remove the file in the URL
      const path = url.split('/');
      path.pop();
      model.baseURL = path.join('/');
    }

    // Fetch metadata
    return publicAPI.updateMetadata();
  };

  // Fetch the actual data arrays
  publicAPI.loadData = () => {
    const datasetObj = model.dataset;
    const arrayToFecth = model.arrays
      .filter(array => array.enable)
      .filter(array => array.array.ref)
      .map(array => array.array);

    return new Promise((resolve, reject) => {
      const error = (xhr, e) => {
        reject(xhr, e);
      };

      const processNext = () => {
        if (arrayToFecth.length) {
          fetchArray(arrayToFecth.pop(), model.fetchGzip).then(processNext, error);
        } else {
          // Perform array registration
          model.arrays
            .filter(array => array.registration)
            .forEach((metaArray) => {
              datasetObj[`get${macro.capitalize(metaArray.location)}`]()[metaArray.registration](vtkDataArray.newInstance(metaArray.array));
              delete metaArray.registration;
            });
          datasetObj.modified();
          resolve(publicAPI, datasetObj);
        }
      };

      // Start processing queue
      processNext();
    });
  };


  publicAPI.requestData = (inData, outData) => {
    // do nothing loadData will eventually load up the data
  };

  // Toggle arrays to load
  publicAPI.enableArray = (location, name, enable = true) => {
    const activeArray = model.arrays.filter(array => array.name === name && array.location === location);
    if (activeArray.length === 1) {
      activeArray[0].enable = enable;
    }
  };

  // return Busy state
  publicAPI.isBusy = () => !!model.requestCount;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  enableArray: true,
  fetchGzip: false,
  arrays: [],
  url: null,
  baseURL: null,
  requestCount: 0,
  // dataAccessHelper: null,
};

// ----------------------------------------------------------------------------


export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, [
    'enableArray',
    'fetchGzip',
    'url',
    'baseURL',
    'dataAccessHelper',
  ]);
  macro.set(publicAPI, model, ['dataAccessHelper']);
  macro.getArray(publicAPI, model, ['arrays']);
  macro.algo(publicAPI, model, 0, 1);
  macro.event(publicAPI, model, 'busy');

  // Object methods
  vtkHttpDataSetReader(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkHttpDataSetReader');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
