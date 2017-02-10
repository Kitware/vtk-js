import * as macro from '../../../macro';
import DataAccessHelper from '../../Core/DataAccessHelper';

// ----------------------------------------------------------------------------
// vtkMTLReader methods
// ----------------------------------------------------------------------------

export function vtkMTLReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkMTLReader');

  function imageReady() {
    model.requestCount--;
    if (model.requestCount === 0) {
      publicAPI.invokeBusy(false);
    }
  }

  function parseLine(line) {
    if (line[0] === '#' || line.length === 0) {
      return;
    }

    const tokens = line.split(' ');
    if (tokens[0] === 'newmtl') {
      model.currentMaterial = tokens[1];
    } else if (model.currentMaterial) {
      if (!model.materials[model.currentMaterial]) {
        model.materials[model.currentMaterial] = {};
      }
      model.materials[model.currentMaterial][tokens[0]] = tokens.slice(1);
      if (tokens[0] === 'map_Kd') {
        const image = new Image();
        image.src = [model.baseURL, tokens[1]].join('/');
        image.onload = imageReady;
        model.materials[model.currentMaterial].image = image;
        model.requestCount++;
      }
    }
  }

  // Create default dataAccessHelper if not available
  if (!model.dataAccessHelper) {
    model.dataAccessHelper = DataAccessHelper.get('http');
  }

  // Internal method to fetch Array
  function fetchData(url) {
    return model.dataAccessHelper.fetchText(publicAPI, url, model.compression);
  }

  // Set DataSet url
  publicAPI.setUrl = (url, option = {}) => {
    if (url.indexOf('.mtl') === -1 && !option.fullpath) {
      model.baseURL = url;
      model.url = `${url}/index.mtl`;
    } else {
      model.url = url;

      // Remove the file in the URL
      const path = url.split('/');
      path.pop();
      model.baseURL = path.join('/');
    }

    model.compression = option.compression;

    // Fetch metadata
    return publicAPI.loadData();
  };

  // Fetch the actual data arrays
  publicAPI.loadData = () =>
    new Promise((resolve, reject) => {
      fetchData(model.url)
        .then(
          (content) => {
            publicAPI.parse(content);
            resolve();
          },
          (err) => {
            reject();
          });
    });

  publicAPI.parse = (content) => {
    publicAPI.modified();
    model.materials = {};
    content.split('\n').forEach(parseLine);
  };

  // return Busy state
  publicAPI.isBusy = () => !!model.requestCount;

  publicAPI.getMaterialNames = () => Object.keys(model.materials);
  publicAPI.getMaterial = name => model.materials[name];
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  numberOfOutputs: 1,
  requestCount: 0,
  materials: {},
  // baseURL: null,
  // dataAccessHelper: null,
  // url: null,
};

// ----------------------------------------------------------------------------


export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, [
    'url',
    'baseURL',
  ]);
  macro.setGet(publicAPI, model, [
    'dataAccessHelper',
    'splitGroup',
  ]);
  macro.event(publicAPI, model, 'busy');

  // Object methods
  vtkMTLReader(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkMTLReader');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
