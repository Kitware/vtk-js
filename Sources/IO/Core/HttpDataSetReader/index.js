// For vtk factory
import 'vtk.js/Sources/Common/DataModel/ImageData';
import 'vtk.js/Sources/Common/DataModel/PolyData';

import vtk from 'vtk.js/Sources/vtk';
import macro from 'vtk.js/Sources/macro';
import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkStringArray from 'vtk.js/Sources/Common/Core/StringArray';

const fieldDataLocations = ['pointData', 'cellData', 'fieldData'];
const HTTP_DATA_ACCESS = DataAccessHelper.get('http');
const ARRAY_BUILDERS = {
  vtkDataArray,
  vtkStringArray,
};

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

function processDataSet(
  publicAPI,
  model,
  dataset,
  fetchArray,
  resolve,
  reject,
  loadData
) {
  const enable = model.enableArray;

  // Generate array list
  model.arrays = [];

  fieldDataLocations.forEach((location) => {
    if (dataset[location]) {
      dataset[location].arrays.map((i) => i.data).forEach((array) => {
        model.arrays.push({
          name: array.name,
          enable,
          location,
          array,
          registration: array.ref.registration || 'addArray',
        });
      });

      // Reset data arrays
      dataset[location].arrays = [];
    }
  });

  // Fetch geometry arrays
  const pendingPromises = [];
  const { progressCallback } = model;
  const compression = model.fetchGzip ? 'gz' : null;
  GEOMETRY_ARRAYS[dataset.vtkClass](dataset).forEach((array) => {
    pendingPromises.push(fetchArray(array, { compression, progressCallback }));
  });

  function success() {
    model.dataset = vtk(dataset);
    if (!loadData) {
      model.output[0] = model.dataset;
      resolve(publicAPI, model.output[0]);
    } else {
      publicAPI.loadData().then(() => {
        model.output[0] = model.dataset;
        resolve(publicAPI, model.output[0]);
      });
    }
  }

  // Wait for all geometry array to be fetched
  if (pendingPromises.length) {
    Promise.all(pendingPromises).then(success, (err) => {
      reject(err);
    });
  } else {
    success();
  }
}

// ----------------------------------------------------------------------------
// vtkHttpDataSetReader methods
// ----------------------------------------------------------------------------

function vtkHttpDataSetReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkHttpDataSetReader');

  // Empty output by default
  model.output[0] = vtk({ vtkClass: 'vtkPolyData' });

  // Create default dataAccessHelper if not available
  if (!model.dataAccessHelper) {
    model.dataAccessHelper = HTTP_DATA_ACCESS;
  }

  // Internal method to fetch Array
  function fetchArray(array, options = {}) {
    return model.dataAccessHelper.fetchArray(
      publicAPI,
      model.baseURL,
      array,
      options
    );
  }

  // Fetch dataset (metadata)
  publicAPI.updateMetadata = (loadData = false) => {
    if (model.compression === 'zip') {
      return new Promise((resolve, reject) => {
        HTTP_DATA_ACCESS.fetchBinary(model.url).then(
          (zipContent) => {
            model.dataAccessHelper = DataAccessHelper.get('zip', {
              zipContent,
              callback: (zip) => {
                model.baseURL = '';
                model.dataAccessHelper.fetchJSON(publicAPI, 'index.json').then(
                  (dataset) => {
                    processDataSet(
                      publicAPI,
                      model,
                      dataset,
                      fetchArray,
                      resolve,
                      reject,
                      loadData
                    );
                  },
                  (error) => {
                    reject(error);
                  }
                );
              },
            });
          },
          (error) => {
            reject(error);
          }
        );
      });
    }

    return new Promise((resolve, reject) => {
      model.dataAccessHelper.fetchJSON(publicAPI, model.url).then(
        (dataset) => {
          processDataSet(
            publicAPI,
            model,
            dataset,
            fetchArray,
            resolve,
            reject,
            loadData
          );
        },
        (error) => {
          reject(error);
        }
      );
    });
  };

  // Set DataSet url
  publicAPI.setUrl = (url, options = {}) => {
    if (url.indexOf('index.json') === -1 && !options.fullpath) {
      model.baseURL = url;
      model.url = `${url}/index.json`;
    } else {
      model.url = url;

      // Remove the file in the URL
      const path = url.split('/');
      path.pop();
      model.baseURL = path.join('/');
    }

    model.compression = options.compression;

    // Fetch metadata
    return publicAPI.updateMetadata(!!options.loadData);
  };

  // Fetch the actual data arrays
  publicAPI.loadData = () => {
    const datasetObj = model.dataset;
    const arrayToFecth = model.arrays
      .filter((array) => array.enable)
      .filter((array) => array.array.ref)
      .map((array) => array.array);

    return new Promise((resolve, reject) => {
      const error = (e) => {
        reject(e);
      };

      const processNext = () => {
        if (arrayToFecth.length) {
          const { progressCallback } = model;
          const compression = model.fetchGzip ? 'gz' : null;
          fetchArray(arrayToFecth.pop(), {
            compression,
            progressCallback,
          }).then(processNext, error);
        } else if (datasetObj) {
          // Perform array registration
          model.arrays
            .filter((array) => array.registration)
            .forEach((metaArray) => {
              const newArray = ARRAY_BUILDERS[
                metaArray.array.vtkClass
              ].newInstance(metaArray.array);
              datasetObj[`get${macro.capitalize(metaArray.location)}`]()[
                metaArray.registration
              ](newArray);
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
    const activeArray = model.arrays.filter(
      (array) => array.name === name && array.location === location
    );
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
  macro.set(publicAPI, model, ['dataAccessHelper', 'progressCallback']);
  macro.getArray(publicAPI, model, ['arrays']);
  macro.algo(publicAPI, model, 0, 1);
  macro.event(publicAPI, model, 'busy');

  // Object methods
  vtkHttpDataSetReader(publicAPI, model);

  // Make sure we can destructuring progressCallback from model
  if (model.progressCallback === undefined) {
    model.progressCallback = null;
  }
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkHttpDataSetReader');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
