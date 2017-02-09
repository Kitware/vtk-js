import macro            from 'vtk.js/Sources/macro';
import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';
import vtkDataArray     from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPoints        from 'vtk.js/Sources/Common/Core/Points';
import vtkPolyData      from 'vtk.js/Sources/Common/DataModel/PolyData';

// ----------------------------------------------------------------------------

const data = {};

// ----------------------------------------------------------------------------

function begin(splitMode) {
  data.splitOn = splitMode;
  data.pieces = [];
  data.v = [];
  data.vt = [];
  data.f = [];
  data.size = 0;
}

// ----------------------------------------------------------------------------

function vertexIndex(str) {
  return Number(str.split('/')[0]) - 1;
}

// ----------------------------------------------------------------------------

function parseLine(line) {
  if (line[0] === '#') {
    return;
  }
  const tokens = line.split(' ');
  if (tokens[0] === data.splitOn) {
    data.pieces.push(tokens[1]);
    data.f.push([]);
    data.size++;
  } else if (tokens[0] === 'v') {
    data.v.push(Number(tokens[1]));
    data.v.push(Number(tokens[2]));
    data.v.push(Number(tokens[3]));
    if (data.size === 0) {
      data.size++;
      data.f.push([]);
    }
  } else if (tokens[0] === 'vt') {
    data.vt.push(Number(tokens[1]));
    data.vt.push(Number(tokens[2]));
  } else if (tokens[0] === 'f') {
    // Handle triangles for now
    const cells = data.f[data.size - 1];
    const size = tokens.length - 1;
    cells.push(size);
    for (let i = 0; i < size; i++) {
      cells.push(vertexIndex(tokens[i + 1]));
    }
  }
}

// ----------------------------------------------------------------------------

function end(model) {
  const points = vtkPoints.newInstance();
  points.setData(Float32Array.from(data.v), 3);
  let tcoords = null;
  if (data.vt.length) {
    tcoords = vtkDataArray.newInstance({ numberOfComponents: 2, values: Float32Array.from(data.vt), name: 'TextureCoordinates' });
  }

  while (data.pieces.length < data.f.length) {
    data.pieces.push(`Geometry #${data.pieces.length}`);
  }

  if (model.splitMode) {
    model.numberOfOutputs = data.size;
    for (let idx = 0; idx < data.size; idx++) {
      const polydata = vtkPolyData.newInstance();
      polydata.setPoints(points);
      polydata.getPolys().setData(Uint32Array.from(data.f[idx]));
      polydata.set({ name: data.pieces[idx] }, true);
      model.output[idx] = polydata;

      if (tcoords) {
        polydata.getPointData().setTCoords(tcoords);
      }
    }
  } else {
    model.numberOfOutputs = 1;
    const polydata = vtkPolyData.newInstance();
    polydata.setPoints(points);
    polydata.getPolys().setData(Uint32Array.from([].concat(...data.f)));
    model.output[0] = polydata;

    if (tcoords) {
      polydata.getPointData().setTCoords(tcoords);
    }
  }
}

// ----------------------------------------------------------------------------
// vtkOBJReader methods
// ----------------------------------------------------------------------------

export function vtkOBJReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOBJReader');

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
    if (!content) {
      return;
    }
    if (content !== model.parseData) {
      publicAPI.modified();
    }
    model.parseData = content;
    model.numberOfOutputs = 0;
    begin(model.splitMode);
    content.split('\n').forEach(parseLine);
    end(model);
  };

  publicAPI.requestData = (inData, outData) => {
    publicAPI.parse(model.parseData);
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
  splitMode: null,
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
    'splitMode',
  ]);
  macro.algo(publicAPI, model, 0, 1);
  macro.event(publicAPI, model, 'busy');

  // Object methods
  vtkOBJReader(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOBJReader');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
