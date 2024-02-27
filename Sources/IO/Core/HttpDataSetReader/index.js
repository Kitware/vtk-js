// For vtk factory
import 'vtk.js/Sources/Common/DataModel/ImageData';
import 'vtk.js/Sources/Common/DataModel/PolyData';

import vtk from 'vtk.js/Sources/vtk';
import macro from 'vtk.js/Sources/macros';
import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkStringArray from 'vtk.js/Sources/Common/Core/StringArray';

// Enable data soure for DataAccessHelper
import 'vtk.js/Sources/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper'; // Just need HTTP
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper'; // HTTP + zip
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HtmlDataAccessHelper'; // html + base64 + zip
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/JSZipDataAccessHelper'; // zip

const fieldDataLocations = ['pointData', 'cellData', 'fieldData'];
const ARRAY_BUILDERS = {
  vtkDataArray,
  vtkStringArray,
};

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

const cachedArraysAndPromises = {};
const cachedArraysMetaData = {};
const MiB = 1024 * 1024;

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
      dataset[location].arrays
        .map((i) => i.data)
        .forEach((array) => {
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
    model.dataAccessHelper = DataAccessHelper.get('http');
  }

  // Internal method to fetch Array
  function fetchArray(array, options = {}) {
    const arrayId = `${array.ref.id}|${array.vtkClass}`;
    if (!cachedArraysAndPromises[arrayId]) {
      // Cache the promise while fetching
      cachedArraysAndPromises[arrayId] = model.dataAccessHelper
        .fetchArray(publicAPI, model.baseURL, array, options)
        .then((newArray) => {
          // Remove promise and return here if caching is disabled
          if (!model.maxCacheSize) {
            delete cachedArraysAndPromises[arrayId];
            return newArray;
          }

          // Replace the promise with the array in cache once downloaded
          cachedArraysAndPromises[arrayId] = newArray;
          cachedArraysMetaData[arrayId] = { lastAccess: new Date() };

          // If maxCacheSize is set to -1 the cache is unlimited
          if (model.maxCacheSize < 0) {
            return newArray;
          }

          // sort cache according to access times (potentially needed for creating space)
          const cachedArrays = {};
          Object.keys(cachedArraysMetaData).forEach((arrId) => {
            cachedArrays[arrId] = {
              array: cachedArraysAndPromises[arrId],
              lastAccess: cachedArraysMetaData[arrId].lastAccess,
            };
          });
          const sortedArrayCache = Object.entries(cachedArrays).sort((a, b) =>
            Math.sign(b[1].lastAccess - a[1].lastAccess)
          );

          // Check cache size
          const cacheSizeLimit = model.maxCacheSize * MiB;
          let cacheSize = Object.values(cachedArrays).reduce(
            (accSize, entry) => accSize + entry.array.values.byteLength,
            0
          );

          // Delete cache entries until size is below the limit
          while (cacheSize > cacheSizeLimit && sortedArrayCache.length > 0) {
            const [oldId, entry] = sortedArrayCache.pop();
            delete cachedArraysAndPromises[oldId];
            delete cachedArraysMetaData[oldId];
            cacheSize -= entry.array.values.byteLength;
          }

          // Edge case: If the new entry is bigger than the cache limit
          if (!cachedArraysMetaData[arrayId]) {
            macro.vtkWarningMacro('Cache size is too small for the dataset');
          }

          return newArray;
        });
    } else {
      // cacheArrays[arrayId] can be a promise or value
      Promise.resolve(cachedArraysAndPromises[arrayId]).then((cachedArray) => {
        if (array !== cachedArray) {
          //  Update last access for cache retention rules (if caching is enabled)
          if (model.maxCacheSize) {
            cachedArraysMetaData[arrayId].lastAccess = new Date();
          }

          // Assign cached array as result
          Object.assign(array, cachedArray);
          delete array.ref;
        }
      });
    }

    return Promise.resolve(cachedArraysAndPromises[arrayId]);
  }

  // Fetch dataset (metadata)
  publicAPI.updateMetadata = (loadData = false) => {
    if (model.compression === 'zip') {
      return new Promise((resolve, reject) => {
        DataAccessHelper.get('http')
          .fetchBinary(model.url)
          .then(
            (zipContent) => {
              model.dataAccessHelper = DataAccessHelper.get('zip', {
                zipContent,
                callback: (zip) => {
                  model.baseURL = '';
                  model.dataAccessHelper
                    .fetchJSON(publicAPI, 'index.json')
                    .then(
                      (dataset) => {
                        publicAPI
                          .parseObject(dataset, {
                            loadData,
                            deepCopy: false,
                          })
                          .then(resolve, reject);
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
          publicAPI
            .parseObject(dataset, { loadData, deepCopy: false })
            .then(resolve, reject);
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

  publicAPI.parseObject = (
    manifest,
    { loadData, baseUrl, deepCopy = true }
  ) => {
    if (baseUrl) {
      model.baseURL = baseUrl;
    }

    const dataset = deepCopy ? structuredClone(manifest) : manifest;

    return new Promise((resolve, reject) => {
      processDataSet(
        publicAPI,
        model,
        dataset,
        fetchArray,
        resolve,
        reject,
        loadData
      );
    });
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
          // Perform array registration on new arrays
          model.arrays
            .filter(
              (metaArray) => metaArray.registration && !metaArray.array.ref
            )
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

  // return id's of cached arrays
  publicAPI.getCachedArrayIds = () => Object.keys(cachedArraysMetaData);

  // clear global array cache
  publicAPI.clearCache = () =>
    Object.keys(cachedArraysMetaData).forEach((k) => {
      delete cachedArraysAndPromises[k];
      delete cachedArraysMetaData[k];
    });

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
  arrayCachingEnabled: true,
  maxCacheSize: 2048,
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
    'maxCacheSize',
  ]);
  macro.set(publicAPI, model, [
    'dataAccessHelper',
    'progressCallback',
    'maxCacheSize',
  ]);
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
