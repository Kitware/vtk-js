import vtk              from 'vtk.js/Sources/vtk';
import macro            from 'vtk.js/Sources/macro';
import vtkPolyData      from 'vtk.js/Sources/Common/DataModel/PolyData';
import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';

const fieldDataLocations = ['pointData', 'cellData', 'fieldData'];

// For vtk factory
import 'vtk.js/Sources/Common/DataModel/ImageData';

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

  vtkMultiBlock(dataset) {
    let arrayToDownload = [];
    Object.keys(dataset.vtkMultiBlock.Blocks).forEach((blockName) => {
      const fn = GEOMETRY_ARRAYS[dataset.vtkMultiBlock.Blocks[blockName].type];
      if (fn) {
        arrayToDownload = [].concat(arrayToDownload, fn(dataset.vtkMultiBlock.Blocks[blockName]));
      }
    });

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
  model.output[0] = vtkPolyData.newInstance();

  // Create default dataAccessHelper if not available
  if (!model.dataAccessHelper) {
    model.dataAccessHelper = DataAccessHelper.get('http');
  }

  // Internal method to fetch Array
  function fetchArray(array, fetchGzip = false) {
    return model.dataAccessHelper.fetchArray(publicAPI, model.baseURL, array, fetchGzip);
  }

  // Internal method to fill block information and state
  function fillBlocks(dataset, block, arraysToList, enable) {
    if (dataset.vtkClass === 'vtkMultiBlock') {
      Object.keys(dataset.MultiBlock.Blocks).forEach((blockName) => {
        block[blockName] = fillBlocks(dataset.MultiBlock.Blocks[blockName], {}, arraysToList, enable);
        block[blockName].enable = enable;
      });
    } else {
      block.type = dataset.vtkClass;
      block.enable = enable;
      const container = dataset;
      fieldDataLocations.forEach((location) => {
        if (container[location]) {
          Object.keys(container[location]).forEach((name) => {
            if (arraysToList[`${location}_:|:_${name}`]) {
              arraysToList[`${location}_:|:_${name}`].ds.push(container);
            } else {
              arraysToList[`${location}_:|:_${name}`] = { name, enable, location, ds: [container] };
            }
          });
        }
      });
    }

    return block;
  }

  // Internal method to test if a dataset should be fetched
  function isDatasetEnable(root, blockState, dataset) {
    let enable = false;
    if (root === dataset) {
      return blockState ? blockState.enable : true;
    }

    // Find corresponding datasetBlock
    if (root && root.Blocks) {
      Object.keys(root.Blocks).forEach((blockName) => {
        if (enable) {
          return;
        }

        const subRoot = root.Blocks[blockName];
        const subState = blockState[blockName];

        if (!subState.enable) {
          return;
        }

        if (isDatasetEnable(subRoot, subState, dataset)) {
          enable = true;
        }
      });
    }

    return enable;
  }

  // Fetch dataset (metadata)
  publicAPI.updateMetadata = () =>
    new Promise((resolve, reject) => {
      model.dataAccessHelper
        .fetchJSON(publicAPI, model.url)
        .then(
          (dataset) => {
            model.dataset = dataset;

            // Generate array list
            model.arrays = [];

            const container = dataset;
            const enable = model.enableArray;
            if (container.Blocks) {
              model.blocks = {};
              const arraysToList = {};
              fillBlocks(dataset, model.blocks, arraysToList, enable);
              Object.keys(arraysToList).forEach((id) => {
                model.arrays.push(arraysToList[id]);
              });
            } else {
              // Regular dataset
              fieldDataLocations.forEach((location) => {
                if (container[location]) {
                  container[location].arrays.map(i => i.data).forEach((array) => {
                    model.arrays.push({ name: array.name, enable, location, ds: [container] });
                  });
                }
              });
            }

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
                    model.output[0] = vtk(dataset);
                    resolve(publicAPI, model.output[0]);
                  },
                  (err) => {
                    reject(err);
                  }
                );
            } else {
              model.output[0] = vtk(dataset);
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
    const datasetStruct = model.dataset;
    const datasetObj = model.output[0];
    const arrayToFecth = [];
    model.arrays
      .filter(array => array.enable)
      .forEach((array) => {
        array.ds.forEach((ds) => {
          if (isDatasetEnable(datasetStruct, model.blocks, ds)) {
            ds[array.location]
              .arrays
              .map(i => i.data)
              .filter(i => (i.name === array.name))
              .filter(i => i.ref)
              .forEach((dataArray) => {
                arrayToFecth.push(dataArray);
              });
          }
        });
      });

    return new Promise((resolve, reject) => {
      const error = (xhr, e) => {
        reject(xhr, e);
      };

      const processNext = () => {
        if (arrayToFecth.length) {
          fetchArray(arrayToFecth.pop(), model.fetchGzip).then(processNext, error);
        } else {
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

  // Toggle blocks to load
  publicAPI.enableBlock = (blockPath, enable = true, pathSeparator = '.') => {
    let container = model.blocks;
    const path = blockPath.split(pathSeparator);

    while (container && path.length > 1) {
      container = container[path.shift];
    }

    if (container && path.length === 1) {
      container[path[0]].enable = enable;
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
  blocks: null,
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
    'blocks',
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
