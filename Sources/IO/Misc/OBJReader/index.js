import * as macro from '../../../macro';
import vtkPolyData from '../../../Common/DataModel/PolyData';
import vtkPoints from '../../../Common/Core/Points';
import DataAccessHelper from '../../Core/DataAccessHelper';

// ----------------------------------------------------------------------------

const data = {};

// ----------------------------------------------------------------------------

function begin() {
  data.g = [];
  data.o = [];
  data.v = [];
  data.f = [];
  data.size = 0;
}

// ----------------------------------------------------------------------------

function vertexIndex(str) {
  return Number(str.split('//')[0]) - 1;
}

// ----------------------------------------------------------------------------

function parseLine(line) {
  if (line[0] === '#') {
    return;
  }
  const tokens = line.split(' ');
  if (tokens[0] === 'o') {
    data.o.push(tokens[1]);
    data.f.push([]);
    data.size++;
  } else if (tokens[0] === 'g') {
    data.g.push(tokens[1]);
    if (data.g.length > 1) {
      data.f.push([]);
      data.size++;
    }
  } else if (tokens[0] === 'v') {
    data.v.push(Number(tokens[1]));
    data.v.push(Number(tokens[2]));
    data.v.push(Number(tokens[3]));
    if (data.size === 0) {
      data.size++;
      data.o.push(`Geometry ${data.size}`);
      data.f.push([]);
    }
  } else if (tokens[0] === 'f') {
    // Handle triangles for now
    const cells = data.f[data.size - 1];
    cells.push(3);
    cells.push(vertexIndex(tokens[1]));
    cells.push(vertexIndex(tokens[2]));
    cells.push(vertexIndex(tokens[3]));
  }
}

// ----------------------------------------------------------------------------

function end(model) {
  const points = vtkPoints.newInstance();
  points.setData(Float32Array.from(data.v), 3);

  if (model.splitGroup) {
    model.numberOfOutputs = data.size;
    for (let idx = 0; idx < data.size; idx++) {
      const polydata = vtkPolyData.newInstance();
      polydata.setPoints(points);
      polydata.getPolys().setData(Uint32Array.from(data.f[idx]));
      polydata.set({ name: data.g[idx] || data.o[idx] });
      model.output[idx] = polydata;
    }
  } else {
    model.numberOfOutputs = 1;
    const polydata = vtkPolyData.newInstance();
    polydata.setPoints(points);
    polydata.getPolys().setData(Uint32Array.from([].concat(...data.f)));
    model.output[0] = polydata;
  }
}

// ----------------------------------------------------------------------------
// vtkElevationReader methods
// ----------------------------------------------------------------------------

export function vtkObjReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkObjReader');

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
    if (url.indexOf('.obj') === -1 && !option.fullpath) {
      model.baseURL = url;
      model.url = `${url}/index.obj`;
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
  publicAPI.loadData = () => {
    const promise = fetchData(model.url);
    promise.then(publicAPI.parse);
    return promise;
  };

  publicAPI.parse = (content) => {
    publicAPI.modified();
    model.numberOfOutputs = 0;
    begin();
    content.split('\n').forEach(parseLine);
    end(model);
  };

  publicAPI.requestData = (inData, outData) => {
    // Nothing to do
  };

  // return Busy state
  publicAPI.isBusy = () => !!model.requestCount;

  publicAPI.getNumberOfOutputPorts = () => model.numberOfOutputs;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  numberOfOutputs: 1,
  requestCount: 0,
  splitGroup: false,
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
  macro.algo(publicAPI, model, 0, 1);
  macro.event(publicAPI, model, 'busy');

  // Object methods
  vtkObjReader(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkObjReader');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
