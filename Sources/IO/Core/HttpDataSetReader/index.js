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
const BUSY = 'HttpDataSetReader.busy';
const LOCATIONS = ['PointData', 'CellData', 'FieldData'];

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
              array.buffer = pako.inflate(new Uint8Array(array.buffer)).buffer;
              array.values = new window[array.dataType]();
            }

            if (ENDIANNESS !== array.ref.encode && ENDIANNESS) {
              // Need to swap bytes
              console.log('Swap bytes of', array.name);
              swapBytes(array.buffer, TYPE_BYTES[array.dataType]);
            }

            array.values = new window[array.dataType](array.buffer);

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
      xhr.responseType = 'arraybuffer';
      xhr.send();
    });
  }

  return new Promise((resolve, reject) => {
    resolve(instance, instance.dataset);
  });
}

export default class HttpDataSetReader {
  constructor(enableAllArrays = true, fetchGzip = false) {
    this.arrays = [];
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
            LOCATIONS.forEach(location => {
              if (container[location]) {
                Object.keys(container[location]).forEach(name => {
                  this.arrays.push({ name, enable, location });
                });
              }
            });

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
        arrayToFecth.push(this.dataset[this.dataset.type][array.location][array.name]);
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

  listArrays() {
    return this.arrays;
  }

  enableArray(location, name, enable = true) {
    const activeArray = this.arrays.filter(array => array.name === name && array.location === location);
    if (activeArray.length === 1) {
      activeArray[0].enable = enable;
    }
  }

  getOutput() {
    return this.dataset;
  }

  destroy() {
    this.off();
    this.arrays = null;
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
