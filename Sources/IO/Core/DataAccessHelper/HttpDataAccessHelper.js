import pako from 'pako';

import macro                from 'vtk.js/Sources/macro';
import Endian               from 'vtk.js/Sources/Common/Core/Endian';
import { DataTypeByteSize } from 'vtk.js/Sources/Common/Core/DataArray/Constants';

const { vtkErrorMacro, vtkDebugMacro } = macro;

let requestCount = 0;

function fetchBinary(url, options = {}) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onreadystatechange = (e) => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200 || xhr.status === 0) {
          resolve(xhr.response);
        } else {
          reject(xhr, e);
        }
      }
    };

    if (options && options.progressCallback) {
      xhr.addEventListener('progress', options.progressCallback);
    }

    // Make request
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.send();
  });
}

function fetchArray(instance = {}, baseURL, array, fetchGzip = false) {
  if (array.ref && !array.ref.pending) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const url = [baseURL, array.ref.basepath, fetchGzip ? `${array.ref.id}.gz` : array.ref.id].join('/');

      xhr.onreadystatechange = (e) => {
        if (xhr.readyState === 1) {
          array.ref.pending = true;
          if (++requestCount === 1 && instance.invokeBusy) {
            instance.invokeBusy(true);
          }
        }
        if (xhr.readyState === 4) {
          array.ref.pending = false;
          if (xhr.status === 200 || xhr.status === 0) {
            array.buffer = xhr.response;

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
              vtkErrorMacro(`Error in FetchArray: ${array.name}, does not have the proper array size. Got ${array.values.length}, instead of ${array.size}`);
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
          } else {
            reject(xhr, e);
          }
        }
      };

      // Make request
      xhr.open('GET', url, true);
      xhr.responseType = (fetchGzip || array.dataType !== 'string') ? 'arraybuffer' : 'text';
      xhr.send();
    });
  }

  return new Promise((resolve, reject) => {
    resolve(array);
  });
}

// ----------------------------------------------------------------------------

function fetchJSON(instance = {}, url, compression) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onreadystatechange = (e) => {
      if (xhr.readyState === 1) {
        if (++requestCount === 1 && instance.invokeBusy) {
          instance.invokeBusy(true);
        }
      }
      if (xhr.readyState === 4) {
        if (--requestCount === 0 && instance.invokeBusy) {
          instance.invokeBusy(false);
        }
        if (xhr.status === 200 || xhr.status === 0) {
          if (compression) {
            resolve(JSON.parse(pako.inflate(new Uint8Array(xhr.response), { to: 'string' })));
          } else {
            resolve(JSON.parse(xhr.responseText));
          }
        } else {
          reject(xhr, e);
        }
      }
    };

    // Make request
    xhr.open('GET', url, true);
    xhr.responseType = compression ? 'arraybuffer' : 'text';
    xhr.send();
  });
}

// ----------------------------------------------------------------------------

function fetchText(instance = {}, url, compression, progressCallback) {
  if (compression && compression !== 'gz') {
    vtkErrorMacro('Supported algorithms are: [gz]');
    vtkErrorMacro(`Unkown compression algorithm: ${compression}`);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onreadystatechange = (e) => {
      if (xhr.readyState === 1) {
        if (++requestCount === 1 && instance.invokeBusy) {
          instance.invokeBusy(true);
        }
      }
      if (xhr.readyState === 4) {
        if (--requestCount === 0 && instance.invokeBusy) {
          instance.invokeBusy(false);
        }
        if (xhr.status === 200 || xhr.status === 0) {
          if (compression) {
            resolve(pako.inflate(new Uint8Array(xhr.response), { to: 'string' }));
          } else {
            resolve(xhr.responseText);
          }
        } else {
          reject(xhr, e);
        }
      }
    };

    if (progressCallback) {
      xhr.addEventListener('progress', progressCallback);
    }

    // Make request
    xhr.open('GET', url, true);
    xhr.responseType = compression ? 'arraybuffer' : 'text';
    xhr.send();
  });
}


// ----------------------------------------------------------------------------

export default {
  fetchArray,
  fetchJSON,
  fetchText,
  fetchBinary, // Only for HTTP
};
