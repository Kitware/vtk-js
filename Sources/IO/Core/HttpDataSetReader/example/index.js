/* global __BASE_PATH__ */
import HttpDataSetReader from '..';

const datasetToLoad = [
  `${__BASE_PATH__}/data/can.ex2`,
  `${__BASE_PATH__}/data/bot2.wrl`,
  `${__BASE_PATH__}/data/disk_out_ref.ex2`,
  `${__BASE_PATH__}/data/Wavelet.vti`,
];

const reader = new HttpDataSetReader();
 // Server is not sending the .gz and whith the compress header
 // Need to fetch the true file name and uncompress it locally
reader.fetchGzip = true;

function loadDataSet(url) {
  console.log('## Downloading', url, '--------------------------------------');
  reader.setURL(url);
  reader.update().then(
    (r, ds) => {
      console.log('dataset successfuly downloaded', reader.getOutput());

      reader.listArrays().forEach(array => {
        console.log('-', array.name, array.location, ':', array.enable);
      });

      r.updateData().then(
        ok => {
          console.log('all data downloaded', reader.getOutput());
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
