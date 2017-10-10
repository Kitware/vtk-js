import pako from 'pako';
import { toByteArray } from 'base64-js';

import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';
import macro            from 'vtk.js/Sources/macro';
import vtkDataArray     from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData     from 'vtk.js/Sources/Common/DataModel/ImageData';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

function stringToXML(xmlStr) {
  if (window.ActiveXObject) {
    const oXML = new window.ActiveXObject('Microsoft.XMLDOM');
    oXML.loadXML(xmlStr);
    return oXML;
  }
  return (new DOMParser()).parseFromString(xmlStr, 'application/xml');
}

// ----------------------------------------------------------------------------

const TYPED_ARRAY = {
  Int8: Int8Array,
  UInt8: Uint8Array,
  Int16: Int16Array,
  UInt16: Uint16Array,
  Int32: Int32Array,
  UInt32: Uint32Array,
  // Int64, // Not supported with JavaScript
  // UInt64, // Not supported with JavaScript
  Float32: Float32Array,
  Float64: Float64Array,
};

// ----------------------------------------------------------------------------

function processDataArray(size, dataArrayElem, compressor, byteOrder) {
  const dataType = dataArrayElem.getAttribute('type');
  const name = dataArrayElem.getAttribute('Name');
  const format = dataArrayElem.getAttribute('format'); // binary, ascii, [appended: not supported]
  const numberOfComponents = Number(dataArrayElem.getAttribute('NumberOfComponents') || '1');
  let values = null;

  if (format === 'ascii') {
    values = new TYPED_ARRAY[dataType](size * numberOfComponents);
    let offset = 0;
    dataArrayElem.firstChild.nodeValue.split(/[\\t \\n]+/).forEach((token) => {
      if (token.trim().length) {
        values[offset++] = Number(token);
      }
    });
  } else if (format === 'binary') {
    const uint8 = toByteArray(dataArrayElem.firstChild.nodeValue.trim());
    if (compressor === 'vtkZLibDataCompressor') {
      values = new TYPED_ARRAY[dataType](pako.inflate(uint8).buffer); // Not working but not sure to know why yet...
    } else {
      values = new TYPED_ARRAY[dataType](uint8.buffer);
    }
  } else {
    console.error('Format not supported', format);
  }

  return vtkDataArray.newInstance({ name, values, numberOfComponents });
}

// ----------------------------------------------------------------------------

function processFieldData(size, fieldElem, fieldContainer, compressor, byteOrder) {
  if (fieldElem) {
    const attributes = ['Scalars', 'Vectors', 'Normals', 'Tensors', 'TCoords'];
    const nameBinding = {};
    attributes.forEach((attrName) => {
      const arrayName = fieldElem.getAttribute(attrName);
      if (arrayName) {
        nameBinding[arrayName] = fieldContainer[`set${attrName}`];
      }
    });

    const arrays = fieldElem.children;
    const nbArrays = arrays.length;
    for (let idx = 0; idx < nbArrays; idx++) {
      const array = arrays[idx];
      const dataArray = processDataArray(size, array, compressor, byteOrder);
      const name = dataArray.getName();
      (nameBinding[name] || fieldContainer.addArray)(dataArray);
    }
  }
}

// ----------------------------------------------------------------------------
// vtkXMLImageDataReader methods
// ----------------------------------------------------------------------------

function vtkXMLImageDataReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkXMLImageDataReader');

  // Create default dataAccessHelper if not available
  if (!model.dataAccessHelper) {
    model.dataAccessHelper = DataAccessHelper.get('http');
  }

  // Internal method to fetch Array
  function fetchData(url, option = {}) {
    const compression = model.compression;
    const progressCallback = model.progressCallback;
    return model.dataAccessHelper.fetchText(publicAPI, url, { compression, progressCallback });
  }

  // Set DataSet url
  publicAPI.setUrl = (url, option = {}) => {
    model.url = url;

    // Remove the file in the URL
    const path = url.split('/');
    path.pop();
    model.baseURL = path.join('/');

    model.compression = option.compression;

    // Fetch metadata
    return publicAPI.loadData({ progressCallback: option.progressCallback });
  };

  // Fetch the actual data arrays
  publicAPI.loadData = (option = {}) => {
    const promise = fetchData(model.url, option);
    promise.then(publicAPI.parse);
    return promise;
  };

  publicAPI.parse = (content) => {
    if (!content) {
      return;
    }
    if (content !== model.parseData) {
      publicAPI.modified();
    } else {
      return;
    }

    model.parseData = content;

    // Parse data here...
    const doc = stringToXML(content);
    const rootElem = doc.firstChild;
    const type = rootElem.getAttribute('type');
    const compressor = rootElem.getAttribute('compressor');
    const byteOrder = rootElem.getAttribute('byte_order');

    if (compressor && compressor !== 'vtkZLibDataCompressor') {
      console.error('Invalid compressor', compressor);
      return;
    }

    if (type !== 'ImageData') {
      console.error('Invalid data type', type);
      return;
    }

    const imageDataElem = rootElem.getElementsByTagName('ImageData')[0];
    const origin = imageDataElem.getAttribute('Origin').split(' ').map(t => Number(t));
    const spacing = imageDataElem.getAttribute('Spacing').split(' ').map(t => Number(t));
    const pieces = imageDataElem.children;
    const nbPieces = pieces.length;

    for (let outputIndex = 0; outputIndex < nbPieces; outputIndex++) {
      // Create image data
      const piece = pieces[outputIndex];
      const extent = piece.getAttribute('Extent').split(' ').map(t => Number(t));
      const imageData = vtkImageData.newInstance({ origin, spacing, extent });

      // Fill data
      processFieldData(imageData.getNumberOfPoints(), doc.getElementsByTagName('PointData')[0], imageData.getPointData(), compressor, byteOrder);
      processFieldData(imageData.getNumberOfCells(), doc.getElementsByTagName('CellData')[0], imageData.getCellData(), compressor, byteOrder);

      // Add new output
      model.output[outputIndex++] = imageData;
    }
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
  macro.get(publicAPI, model, [
    'url',
    'baseURL',
  ]);
  macro.setGet(publicAPI, model, [
    'dataAccessHelper',
  ]);
  macro.algo(publicAPI, model, 0, 1);

  // vtkXMLImageDataReader methods
  vtkXMLImageDataReader(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkXMLImageDataReader');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
