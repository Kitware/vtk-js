/* global window */

import JSZip from 'jszip';
import pako from 'pako';

import Endian from '../../../Common/Core/Endian';
import { TYPE_BYTES } from './Constants';

function create(options) {
  let ready = false;
  let requestCount = 0;
  const zip = new JSZip();
  zip.loadAsync(options.zipContent)
    .then(() => {
      ready = true;
    });
  return {
    fetchArray(instance = {}, baseURL, array, fetchGzip = false) {
      return new Promise((resolve, reject) => {
        if (!ready) {
          console.log('ERROR!!! zip not ready...');
        }
        const url = [baseURL, array.ref.basepath, fetchGzip ? `${array.ref.id}.gz` : array.ref.id].join('/');
        console.log('fetchArray', baseURL, url);

        if (++requestCount === 1 && instance.invokeBusy) {
          instance.invokeBusy(true);
        }

        zip.file(url)
          .async('uint8array')
          .then((buffer) => {
            array.buffer = buffer;

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
      console.log('fetchJSON', url);
      if (!ready) {
        console.log('ERROR!!! zip not ready...');
      }
      return zip.file(url).async('string');
    },
  };
}

export default {
  create,
};
