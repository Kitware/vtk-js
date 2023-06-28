import { create } from 'xmlbuilder2';
import { decompressSync } from 'fflate';

import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';
import Base64 from 'vtk.js/Sources/Common/Core/Base64';
import macro from 'vtk.js/Sources/macros';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkStringArray from 'vtk.js/Sources/Common/Core/StringArray';
import BinaryHelper from 'vtk.js/Sources/IO/Core/BinaryHelper';

// Enable data soure for DataAccessHelper
import 'vtk.js/Sources/IO/Core/DataAccessHelper/LiteHttpDataAccessHelper'; // Just need HTTP
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper'; // HTTP + zip
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/HtmlDataAccessHelper'; // html + base64 + zip
// import 'vtk.js/Sources/IO/Core/DataAccessHelper/JSZipDataAccessHelper'; // zip

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

export function findAllTags(node, tagName) {
  return [...node.getElementsByTagName(tagName)];
}

export function findFirstTag(node, tagName) {
  return findAllTags(node, tagName)[0];
}

function parseXML(xmlStr) {
  // see xmlbuilder2 docs on the object format
  return create(xmlStr);
}

function extractAppendedData(buffer) {
  // search for appended data tag
  const prefixRegex = /^\s*<AppendedData\s+encoding="raw">\s*_/m;
  const suffixRegex = /\n\s*<\/AppendedData>/m;
  return BinaryHelper.extractBinary(buffer, prefixRegex, suffixRegex);
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
  return array.filter((v, i) => i < maxIdx && i % 2 === 0);
}

// ----------------------------------------------------------------------------

/**
 * Reads the data of a length-prefixed blob.
 *
 * Int64 headers and values are not supported.
 *
 * @param {Uint8Array} uint8 a uint8 view of the length-prefixed blob.
 * @param {string} dataType
 * @param {string} headerType either UInt64 or UInt32
 */
function readLengthPrefixedData(uint8, dataType, headerType) {
  if (!['UInt64', 'UInt32'].includes(headerType)) {
    throw new Error(`Cannot handle a header type of ${headerType}`);
  }

  let HeaderTypedArray = TYPED_ARRAY[headerType];
  let DataTypedArray = TYPED_ARRAY[dataType];
  let dataFallbackTo32 = false;

  if (headerType === 'UInt64') {
    HeaderTypedArray = TYPED_ARRAY.UInt32;
  }

  if (/^U?Int64$/.test(dataType)) {
    dataFallbackTo32 = true;
    DataTypedArray = TYPED_ARRAY[dataType.replace('64', '32')];
  }

  const { byteOffset } = uint8;
  const dataWordSize = TYPED_ARRAY_BYTES[dataType];
  const headerWordSize = TYPED_ARRAY_BYTES[headerType];

  // slice if offset is not word aligned
  let header;
  if (byteOffset % headerWordSize === 0) {
    header = new HeaderTypedArray(uint8.buffer, byteOffset, 1);
  } else {
    header = new HeaderTypedArray(
      uint8.buffer.slice(byteOffset, byteOffset + headerWordSize)
    );
  }

  const dataByteLength = Number(header[0]);

  // read values
  let values;
  let arraySize = dataByteLength / dataWordSize;

  if (dataFallbackTo32) {
    // We are reading int64 data with an int32 typed array.
    arraySize *= 2;
  }

  // slice if offset is not word aligned
  const dataOffset = byteOffset + headerWordSize;
  if (dataOffset % dataWordSize === 0) {
    values = new DataTypedArray(uint8.buffer, dataOffset, arraySize);
  } else {
    values = new DataTypedArray(
      uint8.buffer.slice(dataOffset, dataOffset + dataByteLength)
    );
  }

  if (dataFallbackTo32) {
    // remove higher order 32 bits
    values = integer64to32(values);
  }

  return values;
}

// ----------------------------------------------------------------------------

function readerHeader(uint8, headerType) {
  // We do not handle endianness or if more than 32 bits are needed to encode the data
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

/**
 * Given the return value of readerHeader, return header byte length.
 */
function getHeaderByteLength(header, headerType) {
  // ignore the first number, which isn't actually part of the header.
  const [headerWordSize] = header;
  return (header.length - 1) * headerWordSize;
}

// ----------------------------------------------------------------------------

function uncompressBlock(compressedUint8, output) {
  const uncompressedBlock = decompressSync(compressedUint8);
  output.uint8.set(uncompressedBlock, output.offset);
  output.offset += uncompressedBlock.length;
}

// ----------------------------------------------------------------------------

function decompressZLib(bytes, headerType) {
  // ----------------------------------------------------------------------
  // Layout of the data
  // header[N, s1, s2, blockSize1, ..., blockSizeN], [padding???], block[compressedData], ..., block[compressedData]
  // [header] N, s1 and s2 are uint 32 or 64 (defined by header_type="UInt64" attribute on the root node)
  // [header] s1: uncompress size of each block except the last one
  // [header] s2: uncompress size of the last blocks
  // [header] blockSize: size of the block in compressed space that represent to bloc to inflate in zlib. (This also give the offset to the next block)
  // ----------------------------------------------------------------------

  // Header reading: [offset, numBlocks, s1, s2]
  const header = readerHeader(bytes, headerType);
  const nbBlocks = header[1];
  const s1 = header[2];
  const s2 = header[3];
  let dataByteLength = 0;

  if (nbBlocks > 0) {
    // If the last block's size is labeled as 0, that means the last block
    // really has size header[2].
    if (s2 === 0) {
      dataByteLength = nbBlocks * s1;
    } else {
      dataByteLength = (nbBlocks - 1) * s1 + s2;
    }
  }

  const buffer = new ArrayBuffer(dataByteLength);
  const output = {
    offset: 0,
    uint8: new Uint8Array(buffer),
  };

  let offset = getHeaderByteLength(header, headerType);
  // Starting from end of the data header, find the zlib header, which starts with 0x78.
  // This accounts for any padding between the header and the compressed data.
  while (offset < bytes.length && bytes[offset] !== 0x78) {
    offset++;
  }

  for (let i = 0; i < nbBlocks; i++) {
    const blockSize = header[4 + i];
    const compressedBlock = new Uint8Array(bytes.buffer, offset, blockSize);
    uncompressBlock(compressedBlock, output);
    offset += blockSize;
  }

  return output.uint8;
}

// ----------------------------------------------------------------------------

function processDataArray(
  size,
  dataArrayElem,
  compressor,
  byteOrder,
  headerType,
  binaryBuffer
) {
  const dataType = dataArrayElem.getAttribute('type');
  const name = dataArrayElem.getAttribute('Name');
  const format = dataArrayElem.getAttribute('format'); // binary, ascii, appended
  const numberOfComponents = Number(
    dataArrayElem.getAttribute('NumberOfComponents') || '1'
  );
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
    const uint8 = new Uint8Array(
      Base64.toArrayBuffer(dataArrayElem.firstChild.nodeValue.trim())
    );
    if (compressor === 'vtkZLibDataCompressor') {
      const data = decompressZLib(uint8, headerType);
      values = new TYPED_ARRAY[dataType](data.buffer);

      // Handle (u)int64 hoping for no overflow...
      if (/^U?Int64$/.test(dataType)) {
        values = integer64to32(values);
      }
    } else {
      values = new TYPED_ARRAY[dataType](
        uint8.buffer,
        TYPED_ARRAY_BYTES[headerType]
      );

      // Handle (u)int64 hoping no overflow...
      if (dataType.indexOf('Int64') !== -1) {
        values = integer64to32(values);
      }
    }
  } else if (format === 'appended') {
    const offset = Number(dataArrayElem.getAttribute('offset'));
    values = readLengthPrefixedData(
      new Uint8Array(binaryBuffer, offset),
      dataType,
      headerType
    );
  } else {
    console.error('Format not supported', format);
  }

  return { name, values, numberOfComponents };
}

// ----------------------------------------------------------------------------

function decodeStringArrayFromBytes(bytes) {
  const decoder = new TextDecoder();
  const decoded = decoder.decode(bytes);

  // strings are null-terminated
  return decoded.split('\x00').slice(0, -1);
}

// ----------------------------------------------------------------------------

function processStringArray(
  stringArrayElem,
  compressor,
  byteOrder,
  headerType,
  binaryBuffer
) {
  const name = stringArrayElem.getAttribute('Name');
  const format = stringArrayElem.getAttribute('format'); // binary, ascii, appended
  const numberOfComponents = Number(
    stringArrayElem.getAttribute('NumberOfComponents') || '1'
  );
  const numberOfTuples = Number(
    stringArrayElem.getAttribute('NumberOfTuples') || '1'
  );
  const nbStrings = numberOfTuples * numberOfComponents;
  const strings = [];

  if (format === 'ascii') {
    const tokens = stringArrayElem.firstChild.nodeValue.trim().split(/\s+/);
    let tokIdx = 0;
    const strChars = [];

    while (strings.length < nbStrings) {
      const token = Number(tokens[tokIdx++]);
      if (token === 0) {
        strings.push(strChars.join(''));
        strChars.length = 0;
      } else {
        strChars.push(String.fromCharCode(token));
      }
    }
  } else if (format === 'binary') {
    const uint8 = new Uint8Array(
      Base64.toArrayBuffer(stringArrayElem.firstChild.nodeValue.trim())
    );
    if (compressor === 'vtkZLibDataCompressor') {
      const decompressed = decompressZLib(uint8, headerType);
      strings.push(...decodeStringArrayFromBytes(decompressed));
    } else {
      const strData = readLengthPrefixedData(uint8, 'UInt8', headerType);
      strings.push(...decodeStringArrayFromBytes(strData));
    }
  } else if (format === 'appended') {
    const offset = Number(stringArrayElem.getAttribute('offset'));
    const values = readLengthPrefixedData(
      new Uint8Array(binaryBuffer, offset),
      'UInt8',
      headerType
    );
    strings.push(...decodeStringArrayFromBytes(values));
  } else {
    macro.vtkErrorMacro(`Format not supported: ${format}`);
  }

  return { name, values: strings, numberOfComponents };
}

// ----------------------------------------------------------------------------

function processCells(
  size,
  containerElem,
  compressor,
  byteOrder,
  headerType,
  binaryBuffer
) {
  const arrayElems = {};
  const dataArrayElems = containerElem.getElementsByTagName('DataArray');
  for (let elIdx = 0; elIdx < dataArrayElems.length; elIdx++) {
    const el = dataArrayElems[elIdx];
    arrayElems[el.getAttribute('Name')] = el;
  }

  const offsets = processDataArray(
    size,
    arrayElems.offsets,
    compressor,
    byteOrder,
    headerType,
    binaryBuffer
  ).values;
  const connectivitySize = offsets[offsets.length - 1];
  const connectivity = processDataArray(
    connectivitySize,
    arrayElems.connectivity,
    compressor,
    byteOrder,
    headerType,
    binaryBuffer
  ).values;
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

function processFieldData(
  size,
  fieldElem,
  fieldContainer,
  compressor,
  byteOrder,
  headerType,
  binaryBuffer
) {
  if (fieldElem) {
    const attributes = ['Scalars', 'Vectors', 'Normals', 'Tensors', 'TCoords'];
    const nameBinding = {};
    attributes.forEach((attrName) => {
      const arrayName = fieldElem.getAttribute(attrName);
      if (arrayName) {
        nameBinding[arrayName] = fieldContainer[`set${attrName}`];
      }
    });

    const dataArrayElems = fieldElem.getElementsByTagName('DataArray');
    const nbArrays = dataArrayElems.length;
    for (let idx = 0; idx < nbArrays; idx++) {
      const array = dataArrayElems[idx];
      const dataArray = vtkDataArray.newInstance(
        processDataArray(
          size,
          array,
          compressor,
          byteOrder,
          headerType,
          binaryBuffer
        )
      );
      const name = dataArray.getName();
      (nameBinding[name] || fieldContainer.addArray)(dataArray);
    }
  }
}

// ----------------------------------------------------------------------------
function handleFieldDataArrays(
  fieldDataElem,
  compressor,
  byteOrder,
  headerType,
  binaryBuffer
) {
  const dataArrays = [...fieldDataElem.getElementsByTagName('DataArray')].map(
    (daElem) =>
      vtkDataArray.newInstance(
        processDataArray(
          Number(daElem.getAttribute('NumberOfTuples')),
          daElem,
          compressor,
          byteOrder,
          headerType,
          binaryBuffer
        )
      )
  );

  const stringArrays = [...fieldDataElem.getElementsByTagName('Array')]
    .filter((elem) => elem.getAttribute('type') === 'String')
    .map((arrElem) => {
      const sa = vtkStringArray.newInstance(
        processStringArray(
          arrElem,
          compressor,
          byteOrder,
          headerType,
          binaryBuffer
        )
      );
      return sa;
    });

  return [...dataArrays, ...stringArrays];
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
    return model.dataAccessHelper.fetchBinary(url, option);
  }

  // Set DataSet url
  publicAPI.setUrl = (url, option = {}) => {
    model.url = url;

    // Remove the file in the URL
    const path = url.split('/');
    path.pop();
    model.baseURL = path.join('/');

    // Fetch metadata
    return publicAPI.loadData(option);
  };

  // Fetch the actual data arrays
  publicAPI.loadData = (option = {}) =>
    fetchData(model.url, option).then(publicAPI.parseAsArrayBuffer);

  publicAPI.parseAsArrayBuffer = (arrayBuffer) => {
    if (!arrayBuffer) {
      return false;
    }
    if (arrayBuffer !== model.rawDataBuffer) {
      publicAPI.modified();
    } else {
      return true;
    }

    const { text: content, binaryBuffer } = extractAppendedData(arrayBuffer);
    model.rawDataBuffer = arrayBuffer;
    model.binaryBuffer = binaryBuffer;

    // Parse data here...
    const doc = parseXML(content);
    const root = doc.root();
    const rootElem = root.node;
    const type = rootElem.getAttribute('type');
    const compressor = rootElem.getAttribute('compressor');
    const byteOrder = rootElem.getAttribute('byte_order');
    // default to UInt32. I think version 0.1 vtp/vti files default to UInt32.
    const headerType = rootElem.getAttribute('header_type') || 'UInt32';

    if (compressor && compressor !== 'vtkZLibDataCompressor') {
      console.error('Invalid compressor', compressor);
      return false;
    }

    if (byteOrder && byteOrder !== 'LittleEndian') {
      console.error('Only LittleEndian encoding is supported');
      return false;
    }

    if (type !== model.dataType) {
      console.error('Invalid data type', type, 'expecting', model.dataType);
      return false;
    }

    // appended format
    if (findFirstTag(rootElem, 'AppendedData')) {
      const appendedDataElem = findFirstTag(rootElem, 'AppendedData');
      const encoding = appendedDataElem.getAttribute('encoding');
      const arrays = root
        .filter(
          (xmlNode) => {
            const { node } = xmlNode;
            return (
              node.nodeType === Node.ELEMENT_NODE &&
              node.getAttribute('format') === 'appended' &&
              node.hasAttribute('offset')
            );
          },
          false,
          true
        )
        .map((xmlNode) => ({
          node: xmlNode.node,
          offset: Number(xmlNode.node.getAttribute('offset')),
        }));

      // sort dataElems by increasing offset
      arrays.sort((a, b) => a.offset - b.offset);

      let appendedBuffer = model.binaryBuffer;

      if (encoding === 'base64') {
        // substr(1) is to remove the '_' prefix
        appendedBuffer = appendedDataElem.textContent.trim().substr(1);
      }

      // get data array chunks
      const dataArrays = [];
      for (let i = 0; i < arrays.length; ++i) {
        const offset = arrays[i].offset;
        let nextOffset = 0;
        if (i === arrays.length - 1) {
          nextOffset = appendedBuffer.length || appendedBuffer.byteLength;
        } else {
          nextOffset = arrays[i + 1].offset;
        }

        if (encoding === 'base64') {
          dataArrays.push(
            new Uint8Array(
              Base64.toArrayBuffer(appendedBuffer.substring(offset, nextOffset))
            )
          );
        } else {
          // encoding === 'raw'
          // Need to slice the ArrayBuffer so readerHeader() works properly
          dataArrays.push(
            new Uint8Array(appendedBuffer.slice(offset, nextOffset))
          );
        }
      }

      if (compressor === 'vtkZLibDataCompressor') {
        for (let arrayidx = 0; arrayidx < dataArrays.length; ++arrayidx) {
          const dataArray = dataArrays[arrayidx];

          const uncompressed = decompressZLib(dataArray, headerType);

          const data = new Uint8Array(
            uncompressed.length + TYPED_ARRAY_BYTES[headerType]
          );
          // set length header
          // TODO this does not work for lengths that are greater than the max Uint32 value.
          new TYPED_ARRAY[headerType](data.buffer, 0, 1)[0] =
            uncompressed.length;
          data.set(uncompressed, TYPED_ARRAY_BYTES[headerType]);

          dataArrays[arrayidx] = data;
        }
      }

      const bufferLength = dataArrays.reduce((acc, arr) => acc + arr.length, 0);
      const buffer = new ArrayBuffer(bufferLength);
      const view = new Uint8Array(buffer);

      for (let i = 0, offset = 0; i < dataArrays.length; ++i) {
        // set correct offsets
        arrays[i].node.setAttribute('offset', offset);
        // set final buffer data
        view.set(dataArrays[i], offset);
        offset += dataArrays[i].length;
      }

      model.binaryBuffer = buffer;

      if (!model.binaryBuffer) {
        console.error(
          'Processing appended data format: requires binaryBuffer to parse'
        );
        return false;
      }
    }

    publicAPI.parseXML(rootElem, type, compressor, byteOrder, headerType);

    const datasetElem = rootElem.getElementsByTagName(type)[0];
    const fieldDataElem = datasetElem.getElementsByTagName('FieldData')[0];

    if (fieldDataElem) {
      const fieldDataArrays = handleFieldDataArrays(
        fieldDataElem,
        compressor,
        byteOrder,
        headerType,
        model.binaryBuffer
      );

      for (let i = 0; i < model.output.length; i++) {
        const fieldData = model.output[i].getFieldData();
        for (let j = 0; j < fieldDataArrays.length; j++) {
          fieldData.addArray(fieldDataArrays[j]);
        }
      }
    }

    return true;
  };

  publicAPI.requestData = (inData, outData) => {
    publicAPI.parseAsArrayBuffer(model.rawDataBuffer);
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

  // vtkXMLReader methods
  vtkXMLReader(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend, processDataArray, processFieldData, processCells };
