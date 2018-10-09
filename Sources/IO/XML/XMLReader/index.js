import pako from 'pako';
import { toByteArray } from 'base64-js';

import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';
import macro from 'vtk.js/Sources/macro';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import BinaryHelper from 'vtk.js/Sources/IO/Core/BinaryHelper';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

function stringToXML(xmlStr) {
  if (window.ActiveXObject) {
    const oXML = new window.ActiveXObject('Microsoft.XMLDOM');
    oXML.loadXML(xmlStr);
    return oXML;
  }
  return new DOMParser().parseFromString(xmlStr, 'application/xml');
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
    const uint8 = toByteArray(dataArrayElem.firstChild.nodeValue.trim());
    if (compressor === 'vtkZLibDataCompressor') {
      const buffer = new ArrayBuffer(
        TYPED_ARRAY_BYTES[dataType] * size * numberOfComponents
      );
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
      let offset =
        uint8.length -
        (header.reduce((a, b) => a + b, 0) -
          (header[0] + header[1] + header[2] + header[3]));
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
      values = new TYPED_ARRAY[dataType](
        uint8.buffer,
        TYPED_ARRAY_BYTES[headerType]
      ); // Skip the count

      // Handle (u)int64 hoping no overflow...
      if (dataType.indexOf('Int64') !== -1) {
        values = integer64to32(values);
      }
    }
  } else if (format === 'appended') {
    let offset = Number(dataArrayElem.getAttribute('offset'));
    // read header
    // NOTE: this will incorrectly read the size if headerType is (U)Int64 and
    // the value requires (U)Int64.
    const header = new TYPED_ARRAY[headerType](binaryBuffer, offset, 1);
    let arraySize = header[0] / TYPED_ARRAY_BYTES[dataType];

    // if we are dealing with Uint64, we need to get double the values since
    // TYPED_ARRAY[Uint64] is Uint32.
    if (dataType.indexOf('Int64') !== -1) {
      arraySize *= 2;
    }

    offset += TYPED_ARRAY_BYTES[headerType];

    // read values
    // if offset is aligned to dataType, use view. Otherwise, slice due to misalignment.
    if (offset % TYPED_ARRAY_BYTES[dataType] === 0) {
      values = new TYPED_ARRAY[dataType](binaryBuffer, offset, arraySize);
    } else {
      values = new TYPED_ARRAY[dataType](
        binaryBuffer.slice(offset, offset + header[0])
      );
    }
    // remove higher order 32 bits assuming they're not used.
    if (dataType.indexOf('Int64') !== -1) {
      values = integer64to32(values);
    }
  } else {
    console.error('Format not supported', format);
  }

  return { name, values, numberOfComponents };
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
    const doc = stringToXML(content);
    const rootElem = doc.firstChild;
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
    if (rootElem.querySelector('AppendedData')) {
      const appendedDataElem = rootElem.querySelector('AppendedData');
      const encoding = appendedDataElem.getAttribute('encoding');
      // Only get data arrays that are descendants of <Piece />
      // We don't parse DataArrays from FieldData right now.
      const arrayElems = rootElem.querySelectorAll('Piece DataArray');

      let appendedBuffer = model.binaryBuffer;

      if (encoding === 'base64') {
        // substr(1) is to remove the '_' prefix
        appendedBuffer = appendedDataElem.textContent.trim().substr(1);
      }

      // get data array chunks
      const dataArrays = [];
      for (let i = 0; i < arrayElems.length; ++i) {
        const offset = Number(arrayElems[i].getAttribute('offset'));
        let nextOffset = 0;
        if (i === arrayElems.length - 1) {
          nextOffset = appendedBuffer.length || appendedBuffer.byteLength;
        } else {
          nextOffset = Number(arrayElems[i + 1].getAttribute('offset'));
        }

        if (encoding === 'base64') {
          dataArrays.push(
            toByteArray(appendedBuffer.substring(offset, nextOffset))
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

          // Header reading
          // Refer to processDataArray() above for info on header fields
          const header = readerHeader(dataArray, headerType);
          const nbBlocks = header[1];
          let compressedOffset =
            dataArray.length -
            (header.reduce((a, b) => a + b, 0) -
              (header[0] + header[1] + header[2] + header[3]));

          let buffer = null;
          if (nbBlocks > 0) {
            // If the last block's size is labeled as 0, that means the last block
            // really has size header[2].
            if (header[3] === 0) {
              buffer = new ArrayBuffer(header[2] * nbBlocks);
            } else {
              buffer = new ArrayBuffer(header[2] * (nbBlocks - 1) + header[3]);
            }
          } else {
            // if there is no blocks, then default to a zero array of size 0.
            buffer = new ArrayBuffer(0);
          }

          // uncompressed buffer
          const uncompressed = new Uint8Array(buffer);
          const output = {
            offset: 0,
            uint8: uncompressed,
          };

          for (let i = 0; i < nbBlocks; i++) {
            const blockSize = header[4 + i];
            const compressedBlock = new Uint8Array(
              dataArray.buffer,
              compressedOffset,
              blockSize
            );
            uncompressBlock(compressedBlock, output);
            compressedOffset += blockSize;
          }

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
        arrayElems[i].setAttribute('offset', offset);
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
