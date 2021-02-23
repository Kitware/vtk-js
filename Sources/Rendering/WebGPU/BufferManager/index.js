import macro from 'vtk.js/Sources/macro';
import Constants from 'vtk.js/Sources/Rendering/WebGPU/BufferManager/Constants';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkWebGPUBuffer from 'vtk.js/Sources/Rendering/WebGPU/Buffer';
import { BufferUsage, PrimitiveTypes } from './Constants';
import vtkProperty from 'vtk.js/Sources/Rendering/Core/Property';

const { Representation } = vtkProperty;

// const { ObjectType } = Constants;

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {};

function requestMatches(req1, req2) {
  if (req1.time != req2.time) return false;
  if (req1.address !== req2.address) return false;
  if (req1.format != req2.format) return false;
  if (req1.usage != req2.usage) return false;
  return true;
}

const cellCounters = {
  // easy, every input point becomes an output point
  anythingToPoints(numPoints, cellPts) {
    return numPoints;
  },
  linesToWireframe(numPoints, cellPts) {
    return (numPoints - 1) * 2;
  },
  polysToWireframe(numPoints, cellPts) {
    return numPoints * 2;
  },
  stripsToWireframe(numPoints, cellPts) {
    return numPoints * 4 - 6;
  },
  polysToSurface(npts, cellPts) {
    if (npts < 3) {
      return 0;
    }
    return (npts - 2) * 3;
  },
  stripsToSurface(npts, cellPts, offset) {
    return (npts - 2) * 3;
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
  const packExtra = options.hasOwnProperty('packExtra')
    ? options.packExtra
    : false;
  const pointData = inArray.getData();

  let pos = 0;
  let addAPoint;

  const cellBuilders = {
    // easy, every input point becomes an output point
    anythingToPoints(numPoints, cellPts, offset) {
      for (let i = 0; i < numPoints; ++i) {
        addAPoint(cellPts[offset + i]);
      }
    },
    linesToWireframe(numPoints, cellPts, offset) {
      // for lines we add a bunch of segments
      for (let i = 0; i < numPoints - 1; ++i) {
        addAPoint(cellPts[offset + i]);
        addAPoint(cellPts[offset + i + 1]);
      }
    },
    polysToWireframe(numPoints, cellPts, offset) {
      // for polys we add a bunch of segments and close it
      for (let i = 0; i < numPoints; ++i) {
        addAPoint(cellPts[offset + i]);
        addAPoint(cellPts[offset + ((i + 1) % numPoints)]);
      }
    },
    stripsToWireframe(numPoints, cellPts, offset) {
      // for strips we add a bunch of segments and close it
      for (let i = 0; i < numPoints - 1; ++i) {
        addAPoint(cellPts[offset + i]);
        addAPoint(cellPts[offset + i + 1]);
      }
      for (let i = 0; i < numPoints - 2; i++) {
        addAPoint(cellPts[offset + i]);
        addAPoint(cellPts[offset + i + 2]);
      }
    },
    polysToSurface(npts, cellPts, offset) {
      if (npts < 3) {
        // ignore degenerate triangles
        vtkDebugMacro('skipping degenerate triangle');
      } else {
        for (let i = 0; i < npts - 2; i++) {
          addAPoint(cellPts[offset + 0]);
          addAPoint(cellPts[offset + i + 1]);
          addAPoint(cellPts[offset + i + 2]);
        }
      }
    },
    stripsToSurface(npts, cellPts, offset) {
      for (let i = 0; i < npts - 2; i++) {
        addAPoint(cellPts[offset + i]);
        addAPoint(cellPts[offset + i + 1 + (i % 2)]);
        addAPoint(cellPts[offset + i + 1 + ((i + 1) % 2)]);
      }
    },
  };

  // if (colorData !== null) {
  //   if (options.haveCellScalars) {
  //     colorIdx = (cellCount + options.cellOffset) * colorComponents;
  //   } else {
  //     colorIdx = i * colorComponents;
  //   }
  //   packedUCVBO[ucidx++] = colorData[colorIdx++];
  //   packedUCVBO[ucidx++] = colorData[colorIdx++];
  //   packedUCVBO[ucidx++] = colorData[colorIdx++];
  //   packedUCVBO[ucidx++] =
  //     colorComponents === 4 ? colorData[colorIdx++] : 255;
  // }

  let inRepName = getPrimitiveName(primType);

  let func = null;
  if (
    representation === Representation.POINTS ||
    primType == PrimitiveTypes.Points
  ) {
    func = cellBuilders.anythingToPoints;
  } else if (
    representation === Representation.WIREFRAME ||
    primType == PrimitiveTypes.Lines
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

  if (numComp == 1) {
    addAPoint = function addAPointFunc(i) {
      packedVBO[vboidx++] = scale * pointData[i] + shift;
    };
  } else if (numComp == 2) {
    addAPoint = function addAPointFunc(i) {
      packedVBO[vboidx++] = scale * pointData[i * 2] + shift;
      packedVBO[vboidx++] = scale * pointData[i * 2 + 1] + shift;
    };
  } else if (numComp == 3 && !packExtra) {
    addAPoint = function addAPointFunc(i) {
      pos = i * 3;
      packedVBO[vboidx++] = scale * pointData[pos++] + shift;
      packedVBO[vboidx++] = scale * pointData[pos++] + shift;
      packedVBO[vboidx++] = scale * pointData[pos] + shift;
    };
  } else if (numComp == 3 && packExtra) {
    addAPoint = function addAPointFunc(i) {
      pos = i * 3;
      packedVBO[vboidx++] = scale * pointData[pos++] + shift;
      packedVBO[vboidx++] = scale * pointData[pos++] + shift;
      packedVBO[vboidx++] = scale * pointData[pos] + shift;
      packedVBO[vboidx++] = scale * 1.0 + shift;
    };
  } else if (numComp == 4) {
    addAPoint = function addAPointFunc(i) {
      pos = i * 4;
      packedVBO[vboidx++] = scale * pointData[pos++] + shift;
      packedVBO[vboidx++] = scale * pointData[pos++] + shift;
      packedVBO[vboidx++] = scale * pointData[pos++] + shift;
      packedVBO[vboidx++] = scale * pointData[pos] + shift;
    };
  }

  for (let index = 0; index < size; ) {
    func(array[index], array, index + 1);
    index += array[index] + 1;
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
  let result = [];
  vtkMath.cross(v1, v2, result);
  vtkMath.normalize(result);
  return result;
}

function generateNormals(cellArray, primType, representation, inArray) {
  if (!cellArray.getData() || !cellArray.getData().length) {
    return null;
  }

  const pointData = inArray.getData();

  let pos = 0;
  let addAPoint;

  const cellBuilders = {
    polysToWireframe(numPoints, cellPts, offset) {
      // for polys we add a bunch of segments and close it
      for (let i = 0; i < numPoints; ++i) {
        addAPoint(cellPts[offset + i]);
        addAPoint(cellPts[offset + ((i + 1) % numPoints)]);
      }
    },
    stripsToWireframe(numPoints, cellPts, offset) {
      // for strips we add a bunch of segments and close it
      for (let i = 0; i < numPoints - 1; ++i) {
        addAPoint(cellPts[offset + i]);
        addAPoint(cellPts[offset + i + 1]);
      }
      for (let i = 0; i < numPoints - 2; i++) {
        addAPoint(cellPts[offset + i]);
        addAPoint(cellPts[offset + i + 2]);
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
    stripsToSurface(npts, cellPts, offset) {
      for (let i = 0; i < npts - 2; i++) {
        addAPoint(cellPts[offset + i]);
        addAPoint(cellPts[offset + i + 1 + (i % 2)]);
        addAPoint(cellPts[offset + i + 1 + ((i + 1) % 2)]);
      }
    },
  };

  let primName = getPrimitiveName(primType);

  let func = null;
  if (
    representation === Representation.POINTS ||
    primType == PrimitiveTypes.Points
  ) {
    func = cellBuilders.anythingToPoints;
  } else if (
    representation === Representation.WIREFRAME ||
    primType == PrimitiveTypes.Lines
  ) {
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
  if (format.substring(format.length - 4) == '32x4') return 16;
  if (format.substring(format.length - 3) == '8x4') return 4;
}

function getArrayTypeFromFormat(format) {
  if (!format) return null;
  if (format.substring(0, 7) == 'float32') return 'Float32Array';
  if (format.substring(0, 6) == 'snorm8') return 'Int8Array';
  if (format.substring(0, 6) == 'unorm8') return 'Uint8Array';
}

// ----------------------------------------------------------------------------
// vtkWebGPUBufferManager methods
// ----------------------------------------------------------------------------

function vtkWebGPUBufferManager(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUBufferManager');

  publicAPI.getBuffer = (req) => {
    // if a dataArray ius provided set the address
    if (req.hasOwnProperty('dataArray')) {
      req['address'] = req.dataArray.getData();
    }

    // if already exists then return it
    for (let i = 0; i < model.buffers.length; i++) {
      if (requestMatches(model.buffers[i].request, req)) {
        return model.buffers[i].buffer;
      }
    }

    // create one
    const buffer = vtkWebGPUBuffer.newInstance();
    buffer.setDevice(model.device);

    const stride = getStrideFromFormat(req.format);
    const arrayType = getArrayTypeFromFormat(req.format);
    let gpuUsage = null;

    // handle uniform buffers
    if (req.usage == BufferUsage.UniformArray) {
      gpuUsage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;
      buffer.createAndWrite(req.address, gpuUsage);
    }

    // handle points
    if (req.usage == BufferUsage.Points) {
      gpuUsage = GPUBufferUsage.VERTEX;
      const result = packArray(
        req.cells,
        req.primitiveType,
        req.representation,
        req.dataArray,
        arrayType,
        { packExtra: true, shift: req.shift, scale: req.scale }
      );
      buffer.createAndWrite(result.address, gpuUsage);
      buffer.setStrideInBytes(stride);
      buffer.setArrayInformation([{ offset: 0, format: req.format }]);
    }

    // handle point data
    if (req.usage == BufferUsage.PointArray) {
      gpuUsage = GPUBufferUsage.VERTEX;
      const result = packArray(
        req.cells,
        req.primitiveType,
        req.representation,
        req.dataArray,
        arrayType,
        { packExtra: req.packExtra, shift: req.shift, scale: req.scale }
      );
      // console.log(result);
      buffer.createAndWrite(result.address, gpuUsage);
      buffer.setStrideInBytes(stride);
      buffer.setArrayInformation([{ offset: 0, format: req.format }]);
    }

    // handle normals from points, snorm8x4
    if (req.usage == BufferUsage.NormalsFromPoints) {
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
    model.buffers.push({ request: req, buffer });
    return buffer;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  device: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);

  model.buffers = [];

  macro.setGet(publicAPI, model, ['device']);

  vtkWebGPUBufferManager(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...STATIC, ...Constants };
