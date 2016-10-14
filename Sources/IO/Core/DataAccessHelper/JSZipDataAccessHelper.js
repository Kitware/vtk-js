/* global window */

import JSZip from 'jszip';
import pako from 'pako';

import Endian from '../../../Common/Core/Endian';
import { TYPE_BYTES } from './Constants';

function removeLeadingSlash(str) {
  return (str[0] === '/') ? str.substr(1) : str;
}

function create(options) {
  let ready = false;
  let requestCount = 0;
  const zip = new JSZip();
  zip.loadAsync(options.zipContent)
    .then(() => {
      ready = true;
      if (options.callback) {
        options.callback(zip);
      }
    });
  return {
    fetchArray(instance = {}, baseURL, array, fetchGzip = false) {
      return new Promise((resolve, reject) => {
        if (!ready) {
          console.log('ERROR!!! zip not ready...');
        }
        const url = removeLeadingSlash([baseURL, array.ref.basepath, fetchGzip ? `${array.ref.id}.gz` : array.ref.id].join('/'));

        if (++requestCount === 1 && instance.invokeBusy) {
          instance.invokeBusy(true);
        }

        zip.file(url)
          .async('uint8array')
          .then((uint8array) => {
            array.buffer = new ArrayBuffer(uint8array.length);

            // copy uint8array to buffer
            const view = new Uint8Array(array.buffer);
            view.set(uint8array);

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

    fetchJSON(instance = {}, url) {
      const path = removeLeadingSlash(url);
      if (!ready) {
        console.log('ERROR!!! zip not ready...');
      }

      return zip.file(path).async('string').then(str => new Promise(ok => ok(JSON.parse(str))));
    },
  };
}

export default {
  create,
};
