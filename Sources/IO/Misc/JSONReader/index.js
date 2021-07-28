import macro from 'vtk.js/Sources/macros';

// ----------------------------------------------------------------------------
// vtkJSONReader methods
// ----------------------------------------------------------------------------

function vtkJSONReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkJSONReader');

  // Internal method to fetch Array
  function fetchData(url, option = {}) {
    return model.dataAccessHelper.fetchText(publicAPI, url, option);
  }

  // Set DataSet url
  publicAPI.setUrl = (url, option = {}) => {
    model.url = url;

    // Fetch metadata
    return publicAPI.loadData(option);
  };

  // Fetch the actual data arrays
  publicAPI.loadData = (option = {}) =>
    fetchData(model.url, option).then(publicAPI.parseAsText);

  publicAPI.parseAsText = (content) => {
    if (!content) {
      return false;
    }
    model.data = JSON.parse(content);
    publicAPI.modified();
    return true;
  };

  publicAPI.requestData = (inData, outData) => {
    outData[0] = model.data;
  };

  // return Busy state
  publicAPI.isBusy = () => false;

  publicAPI.getNumberOfOutputPorts = () => model.numberOfOutputs;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // url: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['url']);
  macro.algo(publicAPI, model, 0, 1);
  macro.event(publicAPI, model, 'busy');

  // Object methods
  vtkJSONReader(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkJSONReader');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
