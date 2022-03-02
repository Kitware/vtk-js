import pako from 'pako';

import macro from 'vtk.js/Sources/macros';
import Endian from 'vtk.js/Sources/Common/Core/Endian';
import { DataTypeByteSize } from 'vtk.js/Sources/Common/Core/DataArray/Constants';
import { registerType } from 'vtk.js/Sources/IO/Core/DataAccessHelper';

const { vtkErrorMacro, vtkDebugMacro } = macro;

/* eslint-disable prefer-promise-reject-errors */

let requestCount = 0;

function openAsyncXHR(method, url, options = {}) {
  const xhr = new XMLHttpRequest();
  xhr.open(method, url, true);

  if (options.headers) {
    Object.entries(options.headers).forEach(([key, value]) =>
      xhr.setRequestHeader(key, value)
    );
  }

  if (options.progressCallback) {
    xhr.addEventListener('progress', options.progressCallback);
  }

  return xhr;
}

function fetchBinary(url, options = {}) {
  if (options && options.compression && options.compression !== 'gz') {
    vtkErrorMacro('Supported algorithms are: [gz]');
    vtkErrorMacro(`Unkown compression algorithm: ${options.compression}`);
  }

  return new Promise((resolve, reject) => {
    const xhr = openAsyncXHR('GET', url, options);

    xhr.onreadystatechange = (e) => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200 || xhr.status === 0) {
          if (options.compression) {
            resolve(
              pako.inflate(new Uint8Array(xhr.response), { to: 'arraybuffer' })
                .buffer
            );
          } else {
            resolve(xhr.response);
          }
        } else {
          reject({ xhr, e });
        }
      }
    };

    // Make request
    xhr.responseType = 'arraybuffer';
    xhr.send();
  });
}

function fetchArray(instance, baseURL, array, options = {}) {
  if (array.ref && !array.ref.pending) {
    return new Promise((resolve, reject) => {
      let url = null;

      if (array.ref.url) {
        url = array.ref.url;
      } else {
        url = [
          baseURL,
          array.ref.basepath,
          options.compression ? `${array.ref.id}.gz` : array.ref.id,
        ].join('/');
      }

      const xhr = openAsyncXHR('GET', url, options);

      xhr.onreadystatechange = (e) => {
        if (xhr.readyState === 1) {
          array.ref.pending = true;
          if (++requestCount === 1 && instance?.invokeBusy) {
            instance.invokeBusy(true);
          }
        }
        if (xhr.readyState === 4) {
          array.ref.pending = false;
          if (xhr.status === 200 || xhr.status === 0) {
            array.buffer = xhr.response;

            if (options.compression) {
              if (array.dataType === 'string' || array.dataType === 'JSON') {
                array.buffer = pako.inflate(new Uint8Array(array.buffer), {
                  to: 'string',
                });
              } else {
                array.buffer = pako.inflate(
                  new Uint8Array(array.buffer)
                ).buffer;
              }
            }

            if (array.ref.encode === 'JSON') {
              array.values = JSON.parse(array.buffer);
            } else {
              if (Endian.ENDIANNESS !== array.ref.encode && Endian.ENDIANNESS) {
                // Need to swap bytes
                vtkDebugMacro(`Swap bytes of ${array.name}`);
                Endian.swapBytes(
                  array.buffer,
                  DataTypeByteSize[array.dataType]
                );
              }

              array.values = macro.newTypedArray(array.dataType, array.buffer);
            }

            if (array.values.length !== array.size) {
              vtkErrorMacro(
                `Error in FetchArray: ${array.name}, does not have the proper array size. Got ${array.values.length}, instead of ${array.size}`
              );
            }

            // Done with the ref and work
            delete array.ref;
            if (--requestCount === 0 && instance?.invokeBusy) {
              instance.invokeBusy(false);
            }
            if (instance?.modified) {
              instance.modified();
            }
            resolve(array);
          } else {
            reject({ xhr, e });
          }
        }
      };

      // Make request
      xhr.responseType =
        options.compression || array.dataType !== 'string'
          ? 'arraybuffer'
          : 'text';
      xhr.send();
    });
  }

  return Promise.resolve(array);
}

// ----------------------------------------------------------------------------

function fetchJSON(instance, url, options = {}) {
  return new Promise((resolve, reject) => {
    const xhr = openAsyncXHR('GET', url, options);

    xhr.onreadystatechange = (e) => {
      if (xhr.readyState === 1) {
        if (++requestCount === 1 && instance?.invokeBusy) {
          instance.invokeBusy(true);
        }
      }
      if (xhr.readyState === 4) {
        if (--requestCount === 0 && instance?.invokeBusy) {
          instance.invokeBusy(false);
        }
        if (xhr.status === 200 || xhr.status === 0) {
          if (options.compression) {
            resolve(
              JSON.parse(
                pako.inflate(new Uint8Array(xhr.response), { to: 'string' })
              )
            );
          } else {
            resolve(JSON.parse(xhr.responseText));
          }
        } else {
          reject({ xhr, e });
        }
      }
    };

    // Make request
    xhr.responseType = options.compression ? 'arraybuffer' : 'text';
    xhr.send();
  });
}

// ----------------------------------------------------------------------------

function fetchText(instance, url, options = {}) {
  if (options && options.compression && options.compression !== 'gz') {
    vtkErrorMacro('Supported algorithms are: [gz]');
    vtkErrorMacro(`Unkown compression algorithm: ${options.compression}`);
  }

  return new Promise((resolve, reject) => {
    const xhr = openAsyncXHR('GET', url, options);

    xhr.onreadystatechange = (e) => {
      if (xhr.readyState === 1) {
        if (++requestCount === 1 && instance?.invokeBusy) {
          instance.invokeBusy(true);
        }
      }
      if (xhr.readyState === 4) {
        if (--requestCount === 0 && instance?.invokeBusy) {
          instance.invokeBusy(false);
        }
        if (xhr.status === 200 || xhr.status === 0) {
          if (options.compression) {
            resolve(
              pako.inflate(new Uint8Array(xhr.response), { to: 'string' })
            );
          } else {
            resolve(xhr.responseText);
          }
        } else {
          reject({ xhr, e });
        }
      }
    };

    // Make request
    xhr.responseType = options.compression ? 'arraybuffer' : 'text';
    xhr.send();
  });
}

// ----------------------------------------------------------------------------

function fetchImage(instance, url, options = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (options.crossOrigin) {
      img.crossOrigin = options.crossOrigin;
    }
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}
/* eslint-enable prefer-promise-reject-errors */

// ----------------------------------------------------------------------------

const HttpDataAccessHelper = {
  fetchArray,
  fetchJSON,
  fetchText,
  fetchBinary, // Only for HTTP
  fetchImage,
};

registerType('http', (options) => HttpDataAccessHelper);

export default HttpDataAccessHelper;
