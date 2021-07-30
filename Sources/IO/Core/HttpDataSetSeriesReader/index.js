// For vtk factory
import 'vtk.js/Sources/Common/DataModel/ImageData';
import 'vtk.js/Sources/Common/DataModel/PolyData';

import vtk from 'vtk.js/Sources/vtk';
import macro from 'vtk.js/Sources/macros';
import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';
import HttpDataSetReader from '../HttpDataSetReader';

// Enable data soure for DataAccessHelper
import 'vtk.js/Sources/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper'; // Just need HTTP
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper'; // HTTP + zip
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HtmlDataAccessHelper'; // html + base64 + zip
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/JSZipDataAccessHelper'; // zip

const HTTP_DATA_ACCESS = DataAccessHelper.get('http');

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

function processDataSet(publicAPI, model, dataset, resolve, reject, loadData) {
  model.readers = [];

  const pendingPromises = [];
  dataset.series.forEach((timeStep) => {
    const newReader = HttpDataSetReader.newInstance({
      fetchGzip: model.fetchGzip,
      dataAccessHelper: model.dataAccessHelper,
    });
    pendingPromises.push(
      newReader.setUrl(`${model.baseURL}/${timeStep.url}`, { loadData })
    );
    model.readers.push({
      timeStep: timeStep.timeStep,
      reader: newReader,
    });
  });

  return Promise.all(pendingPromises).then(
    () => {
      const range = publicAPI.getTimeRange();
      if (range && range.length !== 0) {
        publicAPI.setUpdateTimeStep(range[0]);
      }
      resolve(publicAPI);
    },
    (error) => {
      reject(error);
    }
  );
}

// ----------------------------------------------------------------------------
// vtkHttpDataSetSeriesReader methods
// ----------------------------------------------------------------------------

function vtkHttpDataSetSeriesReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkHttpDataSetSeriesReader');

  // Empty output by default
  model.output[0] = vtk({ vtkClass: 'vtkPolyData' });

  // Create default dataAccessHelper if not available
  if (!model.dataAccessHelper) {
    model.dataAccessHelper = HTTP_DATA_ACCESS;
  }

  model.currentReader = null;

  publicAPI.updateMetaData = (loadData = false) => {
    if (model.compression === 'zip') {
      return new Promise((resolve, reject) => {
        HTTP_DATA_ACCESS.fetchBinary(model.baseURL).then((zipContent) => {
          model.dataAccessHelper = DataAccessHelper.get('zip', {
            zipContent,
            callback: (zip) => {
              model.baseURL = '';
              model.dataAccessHelper.fetchJSON(publicAPI, 'index.json').then(
                (dataset) => {
                  processDataSet(
                    publicAPI,
                    model,
                    dataset,
                    resolve,
                    reject,
                    loadData
                  );
                },
                (error) => {
                  reject(error);
                }
              );
            },
          });
        });
      });
    }

    return new Promise((resolve, reject) => {
      model.dataAccessHelper.fetchJSON(publicAPI, model.url).then(
        (dataset) =>
          processDataSet(publicAPI, model, dataset, resolve, reject, loadData),
        (error) => {
          reject(error);
        }
      );
    });
  };

  publicAPI.setUrl = (url, options = {}) => {
    if (!url.endsWith('index.json') && !options.fullpath) {
      model.baseURL = url;
      model.url = `${url}/index.json`;
    } else {
      model.url = url;

      // Remove the file in the URL
      const path = url.split('/');
      path.pop();
      model.baseURL = path.join('/');
    }

    model.compression = options.compression;

    return publicAPI.updateMetaData(options.loadData);
  };

  publicAPI.getTimeSteps = () =>
    model.readers.map((reader) => reader.timeStep).sort();

  publicAPI.getTimeRange = () => {
    const timeSteps = publicAPI.getTimeSteps();
    const length = timeSteps.length;
    if (length >= 1) {
      return [timeSteps[0], timeSteps[length - 1]];
    }
    return [];
  };

  publicAPI.setUpdateTimeStep = (timeStep) => {
    const reader = model.readers.reduce((newReader, currentReader) => {
      if (currentReader.timeStep <= timeStep) {
        return currentReader;
      }
      return newReader;
    });

    if (reader === undefined) {
      return;
    }

    model.currentReader = reader.reader;
    model.output[0] = model.currentReader.getOutputData();
    model.output[0].modified();
    publicAPI.modified();
  };

  publicAPI.requestData = (inData, outData) => {
    if (model.currentReader) {
      outData[0] = model.currentReader.getOutputData();
    }
  };

  // Toggle arrays to load
  publicAPI.enableArray = (location, name, enable = true) => {
    if (model.currentReader) {
      model.currentReader.reader.enableArray(location, name, enable);
    }
  };

  publicAPI.loadData = () => {
    if (model.currentReader) {
      model.currentReader.reader.loadData();
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  fetchGzip: false,
  url: null,
  baseURL: null,
  dataAccessHelper: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['url', 'baseURL']);
  macro.set(publicAPI, model, ['dataAccessHelper']);
  macro.algo(publicAPI, model, 0, 1);

  // Object methods
  vtkHttpDataSetSeriesReader(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkHttpDataSetSeriesReader'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
