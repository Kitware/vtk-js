import JSZip  from 'jszip';
import pako   from 'pako';

import macro                from 'vtk.js/Sources/macro';
import Endian               from 'vtk.js/Sources/Common/Core/Endian';
import { DataTypeByteSize } from 'vtk.js/Sources/Common/Core/DataArray/Constants';

const { vtkErrorMacro, vtkDebugMacro } = macro;

function removeLeadingSlash(str) {
  return (str[0] === '/') ? str.substr(1) : str;
}

function create(options) {
  let ready = false;
  let requestCount = 0;
  const zip = new JSZip();
  let zipRoot = zip;
  zip.loadAsync(options.zipContent)
    .then(() => {
      ready = true;

      // Find root index.json
      const metaFiles = [];
      zip.forEach((relativePath, zipEntry) => {
        if (relativePath.indexOf('index.json') !== -1) {
          metaFiles.push(relativePath);
        }
      });
      metaFiles.sort((a, b) => a.length > b.length);
      const fullRootPath = metaFiles[0].split('/');
      while (fullRootPath.length > 1) {
        const dirName = fullRootPath.shift();
        zipRoot = zipRoot.folder(dirName);
      }

      if (options.callback) {
        options.callback(zip);
      }
    });
  return {
    fetchArray(instance = {}, baseURL, array, fetchGzip = false) {
      return new Promise((resolve, reject) => {
        if (!ready) {
          vtkErrorMacro('ERROR!!! zip not ready...');
        }
        const url = removeLeadingSlash([baseURL, array.ref.basepath, fetchGzip ? `${array.ref.id}.gz` : array.ref.id].join('/'));

        if (++requestCount === 1 && instance.invokeBusy) {
          instance.invokeBusy(true);
        }

        zipRoot.file(url)
          .async('uint8array')
          .then((uint8array) => {
            array.buffer = new ArrayBuffer(uint8array.length);

            // copy uint8array to buffer
            const view = new Uint8Array(array.buffer);
            view.set(uint8array);

            if (fetchGzip) {
              if (array.dataType === 'string' || array.dataType === 'JSON') {
                array.buffer = pako.inflate(new Uint8Array(array.buffer), { to: 'string' });
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
              vtkErrorMacro(`Error in FetchArray: ${array.name} does not have the proper array size. Got ${array.values.length}, instead of ${array.size}`);
            }

            // Done with the ref and work
            delete array.ref;
            if (--requestCount === 0 && instance.invokeBusy) {
              instance.invokeBusy(false);
            }
            if (instance.modified) {
              instance.modified();
            }
            resolve(array);
          });
      });
    },

    fetchJSON(instance = {}, url, compression) {
      const path = removeLeadingSlash(url);
      if (!ready) {
        vtkErrorMacro('ERROR!!! zip not ready...');
      }

      if (compression) {
        if (compression === 'gz') {
          return zipRoot.file(path).async('uint8array').then((uint8array) => {
            const str = pako.inflate(uint8array, { to: 'string' });
            return new Promise(ok => ok(JSON.parse(str)));
          });
        }
        return new Promise((a, r) => r('Invalid compression'));
      }

      return zipRoot.file(path).async('string').then(str => new Promise(ok => ok(JSON.parse(str))));
    },

    fetchText(instance = {}, url, compression) {
      const path = removeLeadingSlash(url);
      if (!ready) {
        vtkErrorMacro('ERROR!!! zip not ready...');
      }

      if (compression) {
        if (compression === 'gz') {
          return zipRoot.file(path).async('uint8array').then((uint8array) => {
            const str = pako.inflate(uint8array, { to: 'string' });
            return new Promise(ok => ok(str));
          });
        }
        return new Promise((a, r) => r('Invalid compression'));
      }

      return zipRoot.file(path).async('string').then(str => new Promise(ok => ok(str)));
    },
  };
}

export default {
  create,
};
