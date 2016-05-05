import Monologue from 'monologue.js';
import pako from 'pako';

function getEndianness() {
  const a = new ArrayBuffer(4);
  const b = new Uint8Array(a);
  const c = new Uint32Array(a);
  b[0] = 0xa1;
  b[1] = 0xb2;
  b[2] = 0xc3;
  b[3] = 0xd4;
  if (c[0] === 0xd4c3b2a1) return 'LittleEndian';
  if (c[0] === 0xa1b2c3d4) return 'BigEndian';
  return null;
}

const BUSY = 'HttpDataSetReader.busy';
const LOCATIONS = ['PointData', 'CellData', 'FieldData'];
const ENDIANNESS = getEndianness();
const TYPE_BYTES = {
  Int8Array: 1,
  Uint8Array: 1,
  Uint8ClampedArray: 1,
  Int16Array: 2,
  Uint16Array: 2,
  Int32Array: 4,
  Uint32Array: 4,
  Float32Array: 4,
  Float64Array: 8,
};

const GEOMETRY_ARRAYS = {
  PolyData(dataset) {
    const arrayToDownload = [];
    arrayToDownload.push(dataset.PolyData.Points);
    Object.keys(dataset.PolyData.Cells).forEach(cellName => {
      if (dataset.PolyData.Cells[cellName]) {
        arrayToDownload.push(dataset.PolyData.Cells[cellName]);
      }
    });

    return arrayToDownload;
  },

  ImageData(dataset) {
    return [];
  },

  UnstructuredGrid(dataset) {
    const arrayToDownload = [];
    arrayToDownload.push(dataset.UnstructuredGrid.Points);
    arrayToDownload.push(dataset.UnstructuredGrid.Cells);
    arrayToDownload.push(dataset.UnstructuredGrid.CellTypes);

    return arrayToDownload;
  },

  RectilinearGrid(dataset) {
    const arrayToDownload = [];
    arrayToDownload.push(dataset.RectilinearGrid.XCoordinates);
    arrayToDownload.push(dataset.RectilinearGrid.YCoordinates);
    arrayToDownload.push(dataset.RectilinearGrid.ZCoordinates);

    return arrayToDownload;
  },

  MultiBlock(dataset) {
    let arrayToDownload = [];
    Object.keys(dataset.MultiBlock.Blocks).forEach(blockName => {
      const fn = GEOMETRY_ARRAYS[dataset.MultiBlock.Blocks[blockName].type];
      if (fn) {
        arrayToDownload = [].concat(arrayToDownload, fn(dataset.MultiBlock.Blocks[blockName]));
      }
    });

    return arrayToDownload;
  },
};

function busyUpdate(instance, delta) {
  instance.requestCount += delta;
  if (instance.requestCount === 1 || instance.requestCount === 0) {
    instance.emit(BUSY, !!instance.requestCount);
  }
}

function swapBytes(buffer, wordSize) {
  if (wordSize < 2) {
    return;
  }

  const bytes = new Int8Array(buffer);
  const size = bytes.length;
  const tempBuffer = [];

  for (let i = 0; i < size; i += wordSize) {
    for (let j = 0; j < wordSize; j++) {
      tempBuffer.push(bytes[i + j]);
    }
    for (let j = 0; j < wordSize; j++) {
      bytes[i + j] = tempBuffer.pop();
    }
  }
}

function fetchArray(instance, array, fetchGzip = false) {
  if (array.ref) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = [instance.getBaseURL(), array.ref.basepath, fetchGzip ? `${array.ref.id}.gz` : array.ref.id].join('/');

      xhr.onreadystatechange = e => {
        if (xhr.readyState === 1) {
          busyUpdate(instance, +1);
        }
        if (xhr.readyState === 4) {
          busyUpdate(instance, -1);

          if (xhr.status === 200) {
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
              if (ENDIANNESS !== array.ref.encode && ENDIANNESS) {
                // Need to swap bytes
                console.log('Swap bytes of', array.name);
                swapBytes(array.buffer, TYPE_BYTES[array.dataType]);
              }

              array.values = new window[array.dataType](array.buffer);
            }

            if (array.values.length !== array.size) {
              console.error('Error in FetchArray:', array.name, 'does not have the proper array size. Got', array.values.length, 'instead of', array.size);
            }

            delete array.ref;
            resolve(instance, instance.dataset);
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
    resolve(instance, instance.dataset);
  });
}

function fillBlocks(dataset, block, arraysToList, enable) {
  if (dataset.type === 'MultiBlock') {
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

export default class HttpDataSetReader {
  constructor(enableAllArrays = true, fetchGzip = false) {
    this.arrays = [];
    this.blocks = null;
    this.dataset = null;
    this.url = null;
    this.enableArray = !!enableAllArrays;
    this.requestCount = 0;
    this.fetchGzip = fetchGzip;
  }

  setURL(url) {
    if (url.indexOf('index.json') === -1) {
      this.baseURL = url;
      this.url = `${url}/index.json`;
    } else {
      this.url = url;

      // Remove the file in the URL
      const path = url.split('/');
      path.pop();
      this.baseURL = path.join('/');
    }
  }

  update() {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.onreadystatechange = e => {
        if (xhr.readyState === 1) {
          busyUpdate(this, +1);
        }
        if (xhr.readyState === 4) {
          busyUpdate(this, -1);

          if (xhr.status === 200) {
            this.dataset = JSON.parse(xhr.responseText);

            // Generate array list
            this.arrays = [];
            const container = this.dataset[this.dataset.type];
            const enable = this.enableArray;
            if (container.Blocks) {
              this.blocks = {};
              const arraysToList = {};
              fillBlocks(this.dataset, this.blocks, arraysToList, enable);
              Object.keys(arraysToList).forEach(id => {
                this.arrays.push(arraysToList[id]);
              });
            } else {
              // Regular dataset
              LOCATIONS.forEach(location => {
                if (container[location]) {
                  Object.keys(container[location]).forEach(name => {
                    this.arrays.push({ name, enable, location, ds: [container] });
                  });
                }
              });
            }

            // Fetch geometry arrays
            const pendingPromises = [];
            GEOMETRY_ARRAYS[this.dataset.type](this.dataset).forEach(array => {
              pendingPromises.push(fetchArray(this, array, this.fetchGzip));
            });

            // Wait for all geometry array to be fetched
            if (pendingPromises.length) {
              Promise.all(pendingPromises)
                .then(
                  ok => {
                    resolve(this, this.dataset);
                  },
                  err => {
                    reject(err);
                  }
                );
            } else {
              resolve(this, this.dataset);
            }
          } else {
            reject(xhr, e);
          }
        }
      };

      // Make request
      xhr.open('GET', this.url, true);
      xhr.responseType = 'text';
      xhr.send();
    });
  }

  updateData() {
    const arrayToFecth = [];
    this.arrays
      .filter(array => array.enable)
      .forEach(array => {
        array.ds.forEach(ds => {
          if (isDatasetEnable(this.dataset, this.blocks, ds)) {
            arrayToFecth.push(ds[array.location][array.name]);
          }
        });
      });

    return new Promise((resolve, reject) => {
      const error = (xhr, e) => {
        reject(xhr, e);
      };

      const processNext = () => {
        if (arrayToFecth.length) {
          fetchArray(this, arrayToFecth.pop(), this.fetchGzip).then(processNext, error);
        } else {
          resolve(this, this.dataset);
        }
      };

      // Start processing queue
      processNext();
    });
  }

  listBlocks() {
    return this.blocks;
  }

  listArrays() {
    return this.arrays;
  }

  enableArray(location, name, enable = true) {
    const activeArray = this.arrays.filter(array => array.name === name && array.location === location);
    if (activeArray.length === 1) {
      activeArray[0].enable = enable;
    }
  }

  enableBlock(blockPath, enable = true, pathSeparator = '.') {
    let container = this.blocks;
    const path = blockPath.split(pathSeparator);

    while (container && path.length > 1) {
      container = container[path.shift];
    }

    if (container && path.length === 1) {
      container[path[0]].enable = enable;
    }
  }

  getOutput() {
    return this.dataset;
  }

  destroy() {
    this.off();
    this.arrays = null;
    this.block = null;
    this.dataset = null;
    this.url = null;
  }

  onBusy(callback) {
    return this.on(BUSY, callback);
  }

  isBusy() {
    return !!this.requestCount;
  }

  getBaseURL() {
    return this.baseURL;
  }
}

Monologue.mixInto(HttpDataSetReader);
