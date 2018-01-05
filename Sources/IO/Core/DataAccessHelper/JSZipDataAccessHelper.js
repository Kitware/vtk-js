import JSZip from 'jszip';
import pako from 'pako';

import macro from 'vtk.js/Sources/macro';
import Endian from 'vtk.js/Sources/Common/Core/Endian';
import { DataTypeByteSize } from 'vtk.js/Sources/Common/Core/DataArray/Constants';

const { vtkErrorMacro, vtkDebugMacro } = macro;

function handleUint8Array(array, compression, done) {
  return (uint8array) => {
    array.buffer = new ArrayBuffer(uint8array.length);

    // copy uint8array to buffer
    const view = new Uint8Array(array.buffer);
    view.set(uint8array);

    if (compression) {
      if (array.dataType === 'string' || array.dataType === 'JSON') {
        array.buffer = pako.inflate(new Uint8Array(array.buffer), {
          to: 'string',
        });
      } else {
        array.buffer = pako.inflate(new Uint8Array(array.buffer)).buffer;
      }
    }

    if (array.ref.encode === 'JSON') {
      array.values = JSON.parse(array.buffer);
    } else {
      if (Endian.ENDIANNESS !== array.ref.encode && Endian.ENDIANNESS) {
        // Need to swap bytes
        vtkDebugMacro(`Swap bytes of ${array.name}`);
        Endian.swapBytes(array.buffer, DataTypeByteSize[array.dataType]);
      }

      array.values = new window[array.dataType](array.buffer);
    }

    if (array.values.length !== array.size) {
      vtkErrorMacro(
        `Error in FetchArray: ${
          array.name
        } does not have the proper array size. Got ${
          array.values.length
        }, instead of ${array.size}`
      );
    }

    done();
  };
}

function handleString(array, compression, done) {
  return (string) => {
    if (compression) {
      array.values = JSON.parse(pako.inflate(string, { to: 'string' }));
    } else {
      array.values = JSON.parse(string);
    }
    done();
  };
}

const handlers = {
  uint8array: handleUint8Array,
  string: handleString,
};

function removeLeadingSlash(str) {
  return str[0] === '/' ? str.substr(1) : str;
}

function create(createOptions) {
  let ready = false;
  let requestCount = 0;
  const zip = new JSZip();
  let zipRoot = zip;
  zip.loadAsync(createOptions.zipContent).then(() => {
    ready = true;

    // Find root index.json
    const metaFiles = [];
    zip.forEach((relativePath, zipEntry) => {
      if (relativePath.indexOf('index.json') !== -1) {
        metaFiles.push(relativePath);
      }
    });
    metaFiles.sort((a, b) => a.length - b.length);
    const fullRootPath = metaFiles[0].split('/');
    while (fullRootPath.length > 1) {
      const dirName = fullRootPath.shift();
      zipRoot = zipRoot.folder(dirName);
    }

    if (createOptions.callback) {
      createOptions.callback(zip);
    }
  });
  return {
    fetchArray(instance = {}, baseURL, array, options = {}) {
      return new Promise((resolve, reject) => {
        if (!ready) {
          vtkErrorMacro('ERROR!!! zip not ready...');
        }
        const url = removeLeadingSlash(
          [
            baseURL,
            array.ref.basepath,
            options.compression ? `${array.ref.id}.gz` : array.ref.id,
          ].join('/')
        );

        if (++requestCount === 1 && instance.invokeBusy) {
          instance.invokeBusy(true);
        }

        function doneCleanUp() {
          // Done with the ref and work
          delete array.ref;
          if (--requestCount === 0 && instance.invokeBusy) {
            instance.invokeBusy(false);
          }
          if (instance.modified) {
            instance.modified();
          }
          resolve(array);
        }

        const asyncType =
          array.dataType === 'string' && !options.compression
            ? 'string'
            : 'uint8array';
        const asyncCallback = handlers[asyncType](
          array,
          options.compression,
          doneCleanUp
        );

        zipRoot
          .file(url)
          .async(asyncType)
          .then(asyncCallback);
      });
    },

    fetchJSON(instance = {}, url, options = {}) {
      const path = removeLeadingSlash(url);
      if (!ready) {
        vtkErrorMacro('ERROR!!! zip not ready...');
      }

      if (options.compression) {
        if (options.compression === 'gz') {
          return zipRoot
            .file(path)
            .async('uint8array')
            .then((uint8array) => {
              const str = pako.inflate(uint8array, { to: 'string' });
              return Promise.resolve(JSON.parse(str));
            });
        }
        return Promise.reject(new Error('Invalid compression'));
      }

      return zipRoot
        .file(path)
        .async('string')
        .then((str) => Promise.resolve(JSON.parse(str)));
    },

    fetchText(instance = {}, url, options = {}) {
      const path = removeLeadingSlash(url);
      if (!ready) {
        vtkErrorMacro('ERROR!!! zip not ready...');
      }

      if (options.compression) {
        if (options.compression === 'gz') {
          return zipRoot
            .file(path)
            .async('uint8array')
            .then((uint8array) => {
              const str = pako.inflate(uint8array, { to: 'string' });
              return Promise.resolve(str);
            });
        }
        return Promise.reject(new Error('Invalid compression'));
      }

      return zipRoot
        .file(path)
        .async('string')
        .then((str) => Promise.resolve(str));
    },
  };
}

export default {
  create,
};
