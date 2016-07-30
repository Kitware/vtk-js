import * as macro from '../../../macro';
import vtk from '../../../vtk';
import Endian from '../../../Common/Core/Endian';
import pako from 'pako';
import vtkPolyData from '../../../Common/DataModel/PolyData';
import { TYPE_BYTES, LOCATIONS } from './Constants';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

const GEOMETRY_ARRAYS = {
  vtkPolyData(dataset) {
    const arrayToDownload = [];
    arrayToDownload.push(dataset.vtkPolyData.Points);
    Object.keys(dataset.vtkPolyData).forEach(cellName => {
      if (dataset.vtkPolyData[cellName]) {
        arrayToDownload.push(dataset.vtkPolyData[cellName]);
      }
    });

    return arrayToDownload;
  },

  vtkImageData(dataset) {
    return [];
  },

  vtkUnstructuredGrid(dataset) {
    const arrayToDownload = [];
    arrayToDownload.push(dataset.vtkUnstructuredGrid.Points);
    arrayToDownload.push(dataset.vtkUnstructuredGrid.Cells);
    arrayToDownload.push(dataset.vtkUnstructuredGrid.CellTypes);

    return arrayToDownload;
  },

  vtkRectilinearGrid(dataset) {
    const arrayToDownload = [];
    arrayToDownload.push(dataset.vtkRectilinearGrid.XCoordinates);
    arrayToDownload.push(dataset.vtkRectilinearGrid.YCoordinates);
    arrayToDownload.push(dataset.vtkRectilinearGrid.ZCoordinates);

    return arrayToDownload;
  },

  vtkMultiBlock(dataset) {
    let arrayToDownload = [];
    Object.keys(dataset.vtkMultiBlock.Blocks).forEach(blockName => {
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

  // Internal method to fetch Array
  function fetchArray(array, fetchGzip = false) {
    if (array.ref && !array.ref.pending) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const url = [model.baseURL, array.ref.basepath, fetchGzip ? `${array.ref.id}.gz` : array.ref.id].join('/');

        xhr.onreadystatechange = e => {
          if (xhr.readyState === 1) {
            array.ref.pending = true;
            if (++model.requestCount === 1) {
              publicAPI.invokeBusy(true);
            }
          }
          if (xhr.readyState === 4) {
            array.ref.pending = false;
            if (xhr.status === 200 || xhr.status === 0) {
              array.buffer = xhr.response;

              if (fetchGzip) {
                if (array.dataType === 'JSON') {
                  array.buffer = pako.inflate(new Uint8Array(array.buffer), { to: 'string' });
                } else {
                  array.buffer = pako.inflate(new Uint8Array(array.buffer)).buffer;
                }
              }

              if (array.dataType === 'JSON') {
                array.values = JSON.parse(array.buffer);
              } else {
                if (Endian.ENDIANNESS !== array.ref.encode && Endian.ENDIANNESS) {
                  // Need to swap bytes
                  console.log('Swap bytes of', array.name);
                  Endian.swapBytes(array.buffer, TYPE_BYTES[array.dataType]);
                }

                array.values = new window[array.dataType](array.buffer);
              }

              if (array.values.length !== array.size) {
                console.error('Error in FetchArray:', array.name, 'does not have the proper array size. Got', array.values.length, 'instead of', array.size);
              }

              // Done with the ref and work
              delete array.ref;
              if (--model.requestCount === 0) {
                publicAPI.invokeBusy(false);
              }
              publicAPI.modified();
              resolve(array);
            } else {
              reject(xhr, e);
            }
          }
        };

        // Make request
        xhr.open('GET', url, true);
        xhr.responseType = (fetchGzip || array.dataType !== 'JSON') ? 'arraybuffer' : 'text';
        xhr.send();
      });
    }

    return new Promise((resolve, reject) => {
      resolve(array);
    });
  }

  // Internal method to fill block information and state
  function fillBlocks(dataset, block, arraysToList, enable) {
    if (dataset.type === 'vtkMultiBlock') {
      Object.keys(dataset.MultiBlock.Blocks).forEach(blockName => {
        block[blockName] = fillBlocks(dataset.MultiBlock.Blocks[blockName], {}, arraysToList, enable);
        block[blockName].enable = enable;
      });
    } else {
      block.type = dataset.type;
      block.enable = enable;
      const container = dataset[dataset.type];
      LOCATIONS.forEach(location => {
        if (container[location]) {
          Object.keys(container[location]).forEach(name => {
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
    if (root[root.type] === dataset) {
      return blockState ? blockState.enable : true;
    }

    // Find corresponding datasetBlock
    if (root.MultiBlock && root.MultiBlock.Blocks) {
      Object.keys(root.MultiBlock.Blocks).forEach(blockName => {
        if (enable) {
          return;
        }

        const subRoot = root.MultiBlock.Blocks[blockName];
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
      const xhr = new XMLHttpRequest();
      let dataset = model.dataset;

      xhr.onreadystatechange = e => {
        if (xhr.readyState === 1) {
          if (++model.requestCount === 1) {
            publicAPI.invokeBusy(true);
          }
        }
        if (xhr.readyState === 4) {
          if (--model.requestCount === 0) {
            publicAPI.invokeBusy(false);
          }

          if (xhr.status === 200) {
            dataset = JSON.parse(xhr.responseText);
            model.dataset = dataset;

            // Generate array list
            model.arrays = [];

            const container = dataset[dataset.type];
            const enable = model.enableArray;
            if (container.Blocks) {
              model.blocks = {};
              const arraysToList = {};
              fillBlocks(dataset, model.blocks, arraysToList, enable);
              Object.keys(arraysToList).forEach(id => {
                model.arrays.push(arraysToList[id]);
              });
            } else {
              // Regular dataset
              LOCATIONS.forEach(location => {
                if (container[location]) {
                  Object.keys(container[location]).forEach(name => {
                    model.arrays.push({ name, enable, location, ds: [container] });
                  });
                }
              });
            }

            // Fetch geometry arrays
            const pendingPromises = [];
            GEOMETRY_ARRAYS[dataset.type](dataset).forEach(array => {
              pendingPromises.push(fetchArray(array, model.fetchGzip));
            });

            // Wait for all geometry array to be fetched
            if (pendingPromises.length) {
              Promise.all(pendingPromises)
                .then(
                  ok => {
                    model.output[0] = vtk(dataset);
                    resolve(publicAPI, model.output[0]);
                  },
                  err => {
                    reject(err);
                  }
                );
            } else {
              model.output[0] = vtk(dataset);
              resolve(publicAPI, model.output[0]);
            }
          } else {
            reject(xhr, e);
          }
        }
      };

      // Make request
      xhr.open('GET', model.url, true);
      xhr.responseType = 'text';
      xhr.send();
    });

  // Set DataSet url
  publicAPI.setUrl = url => {
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
    const arrayMappingFunc = [];
    model.arrays
      .filter(array => array.enable)
      .forEach(array => {
        array.ds.forEach(ds => {
          if (isDatasetEnable(datasetStruct, model.blocks, ds)) {
            if (ds[array.location][array.name].ref) {
              arrayToFecth.push(ds[array.location][array.name]);
              arrayMappingFunc.push(datasetObj[`get${array.location}`]().addArray);
            }
          }
        });
      });

    return new Promise((resolve, reject) => {
      let lastArray = null;
      const error = (xhr, e) => {
        reject(xhr, e);
      };

      const processNext = () => {
        if (lastArray) {
          arrayMappingFunc.pop()(vtk(lastArray));
        }

        if (arrayToFecth.length) {
          lastArray = arrayToFecth.pop();
          fetchArray(lastArray, model.fetchGzip).then(processNext, error);
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
  ]);
  macro.getArray(publicAPI, model, ['arrays']);
  macro.algo(publicAPI, model, 0, 1);
  macro.event(publicAPI, model, 'busy');

  // Object methods
  vtkHttpDataSetReader(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
