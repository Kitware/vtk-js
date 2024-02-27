import { registerType } from 'vtk.js/Sources/IO/Core/DataAccessHelper';
import macro from 'vtk.js/Sources/macros';

const MockBaseURL = 'http://mockData';
const MiB = 1024 * 1024;
let fetchArrayDelayMs = 0;

function createMockIndexJSON(fileId, byteLength) {
  return {
    origin: [0, 0, 0],
    cellData: { arrays: [], vtkClass: 'vtkDataSetAttributes' },
    FieldData: { arrays: [], vtkClass: 'vtkDataSetAttributes' },
    vtkClass: 'vtkImageData',
    pointData: {
      arrays: [
        {
          data: {
            numberOfComponents: 1,
            name: 'ImageFile',
            vtkClass: 'vtkDataArray',
            dataType: 'Uint8Array',
            ranges: [
              {
                max: 15583,
                component: null,
                min: 0,
              },
            ],
            ref: {
              registration: 'setScalars',
              encode: 'LittleEndian',
              basepath: 'data',
              id: fileId,
            },
            size: byteLength,
          },
        },
      ],
      vtkClass: 'vtkDataSetAttributes',
    },
  };
}

const MockData = {
  'test01/index.json': () => createMockIndexJSON('test01', 10 * MiB),
  'test01/data/test01.gz': () => new Uint8Array(10 * MiB),
  'test02/index.json': () => createMockIndexJSON('test02', 20 * MiB),
  'test02/data/test02.gz': () => new Uint8Array(20 * MiB),
  'test03/index.json': () => createMockIndexJSON('test03', 15 * MiB),
  'test03/data/test03.gz': () => new Uint8Array(15 * MiB),
  'test04/index.json': () => createMockIndexJSON('test04', 40 * MiB),
  'test04/data/test04.gz': () => new Uint8Array(40 * MiB),
};

// ----------------------------------------------------------------------------

const CallTrackers = [];

function getCallTracker() {
  const tracker = {
    fetchJSON: [],
    fetchArray: [],
  };
  CallTrackers.push(tracker);
  return tracker;
}

function fetchText(instance, url, options = {}) {
  return new Promise((_, reject) => {
    reject(new Error('Method "fetchText()" not implemented'));
  });
}

function fetchJSON(instance, url, options = {}) {
  const promise = new Promise((resolve, reject) => {
    if (!url.startsWith(MockBaseURL) || !url.toLowerCase().endsWith('.json')) {
      reject(new Error(`No such JSON ${url}`));
      return;
    }
    const dataId = url.split('/').slice(-2)[0];
    const filename = `${dataId}/index.json`;

    if (!MockData[filename]) {
      reject(new Error(`No such JSON ${url}`));
      return;
    }
    resolve(MockData[filename]());
  });

  CallTrackers.forEach((t) => {
    t.fetchJSON.push({
      promise,
      called: new Date(),
    });
  });

  return promise;
}

function fetchArray(instance, baseURL, array, options = {}) {
  const url = `${baseURL}/${array.ref.basepath}/${array.ref.id}.gz`;
  const promise = new Promise((resolve, reject) => {
    setTimeout(() => {
      if (!baseURL.startsWith(MockBaseURL)) {
        reject(new Error(`No such array ${url}`));
        return;
      }

      const dataId = url.split('/').slice(-3)[0];
      const filename = `${dataId}/${array.ref.basepath}/${array.ref.id}.gz`;

      if (!MockData[filename]) {
        reject(new Error(`No such array ${url}`));
        return;
      }

      array.buffer = MockData[filename]();
      array.values = macro.newTypedArray(array.dataType, array.buffer);
      delete array.ref;

      if (instance?.invokeBusy) {
        instance.invokeBusy(false);
      }
      if (instance?.modified) {
        instance.modified();
      }
      resolve(array);
    });
  }, fetchArrayDelayMs);

  CallTrackers.forEach((t) => {
    t.fetchArray.push({
      promise,
      called: new Date(),
    });
  });

  return promise;
}

function fetchImage(instance, url, options = {}) {
  return new Promise((_, reject) => {
    reject(new Error('Method "fetchImage()" not implemented'));
  });
}

function setFetchArrayDelayMs(delay) {
  fetchArrayDelayMs = delay;
}

// ----------------------------------------------------------------------------

const MockDataAccessHelper = {
  fetchJSON,
  fetchText,
  fetchArray,
  fetchImage,
  getCallTracker,
  setFetchArrayDelayMs,
};

registerType('mock', (options) => MockDataAccessHelper);

// Export fetch methods
export default MockDataAccessHelper;
