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

/**
 * Extracts binary data out of a file bytearray given a prefix/suffix.
 */
function extractBinary(arrayBuffer, prefixRegex, suffixRegex = null) {
  // convert array buffer to string via fromCharCode so length is preserved
  const byteArray = new Uint8Array(arrayBuffer);
  const strArr = [];
  for (let i = 0; i < byteArray.length; ++i) {
    strArr[i] = String.fromCharCode(byteArray[i]);
  }
  const str = strArr.join('');

  const prefixMatch = prefixRegex.exec(str);
  if (!prefixMatch) {
    return { text: str };
  }

  const dataStartIndex = prefixMatch.index + prefixMatch[0].length;
  const strFirstHalf = str.substring(0, dataStartIndex);
  let retVal = null;

  const suffixMatch = suffixRegex ? suffixRegex.exec(str) : null;
  if (suffixMatch) {
    const strSecondHalf = str.substr(suffixMatch.index);
    retVal = {
      text: strFirstHalf + strSecondHalf,
      binaryBuffer: arrayBuffer.slice(dataStartIndex, suffixMatch.index),
    };
  } else {
    // no suffix, so just take all the data starting from dataStartIndex
    retVal = {
      text: strFirstHalf,
      binaryBuffer: arrayBuffer.slice(dataStartIndex),
    };
  }

  // TODO Maybe delete the internal ref to strArr from the match objs?
  retVal.prefixMatch = prefixMatch;
  retVal.suffixMatch = suffixMatch;
  return retVal;
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

const TYPED_ARRAY_BYTES = {
  Int8: 1,
  UInt8: 1,
  Int16: 2,
  UInt16: 2,
  Int32: 4,
  UInt32: 4,
  Int64: 8, // Not supported with JavaScript will cause error in binary
  UInt64: 8, // Not supported with JavaScript will cause error in binary
  Float32: 4,
  Float64: 8,
};

// ----------------------------------------------------------------------------

function integer64to32(array) {
  const maxIdx = array.length - 1; // Skip last
  return array.filter((v, i) => (i < maxIdx) && (i % 2) === 0);
}

// ----------------------------------------------------------------------------

function readerHeader(uint8, headerType) {
  // We do not handle endianess or if more than 32 bits are needed to encode the data
  if (headerType === 'UInt64') {
    const offset = 8;
    let uint32 = new Uint32Array(uint8.buffer, 0, 6);
    const nbBlocks = uint32[0];
    const s1 = uint32[2];
    const s2 = uint32[4];
    const resultArray = [offset, nbBlocks, s1, s2];
    uint32 = new Uint32Array(uint8.buffer, 3 * 8, nbBlocks * 2);
    for (let i = 0; i < nbBlocks; i++) {
      resultArray.push(uint32[i * 2]);
    }
    return resultArray;
  }
  // UInt32
  let uint32 = new Uint32Array(uint8.buffer, 0, 3);
  const offset = 4;
  const nbBlocks = uint32[0];
  const s1 = uint32[1];
  const s2 = uint32[2];
  const resultArray = [offset, nbBlocks, s1, s2];
  uint32 = new Uint32Array(uint8.buffer, 3 * 4, nbBlocks);
  for (let i = 0; i < nbBlocks; i++) {
    resultArray.push(uint32[i]);
  }
  return resultArray;
}

// ----------------------------------------------------------------------------

function uncompressBlock(compressedUint8, output) {
  const uncompressedBlock = pako.inflate(compressedUint8);
  output.uint8.set(uncompressedBlock, output.offset);
  output.offset += uncompressedBlock.length;
}

// ----------------------------------------------------------------------------

function processDataArray(size, dataArrayElem, compressor, byteOrder, headerType, binaryBuffer) {
  const dataType = dataArrayElem.getAttribute('type');
  const name = dataArrayElem.getAttribute('Name');
  const format = dataArrayElem.getAttribute('format'); // binary, ascii, appended
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
      const buffer = new ArrayBuffer(TYPED_ARRAY_BYTES[dataType] * size * numberOfComponents);
      values = new TYPED_ARRAY[dataType](buffer);
      const output = {
        offset: 0,
        uint8: new Uint8Array(buffer),
      };
      // ----------------------------------------------------------------------
      // Layout of the data
      // header[N, s1, s1, blockSize1, ..., blockSizeN], [padding???], block[compressedData], ..., block[compressedData]
      // [header] N, s1 and s2 are uint 32 or 64 (defined by header_type="UInt64" attribute on the root node)
      // [header] s1: uncompress size of each block except the last one
      // [header] s2: uncompress size of the last blocks
      // [header] blockSize: size of the block in compressed space that represent to bloc to inflate in zlib. (This also give the offset to the next block)
      // ----------------------------------------------------------------------
      // Header reading
      const header = readerHeader(uint8, headerType);
      const nbBlocks = header[1];
      let offset = uint8.length - (header.reduce((a, b) => a + b, 0) - (header[0] + header[1] + header[2] + header[3]));
      for (let i = 0; i < nbBlocks; i++) {
        const blockSize = header[4 + i];
        const compressedBlock = new Uint8Array(uint8.buffer, offset, blockSize);
        uncompressBlock(compressedBlock, output);
        offset += blockSize;
      }

      // Handle (u)int64 hoping for no overflow...
      if (dataType.indexOf('Int64') !== -1) {
        values = integer64to32(values);
      }
    } else {
      values = new TYPED_ARRAY[dataType](uint8.buffer, TYPED_ARRAY_BYTES[headerType]); // Skip the count

      // Handle (u)int64 hoping no overflow...
      if (dataType.indexOf('Int64') !== -1) {
        values = integer64to32(values);
      }
    }
  } else if (format === 'appended') {
    const offset = dataArrayElem.getAttribute('offset');
    // read header
    const header = binaryBuffer.slice(offset, offset + TYPED_ARRAY_BYTES[headerType]);
    const arraySize = (new TYPED_ARRAY[headerType](header))[0] / TYPED_ARRAY_BYTES[dataType];
    // read values
    values = new TYPED_ARRAY[dataType](binaryBuffer, offset + header.byteLength, arraySize);
  } else {
    console.error('Format not supported', format);
  }

  return { name, values, numberOfComponents };
}

// ----------------------------------------------------------------------------

function processCells(size, containerElem, compressor, byteOrder, headerType) {
  const arrayElems = {};
  const dataArrayElems = containerElem.getElementsByTagName('DataArray');
  for (let elIdx = 0; elIdx < dataArrayElems.length; elIdx++) {
    const el = dataArrayElems[elIdx];
    arrayElems[el.getAttribute('Name')] = el;
  }

  const offsets = processDataArray(size, arrayElems.offsets, compressor, byteOrder, headerType).values;
  const connectivitySize = offsets[offsets.length - 1];
  const connectivity = processDataArray(connectivitySize, arrayElems.connectivity, compressor, byteOrder, headerType).values;
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

function processFieldData(size, fieldElem, fieldContainer, compressor, byteOrder, headerType, binaryBuffer) {
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
      const dataArray = vtkDataArray.newInstance(processDataArray(size, array, compressor, byteOrder, headerType, binaryBuffer));
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

  publicAPI.parse = (content, binaryBuffer) => {
    if (!content) {
      return;
    }
    if (content !== model.parseData) {
      publicAPI.modified();
    } else {
      return;
    }

    model.parseData = content;
    // TODO maybe name as "appendDataBuffer"
    model.binaryBuffer = binaryBuffer;

    // Parse data here...
    const doc = stringToXML(content);
    const rootElem = doc.firstChild;
    const type = rootElem.getAttribute('type');
    const compressor = rootElem.getAttribute('compressor');
    const byteOrder = rootElem.getAttribute('byte_order');
    const headerType = rootElem.getAttribute('header_type');

    if (compressor && compressor !== 'vtkZLibDataCompressor') {
      console.error('Invalid compressor', compressor);
      return;
    }

    if (byteOrder && byteOrder !== 'LittleEndian') {
      console.error('Only LittleEndian encoding is supported');
      return;
    }

    if (type !== model.dataType) {
      console.error('Invalid data type', type, 'expecting', model.dataType);
      return;
    }

    // appended format
    if (rootElem.querySelector('AppendedData')) {
      const appendedDataElem = rootElem.querySelector('AppendedData');
      const encoding = appendedDataElem.getAttribute('encoding');

      if (encoding === 'base64') {
        // substr(1) is to remove the '_' prefix
        model.binaryBuffer = toByteArray(appendedDataElem.textContent.trim().substr(1)).buffer;
      }

      if (!model.binaryBuffer) {
        console.error('Processing appended data format: requires binaryBuffer to parse');
        return;
      }
    }

    publicAPI.parseXML(rootElem, type, compressor, byteOrder, headerType);
  };

  publicAPI.requestData = (inData, outData) => {
    publicAPI.parse(model.parseData, model.binaryBuffer);
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
