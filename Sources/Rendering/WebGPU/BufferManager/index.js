import * as macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkWebGPUBuffer from 'vtk.js/Sources/Rendering/WebGPU/Buffer';
import vtkWebGPUIndexBuffer from 'vtk.js/Sources/Rendering/WebGPU/IndexBuffer';
import vtkWebGPUTypes from 'vtk.js/Sources/Rendering/WebGPU/Types';
import Constants from './Constants';

const { BufferUsage } = Constants;
const { vtkErrorMacro } = macro;
const { VtkDataTypes } = vtkDataArray;

// the webgpu constants all show up as undefined
/* eslint-disable no-undef */

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {};

function _getFormatForDataArray(dataArray) {
  let format;
  switch (dataArray.getDataType()) {
    case VtkDataTypes.UNSIGNED_CHAR:
      format = 'uint8';
      break;
    case VtkDataTypes.FLOAT:
      format = 'float32';
      break;
    case VtkDataTypes.UNSIGNED_INT:
      format = 'uint32';
      break;
    case VtkDataTypes.INT:
      format = 'sint32';
      break;
    case VtkDataTypes.DOUBLE:
      format = 'float32';
      break;
    case VtkDataTypes.UNSIGNED_SHORT:
      format = 'uint16';
      break;
    case VtkDataTypes.SHORT:
      format = 'sin16';
      break;
    default:
      format = 'float32';
      break;
  }
  switch (dataArray.getNumberOfComponents()) {
    case 2:
      format += 'x2';
      break;
    case 3:
      // only 32bit types support x3
      if (!format.contains('32')) {
        vtkErrorMacro(`unsupported x3 type for ${format}`);
      }
      format += 'x3';
      break;
    case 4:
      format += 'x4';
      break;
    default:
      break;
  }
  return format;
}

function packArray(indexBuffer, inArrayData, numComp, outputType, options) {
  const result = {};
  const flatSize = indexBuffer.getFlatSize();
  if (!flatSize) {
    return result;
  }

  // setup shift and scale
  let shift = [0.0, 0.0, 0.0, 0.0];
  if (options.shift) {
    if (options.shift.length) {
      shift = options.shift;
    } else {
      shift.fill(options.shift);
    }
  }
  let scale = [1.0, 1.0, 1.0, 1.0];
  if (options.scale) {
    if (options.scale.length) {
      scale = options.scale;
    } else {
      scale.fill(options.scale);
    }
  }
  const packExtra = Object.prototype.hasOwnProperty.call(options, 'packExtra')
    ? options.packExtra
    : false;

  let addAPoint;

  let vboidx = 0;
  const stride = numComp + (packExtra ? 1 : 0);
  const packedVBO = macro.newTypedArray(outputType, flatSize * stride);

  // pick the right function based on point versus cell data
  let flatIdMap = indexBuffer.getFlatIdToPointId();
  if (options.cellData) {
    flatIdMap = indexBuffer.getFlatIdToCellId();
  }

  // add data based on number of components
  if (numComp === 1) {
    addAPoint = function addAPointFunc(i) {
      packedVBO[vboidx++] = scale[0] * inArrayData[i] + shift[0];
    };
  } else if (numComp === 2) {
    addAPoint = function addAPointFunc(i) {
      packedVBO[vboidx++] = scale[0] * inArrayData[i] + shift[0];
      packedVBO[vboidx++] = scale[1] * inArrayData[i + 1] + shift[1];
    };
  } else if (numComp === 3 && !packExtra) {
    addAPoint = function addAPointFunc(i) {
      packedVBO[vboidx++] = scale[0] * inArrayData[i] + shift[0];
      packedVBO[vboidx++] = scale[1] * inArrayData[i + 1] + shift[1];
      packedVBO[vboidx++] = scale[2] * inArrayData[i + 2] + shift[2];
    };
  } else if (numComp === 3 && packExtra) {
    addAPoint = function addAPointFunc(i) {
      packedVBO[vboidx++] = scale[0] * inArrayData[i] + shift[0];
      packedVBO[vboidx++] = scale[1] * inArrayData[i + 1] + shift[1];
      packedVBO[vboidx++] = scale[2] * inArrayData[i + 2] + shift[2];
      packedVBO[vboidx++] = scale[3] * 1.0 + shift[3];
    };
  } else if (numComp === 4) {
    addAPoint = function addAPointFunc(i) {
      packedVBO[vboidx++] = scale[0] * inArrayData[i] + shift[0];
      packedVBO[vboidx++] = scale[1] * inArrayData[i + 1] + shift[1];
      packedVBO[vboidx++] = scale[2] * inArrayData[i + 2] + shift[2];
      packedVBO[vboidx++] = scale[3] * inArrayData[i + 3] + shift[3];
    };
  }

  // for each entry in the flat array process it
  for (let index = 0; index < flatSize; index++) {
    const inArrayId = numComp * flatIdMap[index];
    addAPoint(inArrayId);
  }

  result.nativeArray = packedVBO;
  return result;
}

function getNormal(pointData, i0, i1, i2) {
  const v1 = [
    pointData[i2 * 3] - pointData[i1 * 3],
    pointData[i2 * 3 + 1] - pointData[i1 * 3 + 1],
    pointData[i2 * 3 + 2] - pointData[i1 * 3 + 2],
  ];
  const v2 = [
    pointData[i0 * 3] - pointData[i1 * 3],
    pointData[i0 * 3 + 1] - pointData[i1 * 3 + 1],
    pointData[i0 * 3 + 2] - pointData[i1 * 3 + 2],
  ];
  const result = [];
  vtkMath.cross(v1, v2, result);
  vtkMath.normalize(result);
  return result;
}

function generateNormals(cellArray, pointArray) {
  const pointData = pointArray.getData();
  const cellArrayData = cellArray.getData();
  if (!cellArrayData || !pointData) {
    return null;
  }

  // return a cellArray of normals
  const packedVBO = new Int8Array(cellArray.getNumberOfCells() * 4);
  const size = cellArrayData.length;
  let vboidx = 0;

  for (let index = 0; index < size; ) {
    const normal = getNormal(
      pointData,
      cellArrayData[index + 1],
      cellArrayData[index + 2],
      cellArrayData[index + 3]
    );
    packedVBO[vboidx++] = 127 * normal[0];
    packedVBO[vboidx++] = 127 * normal[1];
    packedVBO[vboidx++] = 127 * normal[2];
    packedVBO[vboidx++] = 127;
    index += cellArrayData[index] + 1;
  }

  return packedVBO;
}

// ----------------------------------------------------------------------------
// vtkWebGPUBufferManager methods
// ----------------------------------------------------------------------------

function vtkWebGPUBufferManager(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUBufferManager');

  function _createBuffer(req) {
    // if a dataArray is provided set the nativeArray
    if (req.dataArray && !req.nativeArray) {
      req.nativeArray = req.dataArray.getData();
    }

    let buffer;
    let gpuUsage;

    // handle index buffers
    if (req.usage === BufferUsage.Index) {
      // todo change to FlattenedIndex to be more clear
      buffer = vtkWebGPUIndexBuffer.newInstance({ label: req.label });
      buffer.setDevice(model.device);
      /* eslint-disable no-bitwise */
      gpuUsage = GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST;
      /* eslint-enable no-bitwise */
      buffer.buildIndexBuffer(req);
      buffer.createAndWrite(req.nativeArray, gpuUsage);
      buffer.setArrayInformation([{ format: req.format }]);
    }

    // create one if not done already
    if (!buffer) {
      buffer = vtkWebGPUBuffer.newInstance({ label: req.label });
      buffer.setDevice(model.device);
    }

    // handle uniform buffers
    if (req.usage === BufferUsage.UniformArray) {
      /* eslint-disable no-bitwise */
      gpuUsage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;
      /* eslint-enable no-bitwise */
      buffer.createAndWrite(req.nativeArray, gpuUsage);
    }

    // handle storage buffers
    if (req.usage === BufferUsage.Storage) {
      /* eslint-disable no-bitwise */
      gpuUsage = GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST;
      /* eslint-enable no-bitwise */
      buffer.createAndWrite(req.nativeArray, gpuUsage);
    }

    // handle textures
    if (req.usage === BufferUsage.Texture) {
      /* eslint-disable no-bitwise */
      gpuUsage = GPUBufferUsage.COPY_SRC;
      /* eslint-enable no-bitwise */
      buffer.createAndWrite(req.nativeArray, gpuUsage);
    }

    // all of the below types that have gpuUsage = VERTEX require format
    // to be provided.

    // handle point data
    if (req.usage === BufferUsage.PointArray) {
      gpuUsage = GPUBufferUsage.VERTEX;
      const arrayType = vtkWebGPUTypes.getNativeTypeFromBufferFormat(
        req.format
      );
      const result = packArray(
        req.indexBuffer,
        req.dataArray.getData(),
        req.dataArray.getNumberOfComponents(),
        arrayType,
        {
          packExtra: req.packExtra,
          shift: req.shift,
          scale: req.scale,
          cellData: req.cellData,
          cellOffset: req.cellOffset,
        }
      );
      buffer.createAndWrite(result.nativeArray, gpuUsage);
      buffer.setStrideInBytes(
        vtkWebGPUTypes.getByteStrideFromBufferFormat(req.format)
      );
      buffer.setArrayInformation([
        {
          offset: 0,
          format: req.format,
          interpolation: req.cellData ? 'flat' : 'perspective',
        },
      ]);
    }

    // handle normals from points, snorm8x4
    if (req.usage === BufferUsage.NormalsFromPoints) {
      gpuUsage = GPUBufferUsage.VERTEX;
      const arrayType = vtkWebGPUTypes.getNativeTypeFromBufferFormat(
        req.format
      );
      const normals = generateNormals(req.cells, req.dataArray);
      const result = packArray(req.indexBuffer, normals, 4, arrayType, {
        cellData: true,
      });
      buffer.createAndWrite(result.nativeArray, gpuUsage);
      buffer.setStrideInBytes(
        vtkWebGPUTypes.getByteStrideFromBufferFormat(req.format)
      );
      buffer.setArrayInformation([
        { offset: 0, format: req.format, interpolation: 'flat' },
      ]);
    }

    if (req.usage === BufferUsage.RawVertex) {
      gpuUsage = GPUBufferUsage.VERTEX;
      buffer.createAndWrite(req.nativeArray, gpuUsage);
      buffer.setStrideInBytes(
        vtkWebGPUTypes.getByteStrideFromBufferFormat(req.format)
      );
      buffer.setArrayInformation([{ offset: 0, format: req.format }]);
    }

    buffer.setSourceTime(req.time);

    return buffer;
  }

  // is the buffer already present?
  publicAPI.hasBuffer = (hash) => model.device.hasCachedObject(hash);

  publicAPI.getBuffer = (req) => {
    // if we have a source the get/create/cache the buffer
    if (req.hash) {
      return model.device.getCachedObject(req.hash, _createBuffer, req);
    }

    return _createBuffer(req);
  };

  publicAPI.getBufferForPointArray = (dataArray, indexBuffer) => {
    const format = _getFormatForDataArray(dataArray);
    const buffRequest = {
      hash: `${dataArray.getMTime()}I${indexBuffer.getMTime()}${format}`,
      usage: BufferUsage.PointArray,
      format,
      dataArray,
      indexBuffer,
    };
    return publicAPI.getBuffer(buffRequest);
  };

  publicAPI.getFullScreenQuadBuffer = () => {
    if (model.fullScreenQuadBuffer) {
      return model.fullScreenQuadBuffer;
    }

    model.fullScreenQuadBuffer = vtkWebGPUBuffer.newInstance();
    model.fullScreenQuadBuffer.setDevice(model.device);

    // prettier-ignore
    const array = new Float32Array([
      -1.0, -1.0, 0.0,
       1.0, -1.0, 0.0,
       1.0, 1.0, 0.0,
      -1.0, -1.0, 0.0,
       1.0, 1.0, 0.0,
      -1.0, 1.0, 0.0,
    ]);
    model.fullScreenQuadBuffer.createAndWrite(array, GPUBufferUsage.VERTEX);
    model.fullScreenQuadBuffer.setStrideInBytes(12);
    model.fullScreenQuadBuffer.setArrayInformation([
      { offset: 0, format: 'float32x3' },
    ]);
    return model.fullScreenQuadBuffer;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  device: null,
  fullScreenQuadBuffer: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);

  macro.setGet(publicAPI, model, ['device']);

  vtkWebGPUBufferManager(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...STATIC, ...Constants };
