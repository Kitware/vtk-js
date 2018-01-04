import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';
import macro from 'vtk.js/Sources/macro';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

// ----------------------------------------------------------------------------
// vtkSTLReader methods
// ----------------------------------------------------------------------------

function vtkSTLReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSTLReader');

  // Create default dataAccessHelper if not available
  if (!model.dataAccessHelper) {
    model.dataAccessHelper = DataAccessHelper.get('http');
  }

  // Internal method to fetch Array
  function fetchData(url, option = {}) {
    const compression = model.compression;
    const progressCallback = model.progressCallback;
    if (option.binary) {
      return model.dataAccessHelper.fetchBinary(url, {
        compression,
        progressCallback,
      });
    }
    return model.dataAccessHelper.fetchText(publicAPI, url, {
      compression,
      progressCallback,
    });
  }

  // Set DataSet url
  publicAPI.setUrl = (url, option = { binary: true }) => {
    model.url = url;

    // Remove the file in the URL
    const path = url.split('/');
    path.pop();
    model.baseURL = path.join('/');

    model.compression = option.compression;

    // Fetch metadata
    return publicAPI.loadData({
      progressCallback: option.progressCallback,
      binary: !!option.binary,
    });
  };

  // Fetch the actual data arrays
  publicAPI.loadData = (option = {}) => {
    const promise = fetchData(model.url, option);
    promise.then(publicAPI.parse);
    return promise;
  };

  publicAPI.parse = (content) => {
    if (typeof content === 'string') {
      publicAPI.parseASCII(content);
    } else {
      const decoder = new TextDecoder();
      const bytes = new Uint8Array(content);
      const strContent = decoder.decode(bytes);
      if (strContent.startsWith('solid')) {
        publicAPI.parseASCII(content);
      } else {
        publicAPI.parseBinary(content);
      }
    }
  };

  publicAPI.parseBinary = (content) => {
    if (!content) {
      return;
    }
    if (content !== model.parseData) {
      publicAPI.modified();
    } else {
      return;
    }

    model.parseData = content;

    // Binary parsing
    const dataView = new DataView(content, 84);
    global.dataview = dataView;
    const nbFaces = (content.byteLength - 84) / 50;
    const pointValues = new Float32Array(nbFaces * 9);
    const normalValues = new Float32Array(nbFaces * 3);
    const cellValues = new Uint32Array(nbFaces * 4);
    const cellDataValues = new Uint16Array(nbFaces);
    let cellOffset = 0;

    for (let faceIdx = 0; faceIdx < nbFaces; faceIdx++) {
      const offset = faceIdx * 50;
      normalValues[faceIdx * 3 + 0] = dataView.getFloat32(offset + 0, true);
      normalValues[faceIdx * 3 + 1] = dataView.getFloat32(offset + 4, true);
      normalValues[faceIdx * 3 + 2] = dataView.getFloat32(offset + 8, true);

      pointValues[faceIdx * 9 + 0] = dataView.getFloat32(offset + 12, true);
      pointValues[faceIdx * 9 + 1] = dataView.getFloat32(offset + 16, true);
      pointValues[faceIdx * 9 + 2] = dataView.getFloat32(offset + 20, true);
      pointValues[faceIdx * 9 + 3] = dataView.getFloat32(offset + 24, true);
      pointValues[faceIdx * 9 + 4] = dataView.getFloat32(offset + 28, true);
      pointValues[faceIdx * 9 + 5] = dataView.getFloat32(offset + 32, true);
      pointValues[faceIdx * 9 + 6] = dataView.getFloat32(offset + 36, true);
      pointValues[faceIdx * 9 + 7] = dataView.getFloat32(offset + 40, true);
      pointValues[faceIdx * 9 + 8] = dataView.getFloat32(offset + 44, true);

      cellValues[cellOffset++] = 3;
      cellValues[cellOffset++] = faceIdx * 3 + 0;
      cellValues[cellOffset++] = faceIdx * 3 + 1;
      cellValues[cellOffset++] = faceIdx * 3 + 2;

      cellDataValues[faceIdx] = dataView.getUint16(offset + 48, true);
    }

    const polydata = vtkPolyData.newInstance();
    polydata.getPoints().setData(pointValues, 3);
    polydata.getPolys().setData(cellValues);
    polydata
      .getCellData()
      .setScalars(
        vtkDataArray.newInstance({ name: 'Attribute', values: cellDataValues })
      );
    polydata.getCellData().setNormals(
      vtkDataArray.newInstance({
        name: 'Normals',
        values: normalValues,
        numberOfComponents: 3,
      })
    );

    // Add new output
    model.output[0] = polydata;
  };

  publicAPI.parseASCII = (content) => {
    if (!content) {
      return;
    }
    if (content !== model.parseData) {
      publicAPI.modified();
    } else {
      return;
    }

    model.parseData = content;

    // ASCII parsing
    console.error('Not yet implemented');
  };

  publicAPI.requestData = (inData, outData) => {
    publicAPI.parse(model.parseData);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // baseURL: null,
  // dataAccessHelper: null,
  // url: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['url', 'baseURL']);
  macro.setGet(publicAPI, model, ['dataAccessHelper']);
  macro.algo(publicAPI, model, 0, 1);

  // vtkSTLReader methods
  vtkSTLReader(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkSTLReader');

// ----------------------------------------------------------------------------

export default { extend, newInstance };
