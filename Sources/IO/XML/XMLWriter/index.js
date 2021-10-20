import { create } from 'xmlbuilder2';
import pako from 'pako';

import macro from 'vtk.js/Sources/macros';
import { fromArrayBuffer } from 'vtk.js/Sources/Common/Core/Base64';
import {
  FormatTypes,
  TYPED_ARRAY,
} from 'vtk.js/Sources/IO/XML/XMLWriter/Constants';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

function compressBlock(uncompressed) {
  return pako.deflate(uncompressed);
}

function processDataArray(
  dataArray,
  format,
  blockSize,
  compressor = 'vtkZLibDataCompressor'
) {
  if (format === FormatTypes.ASCII) {
    return dataArray.getData().join(' ');
  }
  if (format === FormatTypes.BINARY) {
    if (compressor === 'vtkZLibDataCompressor') {
      // ----------------------------------------------------------------------
      // Layout of the data
      // header[N, s1, s1, blockSize1, ..., blockSizeN], [padding???], block[compressedData], ..., block[compressedData]
      // [header] N, s1 and s2 are uint 32 or 64 (defined by header_type="UInt64" attribute on the root node)
      // [header] s1: uncompress size of each block except the last one
      // [header] s2: uncompress size of the last blocks
      // [header] blockSize: size of the block in compressed space that represent to bloc to inflate in zlib. (This also give the offset to the next block)
      // ----------------------------------------------------------------------

      const componentUint8Size = dataArray.getElementComponentSize();
      const uncompressedUint8Size =
        dataArray.getNumberOfValues() * componentUint8Size;
      const blockUint8Size = blockSize;
      const nbFullBlocks = Math.trunc(uncompressedUint8Size / blockUint8Size);
      const lastBlockUint8Size = uncompressedUint8Size % blockUint8Size;
      const nbBlocks = nbFullBlocks + (lastBlockUint8Size ? 1 : 0);
      const header = new Uint32Array(3 + nbBlocks);
      header[0] = nbBlocks; // N
      header[1] = blockUint8Size; // s1
      header[2] = lastBlockUint8Size; // s2

      let totalUint8Length = 0;
      const blocks = [];
      let dataOffset = 0;
      const lastBlockId = nbBlocks - 1;
      for (let blockId = 0; blockId < nbBlocks; ++blockId) {
        const currentBlockUint8Size =
          lastBlockUint8Size === 0 || blockId < lastBlockId
            ? blockUint8Size
            : header[2];
        const uncompressedBlock = new Uint8Array(
          dataArray.getData().buffer,
          dataOffset,
          currentBlockUint8Size
        );
        dataOffset += blockUint8Size;
        const compressedUint8Block = compressBlock(uncompressedBlock);
        blocks.push(compressedUint8Block);
        header[3 + blockId] = compressedUint8Block.length;
        totalUint8Length += compressedUint8Block.length;
      }
      const uint8 = new Uint8Array(totalUint8Length);
      let uint8Offset = 0;
      const headerUint8 = new Uint8Array(header.buffer);
      for (let blockId = 0; blockId < nbBlocks; ++blockId) {
        uint8.set(blocks[blockId], uint8Offset);
        uint8Offset += header[3 + blockId];
      }
      return (
        fromArrayBuffer(headerUint8.buffer) + fromArrayBuffer(uint8.buffer)
      );
    }
    throw new Error('Only vtkZLibDataCompressor is supported');
  }
  if (format === FormatTypes.APPENDED) {
    throw new Error('Appended format is not supported');
  }
  throw new Error('Format is not supported');
}

// ----------------------------------------------------------------------------
// vtkXMLWriter methods
// ----------------------------------------------------------------------------

function vtkXMLWriter(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkXMLWriter');

  // Can be overridden in subclass
  publicAPI.create = (dataObject) =>
    create()
      .ele('VTKFile')
      .att('type', model.dataType)
      .att('version', '0.1')
      .att('byte_order', 'LittleEndian')
      .att('header_type', 'UInt32')
      .att(
        'compressor',
        model.format === FormatTypes.ASCII ? '' : 'vtkZLibDataCompressor'
      );

  publicAPI.write = (object) => publicAPI.create(object).end({ pretty: true });

  publicAPI.processDataSetAttributes = (
    parentElement,
    name,
    datasetAttributes
  ) => {
    const activeAttributes = {};
    const attrTypes = [
      'Scalars',
      'Vectors',
      'Normals',
      'TCoords',
      'Tensors',
      'GlobalIds',
      'PedigreeIds',
    ];
    attrTypes.forEach((attrType) => {
      const activeAttribute = datasetAttributes.getActiveAttribute(attrType);
      if (activeAttribute) {
        activeAttributes[attrType] = activeAttribute.getName();
      }
    });

    const datasetAttributesEle = parentElement.ele(name, activeAttributes);

    for (let i = 0; i < datasetAttributes.getNumberOfArrays(); ++i) {
      publicAPI.processDataArray(
        datasetAttributesEle,
        datasetAttributes.getArrayByIndex(i)
      );
    }
    return datasetAttributesEle;
  };

  publicAPI.processDataArray = (parentEle, scalars) =>
    parentEle
      .ele('DataArray', {
        type: TYPED_ARRAY[scalars.getDataType()],
        Name: scalars.getName(),
        format: publicAPI.getFormat(),
        RangeMin: scalars.getRange()[0],
        RangeMax: scalars.getRange()[1],
        NumberOfComponents: scalars.getNumberOfComponents(),
      })
      .txt(
        processDataArray(
          scalars,
          publicAPI.getFormat(),
          publicAPI.getBlockSize()
        )
      );

  publicAPI.requestData = (inData, outData) => {
    model.file = publicAPI.write(inData);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  blockSize: 1024,
  // file: null,
  format: FormatTypes.BINARY,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['blockSize', 'format']);
  macro.get(publicAPI, model, ['file']);
  macro.algo(publicAPI, model, 1, 0);

  // vtkXMLWriter methods
  vtkXMLWriter(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend, compressBlock, processDataArray, FormatTypes };
