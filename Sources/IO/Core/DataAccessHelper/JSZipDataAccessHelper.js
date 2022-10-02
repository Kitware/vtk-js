import { decompressSync, strFromU8, strToU8, unzipSync } from 'fflate';

import macro from 'vtk.js/Sources/macros';
import Endian from 'vtk.js/Sources/Common/Core/Endian';
import { DataTypeByteSize } from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import { registerType } from 'vtk.js/Sources/IO/Core/DataAccessHelper';
import { fromArrayBuffer } from 'vtk.js/Sources/Common/Core/Base64';

const { vtkErrorMacro, vtkDebugMacro } = macro;

function toMimeType(url) {
  const ext = url.split('.').pop().toLowerCase();
  if (ext === 'jpg') {
    return 'jpeg';
  }
  return ext;
}

function handleUint8Array(array, compression, done) {
  return (uint8array) => {
    array.buffer = new ArrayBuffer(uint8array.length);

    // copy uint8array to buffer
    const view = new Uint8Array(array.buffer);
    view.set(uint8array);

    if (compression) {
      if (array.dataType === 'string' || array.dataType === 'JSON') {
        array.buffer = strFromU8(decompressSync(new Uint8Array(array.buffer)));
      } else {
        array.buffer = decompressSync(new Uint8Array(array.buffer)).buffer;
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

      array.values = macro.newTypedArray(array.dataType, array.buffer);
    }

    if (array.values.length !== array.size) {
      vtkErrorMacro(
        `Error in FetchArray: ${array.name} does not have the proper array size. Got ${array.values.length}, instead of ${array.size}`
      );
    }

    done();
  };
}

function handleString(array, compression, done) {
  return (string) => {
    if (compression) {
      array.values = JSON.parse(strFromU8(decompressSync(string)));
    } else {
      array.values = JSON.parse(string);
    }
    done();
  };
}

function removeLeadingSlash(str) {
  return str[0] === '/' ? str.substr(1) : str;
}

function normalizePath(str) {
  return new URL(str, 'http://any').pathname;
}

function cleanUpPath(str) {
  return removeLeadingSlash(normalizePath(str));
}

function unpack(zipContent) {
  return new Promise((resolve, reject) => {
    if (typeof zipContent === 'string') {
      resolve(strToU8(zipContent));
    } else if (zipContent instanceof Blob) {
      resolve(zipContent.arrayBuffer().then((ab) => new Uint8Array(ab)));
    } else if (zipContent instanceof ArrayBuffer) {
      resolve(new Uint8Array(zipContent));
    } else if (zipContent?.buffer instanceof ArrayBuffer) {
      resolve(new Uint8Array(zipContent.buffer));
    } else {
      reject(new Error('Invalid datatype to unpack.'));
    }
  });
}

function create(createOptions) {
  let ready = false;
  let requestCount = 0;
  let decompressedFiles = null;
  let fullRootPath = '';

  unpack(createOptions.zipContent).then((zipFileData) => {
    decompressedFiles = unzipSync(zipFileData);
    ready = true;

    // Find root index.json
    const metaFiles = [];
    Object.keys(decompressedFiles).forEach((relativePath) => {
      if (relativePath.endsWith('index.json')) {
        metaFiles.push(relativePath);
      }
    });
    metaFiles.sort((a, b) => a.length - b.length);
    // if not empty, then fullRootPath will have a forward slash suffix
    fullRootPath = metaFiles[0].replace(/index\.json$/, '');

    if (createOptions.callback) {
      createOptions.callback(decompressedFiles);
    }
  });

  return {
    fetchArray(instance, baseURL, array, options = {}) {
      return new Promise((resolve, reject) => {
        if (!ready) {
          vtkErrorMacro('ERROR!!! zip not ready...');
        }
        const url = cleanUpPath(
          [
            baseURL,
            array.ref.basepath,
            options.compression ? `${array.ref.id}.gz` : array.ref.id,
          ].join('/')
        );

        if (++requestCount === 1 && instance?.invokeBusy) {
          instance.invokeBusy(true);
        }

        function doneCleanUp() {
          // Done with the ref and work
          delete array.ref;
          if (--requestCount === 0 && instance?.invokeBusy) {
            instance.invokeBusy(false);
          }
          if (instance?.modified) {
            instance.modified();
          }
          resolve(array);
        }

        const fileData = decompressedFiles[`${fullRootPath}${url}`];

        if (array.dataType === 'string' && !options.compression) {
          // string
          const handler = handleString(array, options.compression, doneCleanUp);
          handler(strFromU8(fileData));
        } else {
          // uint8array
          const handler = handleUint8Array(
            array,
            options.compression,
            doneCleanUp
          );
          handler(fileData);
        }
      });
    },

    fetchJSON(instance, url, options = {}) {
      const path = cleanUpPath(url);
      if (!ready) {
        vtkErrorMacro('ERROR!!! zip not ready...');
      }
      const fileData = decompressedFiles[`${fullRootPath}${path}`];
      if (options.compression) {
        if (options.compression === 'gz') {
          const str = strFromU8(decompressSync(fileData));
          return Promise.resolve(JSON.parse(str));
        }
        return Promise.reject(new Error('Invalid compression'));
      }
      return Promise.resolve(JSON.parse(strFromU8(fileData)));
    },

    fetchText(instance, url, options = {}) {
      const path = cleanUpPath(url);
      if (!ready) {
        vtkErrorMacro('ERROR!!! zip not ready...');
      }
      const fileData = decompressedFiles[`${fullRootPath}${path}`];
      if (options.compression) {
        if (options.compression === 'gz') {
          return Promise.resolve(strFromU8(unzipSync(fileData)));
        }
        return Promise.reject(new Error('Invalid compression'));
      }
      return Promise.resolve(strFromU8(fileData));
    },

    fetchImage(instance, url, options = {}) {
      const path = cleanUpPath(url);
      if (!ready) {
        vtkErrorMacro('ERROR!!! zip not ready...');
      }
      const fileData = decompressedFiles[`${fullRootPath}${path}`];
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        const str = fromArrayBuffer(fileData.buffer);
        img.src = `data:image/${toMimeType(path)};base64,${str}`;
      });
    },

    fetchBinary(instance, url, options = {}) {
      const path = cleanUpPath(url);
      if (!ready) {
        vtkErrorMacro('ERROR!!! zip not ready...');
      }
      const fileData = decompressedFiles[`${fullRootPath}${path}`];
      if (options.compression) {
        if (options.compression === 'gz') {
          return Promise.resolve(decompressSync(fileData).buffer);
        }
        return Promise.reject(new Error('Invalid compression'));
      }
      return Promise.resolve(fileData.buffer);
    },
  };
}

const JSZipDataAccessHelper = {
  create,
};

registerType('zip', (options) => JSZipDataAccessHelper.create(options));

export default JSZipDataAccessHelper;
