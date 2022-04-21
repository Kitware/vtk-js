import * as macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkWebGPUBuffer from 'vtk.js/Sources/Rendering/WebGPU/Buffer';
import vtkWebGPUTypes from 'vtk.js/Sources/Rendering/WebGPU/Types';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';
import Constants from './Constants';

const { BufferUsage, PrimitiveTypes } = Constants;
const { Representation } = vtkProperty;

const { vtkDebugMacro, vtkErrorMacro } = macro;

const { VtkDataTypes } = vtkDataArray;

// the webgpu constants all show up as undefined
/* eslint-disable no-undef */

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {};

const cellCounters = {
  // easy, every input point becomes an output point
  anythingToPoints(numPoints, cellPts) {
    return numPoints;
  },
  linesToWireframe(numPoints, cellPts) {
    if (numPoints > 1) {
      return (numPoints - 1) * 2;
    }
    return 0;
  },
  polysToWireframe(numPoints, cellPts) {
    if (numPoints > 2) {
      return numPoints * 2;
    }
    return 0;
  },
  stripsToWireframe(numPoints, cellPts) {
    if (numPoints > 2) {
      return numPoints * 4 - 6;
    }
    return 0;
  },
  polysToSurface(npts, cellPts) {
    if (npts > 2) {
      return (npts - 2) * 3;
    }
    return 0;
  },
  stripsToSurface(npts, cellPts, offset) {
    if (numPoints > 2) {
      return (npts - 2) * 3;
    }
    return 0;
  },
};

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

function getPrimitiveName(primType) {
  switch (primType) {
    case PrimitiveTypes.Points:
      return 'points';
    case PrimitiveTypes.Lines:
      return 'lines';
    case PrimitiveTypes.Triangles:
    case PrimitiveTypes.TriangleEdges:
      return 'polys';
    case PrimitiveTypes.TriangleStripEdges:
    case PrimitiveTypes.TriangleStrips:
      return 'strips';
    default:
      return '';
  }
}

function getOutputSize(cellArray, representation, inRepName) {
  let countFunc = null;
  if (representation === Representation.POINTS || inRepName === 'points') {
    countFunc = cellCounters.anythingToPoints;
  } else if (
    representation === Representation.WIREFRAME ||
    inRepName === 'lines'
  ) {
    countFunc = cellCounters[`${inRepName}ToWireframe`];
  } else {
    countFunc = cellCounters[`${inRepName}ToSurface`];
  }

  const array = cellArray.getData();
  const size = array.length;
  let caboCount = 0;
  for (let index = 0; index < size; ) {
    caboCount += countFunc(array[index], array);
    index += array[index] + 1;
  }
  return caboCount;
}

function packArray(
  cellArray,
  primType,
  representation,
  inArray,
  outputType,
  options
) {
  const result = { elementCount: 0, blockSize: 0, stride: 0 };
  if (!cellArray.getData() || !cellArray.getData().length) {
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
  const pointData = inArray.getData();

  let addAPoint;

  const cellBuilders = {
    // easy, every input point becomes an output point
    anythingToPoints(numPoints, cellPts, offset, cellId) {
      for (let i = 0; i < numPoints; ++i) {
        addAPoint(cellPts[offset + i], cellId);
      }
    },
    linesToWireframe(numPoints, cellPts, offset, cellId) {
      // for lines we add a bunch of segments
      for (let i = 0; i < numPoints - 1; ++i) {
        addAPoint(cellPts[offset + i], cellId);
        addAPoint(cellPts[offset + i + 1], cellId);
      }
    },
    polysToWireframe(numPoints, cellPts, offset, cellId) {
      // for polys we add a bunch of segments and close it
      if (numPoints > 2) {
        for (let i = 0; i < numPoints; ++i) {
          addAPoint(cellPts[offset + i], cellId);
          addAPoint(cellPts[offset + ((i + 1) % numPoints)], cellId);
        }
      }
    },
    stripsToWireframe(numPoints, cellPts, offset, cellId) {
      if (numPoints > 2) {
        // for strips we add a bunch of segments and close it
        for (let i = 0; i < numPoints - 1; ++i) {
          addAPoint(cellPts[offset + i], cellId);
          addAPoint(cellPts[offset + i + 1], cellId);
        }
        for (let i = 0; i < numPoints - 2; i++) {
          addAPoint(cellPts[offset + i], cellId);
          addAPoint(cellPts[offset + i + 2], cellId);
        }
      }
    },
    polysToSurface(npts, cellPts, offset, cellId) {
      for (let i = 0; i < npts - 2; i++) {
        addAPoint(cellPts[offset + 0], cellId);
        addAPoint(cellPts[offset + i + 1], cellId);
        addAPoint(cellPts[offset + i + 2], cellId);
      }
    },
    stripsToSurface(npts, cellPts, offset, cellId) {
      for (let i = 0; i < npts - 2; i++) {
        addAPoint(cellPts[offset + i], cellId);
        addAPoint(cellPts[offset + i + 1 + (i % 2)], cellId);
        addAPoint(cellPts[offset + i + 1 + ((i + 1) % 2)], cellId);
      }
    },
  };

  const inRepName = getPrimitiveName(primType);
  let func = null;
  if (
    representation === Representation.POINTS ||
    primType === PrimitiveTypes.Points
  ) {
    func = cellBuilders.anythingToPoints;
  } else if (
    representation === Representation.WIREFRAME ||
    primType === PrimitiveTypes.Lines
  ) {
    func = cellBuilders[`${inRepName}ToWireframe`];
  } else {
    func = cellBuilders[`${inRepName}ToSurface`];
  }

  const array = cellArray.getData();
  const size = array.length;
  const caboCount = getOutputSize(cellArray, representation, inRepName);
  let vboidx = 0;

  const numComp = inArray.getNumberOfComponents();
  const packedVBO = macro.newTypedArray(
    outputType,
    caboCount * (numComp + (packExtra ? 1 : 0))
  );

  // pick the right function based on point versus cell data
  let getData = (ptId, cellId) => pointData[ptId];
  if (options.cellData) {
    getData = (ptId, cellId) => pointData[cellId];
  }

  // add data based on number of components
  if (numComp === 1) {
    addAPoint = function addAPointFunc(i, cellid) {
      packedVBO[vboidx++] = scale[0] * getData(i, cellid) + shift[0];
    };
  } else if (numComp === 2) {
    addAPoint = function addAPointFunc(i, cellid) {
      packedVBO[vboidx++] = scale[0] * getData(i * 2, cellid * 2) + shift[0];
      packedVBO[vboidx++] =
        scale[1] * getData(i * 2 + 1, cellid * 2 + 1) + shift[1];
    };
  } else if (numComp === 3 && !packExtra) {
    addAPoint = function addAPointFunc(i, cellid) {
      packedVBO[vboidx++] = scale[0] * getData(i * 3, cellid * 3) + shift[0];
      packedVBO[vboidx++] =
        scale[1] * getData(i * 3 + 1, cellid * 3 + 1) + shift[1];
      packedVBO[vboidx++] =
        scale[2] * getData(i * 3 + 2, cellid * 3 + 2) + shift[2];
    };
  } else if (numComp === 3 && packExtra) {
    addAPoint = function addAPointFunc(i, cellid) {
      packedVBO[vboidx++] = scale[0] * getData(i * 3, cellid * 3) + shift[0];
      packedVBO[vboidx++] =
        scale[1] * getData(i * 3 + 1, cellid * 3 + 1) + shift[1];
      packedVBO[vboidx++] =
        scale[2] * getData(i * 3 + 2, cellid * 3 + 2) + shift[2];
      packedVBO[vboidx++] = scale[3] * 1.0 + shift[3];
    };
  } else if (numComp === 4) {
    addAPoint = function addAPointFunc(i, cellid) {
      packedVBO[vboidx++] = scale[0] * getData(i * 4, cellid * 4) + shift[0];
      packedVBO[vboidx++] =
        scale[1] * getData(i * 4 + 1, cellid * 4 + 1) + shift[1];
      packedVBO[vboidx++] =
        scale[2] * getData(i * 4 + 2, cellid * 4 + 2) + shift[2];
      packedVBO[vboidx++] =
        scale[3] * getData(i * 4 + 3, cellid * 4 + 3) + shift[3];
    };
  }

  let cellId = options.cellOffset;
  for (let index = 0; index < size; ) {
    func(array[index], array, index + 1, cellId);
    index += array[index] + 1;
    cellId++;
  }
  result.nativeArray = packedVBO;
  result.elementCount = caboCount;
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

function generateNormals(cellArray, primType, representation, inArray) {
  if (!cellArray.getData() || !cellArray.getData().length) {
    return null;
  }

  const pointData = inArray.getData();

  let addAPoint;

  const cellBuilders = {
    polysToPoints(numPoints, cellPts, offset) {
      const normal = getNormal(
        pointData,
        cellPts[offset],
        cellPts[offset + 1],
        cellPts[offset + 2]
      );
      for (let i = 0; i < numPoints; ++i) {
        addAPoint(normal);
      }
    },
    polysToWireframe(numPoints, cellPts, offset) {
      // for polys we add a bunch of segments and close it
      // compute the normal
      const normal = getNormal(
        pointData,
        cellPts[offset],
        cellPts[offset + 1],
        cellPts[offset + 2]
      );
      for (let i = 0; i < numPoints; ++i) {
        addAPoint(normal);
        addAPoint(normal);
      }
    },
    polysToSurface(npts, cellPts, offset) {
      if (npts < 3) {
        // ignore degenerate triangles
        vtkDebugMacro('skipping degenerate triangle');
      } else {
        // compute the normal
        const normal = getNormal(
          pointData,
          cellPts[offset],
          cellPts[offset + 1],
          cellPts[offset + 2]
        );
        for (let i = 0; i < npts - 2; i++) {
          addAPoint(normal);
          addAPoint(normal);
          addAPoint(normal);
        }
      }
    },
  };

  const primName = getPrimitiveName(primType);

  let func = null;
  if (representation === Representation.POINTS) {
    func = cellBuilders[`${primName}ToPoints`];
  } else if (representation === Representation.WIREFRAME) {
    func = cellBuilders[`${primName}ToWireframe`];
  } else {
    func = cellBuilders[`${primName}ToSurface`];
  }

  const caboCount = getOutputSize(cellArray, representation, primName);
  let vboidx = 0;

  const packedVBO = new Int8Array(caboCount * 4);

  addAPoint = function addAPointFunc(normal) {
    packedVBO[vboidx++] = 127 * normal[0];
    packedVBO[vboidx++] = 127 * normal[1];
    packedVBO[vboidx++] = 127 * normal[2];
    packedVBO[vboidx++] = 127;
  };

  const array = cellArray.getData();
  const size = array.length;
  for (let index = 0; index < size; ) {
    func(array[index], array, index + 1);
    index += array[index] + 1;
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

    // create one
    const buffer = vtkWebGPUBuffer.newInstance({ label: req.label });
    buffer.setDevice(model.device);

    let gpuUsage = null;

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
        req.cells,
        req.primitiveType,
        req.representation,
        req.dataArray,
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
      buffer.setArrayInformation([{ offset: 0, format: req.format }]);
    }

    // handle normals from points, snorm8x4
    if (req.usage === BufferUsage.NormalsFromPoints) {
      gpuUsage = GPUBufferUsage.VERTEX;
      const normals = generateNormals(
        req.cells,
        req.primitiveType,
        req.representation,
        req.dataArray
      );
      buffer.createAndWrite(normals, gpuUsage);
      buffer.setStrideInBytes(
        vtkWebGPUTypes.getByteStrideFromBufferFormat(req.format)
      );
      buffer.setArrayInformation([{ offset: 0, format: req.format }]);
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

  publicAPI.getBufferForPointArray = (
    dataArray,
    cells,
    primitiveType,
    representation
  ) => {
    const format = _getFormatForDataArray(dataArray);
    const buffRequest = {
      hash: `PA${representation}P${primitiveType}D${dataArray.getMTime()}C${cells.getMTime()}${format}`,
      usage: BufferUsage.PointArray,
      format,
      dataArray,
      cells,
      primitiveType,
      representation,
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
