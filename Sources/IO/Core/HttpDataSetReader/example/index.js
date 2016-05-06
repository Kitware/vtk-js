/* global __BASE_PATH__ */
import HttpDataSetReader from '..';

const datasetToLoad = [
  // `${__BASE_PATH__}/data/can.ex2`, // !!! Parametric Dataset not yet supported
  `${__BASE_PATH__}/data/bot2.wrl`,
  `${__BASE_PATH__}/data/disk_out_ref.ex2`,
  `${__BASE_PATH__}/data/Wavelet.vti`,
];

// Server is not sending the .gz and whith the compress header
// Need to fetch the true file name and uncompress it locally
const reader = HttpDataSetReader.newInstance({ fetchGzip: true });

reader.onBusy(busy => {
  console.log('reader is', busy ? 'busy' : 'idle');
});

function loadDataSet(url) {
  console.log('## Downloading', url, '--------------------------------------');
  reader.setUrl(url).then(
    (r, ds) => {
      console.log('dataset successfuly downloaded', reader.getOutput());

      reader.getArrays().forEach(array => {
        console.log('-', array.name, array.location, ':', array.enable);
      });

      r.update().then(
        ok => {
          console.log('all data downloaded', reader.getOutput());
          console.log('blocks', reader.getBlocks());
          if (datasetToLoad.length) {
            loadDataSet(datasetToLoad.pop());
          }
        },
        err => {
          console.log('error downloading data', err);
        }
      );
    },
    (xhr, e) => {
      console.log('error fetching dataset', xhr, e);
    });
}

// Main
loadDataSet(datasetToLoad.pop());
