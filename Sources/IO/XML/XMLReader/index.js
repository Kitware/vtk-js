import pako from 'pako';
import { toByteArray } from 'base64-js';

import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';
import macro            from 'vtk.js/Sources/macro';
import vtkDataArray     from 'vtk.js/Sources/Common/Core/DataArray';

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
  Int64: Int32Array, // Not supported with JavaScript will cause error in binary
  UInt64: Uint32Array, // Not supported with JavaScript will cause error in binary
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

  return { name, values, numberOfComponents };
}

// ----------------------------------------------------------------------------

function processCells(size, containerElem, compressor, byteOrder) {
  const arrayElems = {};
  const dataArrayElems = containerElem.getElementsByTagName('DataArray');
  for (let elIdx = 0; elIdx < dataArrayElems.length; elIdx++) {
    const el = dataArrayElems[elIdx];
    arrayElems[el.getAttribute('Name')] = el;
  }

  const offsets = processDataArray(size, arrayElems.offsets, compressor, byteOrder).values;
  const connectivitySize = offsets[offsets.length - 1];
  const connectivity = processDataArray(connectivitySize, arrayElems.connectivity, compressor, byteOrder).values;
  const values = new Uint32Array(size + connectivitySize);
  let writeOffset = 0;
  let previousOffset = 0;
  offsets.forEach((v) => {
    const cellSize = v - previousOffset;
    values[writeOffset++] = cellSize;

    for (let i = 0; i < cellSize; i++) {
      values[writeOffset++] = connectivity[previousOffset + i];
    }

    // save previous offset
    previousOffset = v;
  });

  return values;
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
      const dataArray = vtkDataArray.newInstance(processDataArray(size, array, compressor, byteOrder));
      const name = dataArray.getName();
      (nameBinding[name] || fieldContainer.addArray)(dataArray);
    }
  }
}

// ----------------------------------------------------------------------------
// vtkXMLReader methods
// ----------------------------------------------------------------------------

function vtkXMLReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkXMLReader');

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

    if (type !== model.dataType) {
      console.error('Invalid data type', type, 'expecting', model.dataType);
      return;
    }

    publicAPI.parseXML(rootElem, type, compressor, byteOrder);
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

  // vtkXMLReader methods
  vtkXMLReader(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend, processDataArray, processFieldData, processCells };
