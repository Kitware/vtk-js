import * as macro from 'vtk.js/Sources/macro';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkWebGPUBuffer from 'vtk.js/Sources/Rendering/WebGPU/Buffer';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';
import Constants from './Constants';

const { BufferUsage, PrimitiveTypes } = Constants;
const { Representation } = vtkProperty;

const { vtkDebugMacro } = macro;

// the webgpu constants all show up as undefined
/* eslint-disable no-undef */

// const { ObjectType } = Constants;

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {};

function requestMatches(req1, req2) {
  if (req1.time !== req2.time) return false;
  if (req1.address !== req2.address) return false;
  if (req1.format !== req2.format) return false;
  if (req1.usage !== req2.usage) return false;
  if (req1.hash !== req2.hash) return false;
  return true;
}

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

function getPrimitiveName(primType) {
  switch (primType) {
    case PrimitiveTypes.Points:
      return 'points';
    case PrimitiveTypes.Lines:
      return 'lines';
    case PrimitiveTypes.Triangles:
      return 'polys';
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

  const shift = options.shift ? options.shift : 0;
  const scale = options.scale ? options.scale : 1;
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
  const packedVBO = new window[outputType](
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
      packedVBO[vboidx++] = scale * getData(i, cellid) + shift;
    };
  } else if (numComp === 2) {
    addAPoint = function addAPointFunc(i, cellid) {
      packedVBO[vboidx++] = scale * getData(i * 2, cellid * 2) + shift;
      packedVBO[vboidx++] = scale * getData(i * 2 + 1, cellid * 2 + 1) + shift;
    };
  } else if (numComp === 3 && !packExtra) {
    addAPoint = function addAPointFunc(i, cellid) {
      packedVBO[vboidx++] = scale * getData(i * 3, cellid * 3) + shift;
      packedVBO[vboidx++] = scale * getData(i * 3 + 1, cellid * 3 + 1) + shift;
      packedVBO[vboidx++] = scale * getData(i * 3 + 2, cellid * 3 + 2) + shift;
    };
  } else if (numComp === 3 && packExtra) {
    addAPoint = function addAPointFunc(i, cellid) {
      packedVBO[vboidx++] = scale * getData(i * 3, cellid * 3) + shift;
      packedVBO[vboidx++] = scale * getData(i * 3 + 1, cellid * 3 + 1) + shift;
      packedVBO[vboidx++] = scale * getData(i * 3 + 2, cellid * 3 + 2) + shift;
      packedVBO[vboidx++] = scale * 1.0 + shift;
    };
  } else if (numComp === 4) {
    addAPoint = function addAPointFunc(i, cellid) {
      packedVBO[vboidx++] = scale * getData(i * 4, cellid * 4) + shift;
      packedVBO[vboidx++] = scale * getData(i * 4 + 1, cellid * 4 + 1) + shift;
      packedVBO[vboidx++] = scale * getData(i * 4 + 2, cellid * 4 + 2) + shift;
      packedVBO[vboidx++] = scale * getData(i * 4 + 3, cellid * 4 + 3) + shift;
    };
  }

  let cellId = options.cellOffset;
  for (let index = 0; index < size; ) {
    func(array[index], array, index + 1, cellId);
    index += array[index] + 1;
    cellId++;
  }
  result.address = packedVBO;
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

function getStrideFromFormat(format) {
  if (!format) return 0;
  let numComp = 1;
  if (format.substring(format.length - 2) === 'x4') numComp = 4;
  if (format.substring(format.length - 2) === 'x3') numComp = 3;
  if (format.substring(format.length - 2) === 'x2') numComp = 2;

  let typeSize = 4;
  if (numComp > 1) {
    if (format.substring(format.length - 3, format.length - 1) === '8x') {
      typeSize = 1;
    }
    if (format.substring(format.length - 4, format.length - 1) === '16x') {
      typeSize = 2;
    }
  } else {
    if (format.substring(format.length - 1) === '8') typeSize = 1;
    if (format.substring(format.length - 2) === '16') typeSize = 2;
  }
  return numComp * typeSize;
}

function getArrayTypeFromFormat(format) {
  if (!format) return null;
  if (format.substring(0, 7) === 'float32') return 'Float32Array';
  if (format.substring(0, 6) === 'snorm8') return 'Int8Array';
  if (format.substring(0, 6) === 'unorm8') return 'Uint8Array';
  return '';
}

// ----------------------------------------------------------------------------
// vtkWebGPUBufferManager methods
// ----------------------------------------------------------------------------

function vtkWebGPUBufferManager(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUBufferManager');

  // we cache based on the passed in source, when the source is
  // garbage collected then the cache entry is removed. If a source
  // is not provided then the buffer is NOT cached and you are on your own
  // if you want to share it etc
  publicAPI.getBuffer = (req) => {
    // if a dataArray is provided set the address
    if (req.dataArray) {
      req.address = req.dataArray.getData();
    }

    if (req.source) {
      // if a matching buffer already exists then return it
      if (model.buffers.has(req.source)) {
        const dabuffers = model.buffers.get(req.source);
        for (let i = 0; i < dabuffers.length; i++) {
          if (requestMatches(dabuffers[i].request, req)) {
            return dabuffers[i].buffer;
          }
        }
      }
    }

    // create one
    const buffer = vtkWebGPUBuffer.newInstance();
    buffer.setDevice(model.device);

    const stride = getStrideFromFormat(req.format);
    const arrayType = getArrayTypeFromFormat(req.format);
    let gpuUsage = null;

    // handle uniform buffers
    if (req.usage === BufferUsage.UniformArray) {
      /* eslint-disable no-bitwise */
      gpuUsage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;
      /* eslint-enable no-bitwise */
      buffer.createAndWrite(req.address, gpuUsage);
    }

    // handle textures
    if (req.usage === BufferUsage.Texture) {
      /* eslint-disable no-bitwise */
      gpuUsage = GPUBufferUsage.COPY_SRC;
      /* eslint-enable no-bitwise */
      buffer.createAndWrite(req.address, gpuUsage);
      buffer.setArrayInformation([{ offset: 0, format: req.format }]);
    }

    // handle point data
    if (req.usage === BufferUsage.PointArray) {
      gpuUsage = GPUBufferUsage.VERTEX;
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
      // console.log(result);
      buffer.createAndWrite(result.address, gpuUsage);
      buffer.setStrideInBytes(stride);
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
      buffer.setStrideInBytes(stride);
      buffer.setArrayInformation([{ offset: 0, format: req.format }]);
    }

    buffer.setSourceTime(req.time);

    // cache the buffer if we have a dataArray.
    // We create a new req that only has the 4 fields required for
    // a comparison to avoid GC cycles
    if (req.source) {
      if (!model.buffers.has(req.source)) {
        model.buffers.set(req.source, []);
      }

      const dabuffers = model.buffers.get(req.dataArray);
      dabuffers.push({
        request: {
          time: req.time,
          address: req.address,
          format: req.format,
          usage: req.usage,
        },
        buffer,
      });
    }
    return buffer;
  };

  publicAPI.getFullScreenQuadBuffer = () => {
    if (model.fullScreenQuadBuffer) {
      return model.fullScreenQuadBuffer;
    }

    model.fullScreenQuadBuffer = vtkWebGPUBuffer.newInstance();
    model.fullScreenQuadBuffer.setDevice(model.device);

    // prettier-ignore
    const array = new Float32Array([
      -1.0, -1.0, 1.0,
       1.0, -1.0, 1.0,
       1.0, 1.0, 1.0,
      -1.0, -1.0, 1.0,
       1.0, 1.0, 1.0,
      -1.0, 1.0, 1.0,
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

  // this is a cache, and a cache with GC pretty much means WeakMap
  model.buffers = new WeakMap();

  macro.setGet(publicAPI, model, ['device']);

  vtkWebGPUBufferManager(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...STATIC, ...Constants };
