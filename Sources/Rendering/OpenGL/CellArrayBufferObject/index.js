import { vec3 } from 'gl-matrix';

import macro from 'vtk.js/Sources/macros';
import vtkBufferObject from 'vtk.js/Sources/Rendering/OpenGL/BufferObject';
import { ObjectType } from 'vtk.js/Sources/Rendering/OpenGL/BufferObject/Constants';
import { Representation } from 'vtk.js/Sources/Rendering/Core/Property/Constants';
import {
  computeCoordShiftAndScale,
  computeInverseShiftAndScaleMatrix,
} from 'vtk.js/Sources/Rendering/OpenGL/CellArrayBufferObject/helpers';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// Static functions
// ----------------------------------------------------------------------------

function shouldApplyCoordShiftAndScale(coordShift, coordScale) {
  if (coordShift === null || coordScale === null) {
    return false;
  }

  return !(
    vec3.exactEquals(coordShift, [0, 0, 0]) &&
    vec3.exactEquals(coordScale, [1, 1, 1])
  );
}

function canUseIndexedVBO(options) {
  // Indexed (shared point) VBOs avoid expanding every cell vertex. They only
  // work for point based attributes. Per cell attributes are baked per vertex
  // in the flattened path, and cell accurate hardware selection needs the
  // flattened layout too (WebGL2 has no gl_PrimitiveID), so callers ask for it
  // explicitly via options.forceFlatten.
  return (
    !options.forceFlatten &&
    !options.haveCellScalars &&
    !options.haveCellNormals &&
    !options.useTCoordsPerCell
  );
}

// Walk one cell, emitting each output vertex via emit(pointId, cellId). The
// indexed and flattened VBO paths share these so the primitive assembly logic
// lives in exactly one place; they differ only in what emit() does (push an
// index vs. expand a full vertex).
const CELL_BUILDERS = {
  // easy, every input point becomes an output point
  anythingToPoints(numPoints, cellPts, offset, cellId, emit) {
    for (let i = 0; i < numPoints; ++i) {
      emit(cellPts[offset + i], cellId);
    }
  },
  linesToWireframe(numPoints, cellPts, offset, cellId, emit) {
    // for lines we add a bunch of segments
    for (let i = 0; i < numPoints - 1; ++i) {
      emit(cellPts[offset + i], cellId);
      emit(cellPts[offset + i + 1], cellId);
    }
  },
  polysToWireframe(numPoints, cellPts, offset, cellId, emit) {
    // for polys we add a bunch of segments and close it
    if (numPoints > 2) {
      for (let i = 0; i < numPoints; ++i) {
        emit(cellPts[offset + i], cellId);
        emit(cellPts[offset + ((i + 1) % numPoints)], cellId);
      }
    }
  },
  stripsToWireframe(numPoints, cellPts, offset, cellId, emit) {
    if (numPoints > 2) {
      // for strips we add a bunch of segments and close it
      for (let i = 0; i < numPoints - 1; ++i) {
        emit(cellPts[offset + i], cellId);
        emit(cellPts[offset + i + 1], cellId);
      }
      for (let i = 0; i < numPoints - 2; i++) {
        emit(cellPts[offset + i], cellId);
        emit(cellPts[offset + i + 2], cellId);
      }
    }
  },
  polysToSurface(numPoints, cellPts, offset, cellId, emit) {
    for (let i = 0; i < numPoints - 2; i++) {
      emit(cellPts[offset], cellId);
      emit(cellPts[offset + i + 1], cellId);
      emit(cellPts[offset + i + 2], cellId);
    }
  },
  stripsToSurface(numPoints, cellPts, offset, cellId, emit) {
    for (let i = 0; i < numPoints - 2; i++) {
      emit(cellPts[offset + i], cellId);
      emit(cellPts[offset + i + 1 + (i % 2)], cellId);
      emit(cellPts[offset + i + 1 + ((i + 1) % 2)], cellId);
    }
  },
};

// Number of output vertices a single cell produces, matching CELL_BUILDERS.
const CELL_COUNTERS = {
  anythingToPoints(numPoints) {
    return numPoints;
  },
  linesToWireframe(numPoints) {
    return numPoints > 1 ? (numPoints - 1) * 2 : 0;
  },
  polysToWireframe(numPoints) {
    return numPoints > 2 ? numPoints * 2 : 0;
  },
  stripsToWireframe(numPoints) {
    return numPoints > 2 ? numPoints * 4 - 6 : 0;
  },
  polysToSurface(numPoints) {
    return numPoints > 2 ? (numPoints - 2) * 3 : 0;
  },
  stripsToSurface(numPoints) {
    return numPoints > 2 ? (numPoints - 2) * 3 : 0;
  },
};

// Pick the build/count pair for an input cell type + output representation.
function getCellHandlers(inRep, outRep) {
  if (outRep === Representation.POINTS || inRep === 'verts') {
    return {
      build: CELL_BUILDERS.anythingToPoints,
      count: CELL_COUNTERS.anythingToPoints,
    };
  }
  if (outRep === Representation.WIREFRAME || inRep === 'lines') {
    return {
      build: CELL_BUILDERS[`${inRep}ToWireframe`],
      count: CELL_COUNTERS[`${inRep}ToWireframe`],
    };
  }
  return {
    build: CELL_BUILDERS[`${inRep}ToSurface`],
    count: CELL_COUNTERS[`${inRep}ToSurface`],
  };
}

// Total number of output vertices across every cell in the array.
function countOutputVertices(cellData, count) {
  let total = 0;
  for (let index = 0; index < cellData.length; index += cellData[index] + 1) {
    total += count(cellData[index]);
  }
  return total;
}

// Walk every cell in the array, calling build() with a running cell id.
// Returns the next cell id (cellOffset + number of cells walked).
function forEachCell(cellData, cellOffset, build, emit) {
  let cellId = cellOffset;
  for (let index = 0; index < cellData.length; index += cellData[index] + 1) {
    build(cellData[index], cellData, index + 1, cellId, emit);
    cellId++;
  }
  return cellId;
}

function buildIndexArray(cellArray, inRep, outRep, options) {
  const cellData = cellArray.getData();
  const { build, count } = getCellHandlers(inRep, outRep);

  const indexCount = countOutputVertices(cellData, count);
  const indices =
    options.points.getNumberOfPoints() <= 0xffff
      ? new Uint16Array(indexCount)
      : new Uint32Array(indexCount);

  let cursor = 0;
  const cellCount = forEachCell(cellData, 0, build, (pointId) => {
    indices[cursor++] = pointId;
  });

  return { indices, cellCount };
}

// ----------------------------------------------------------------------------
// vtkOpenGLCellArrayBufferObject methods
// ----------------------------------------------------------------------------

function vtkOpenGLCellArrayBufferObject(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLCellArrayBufferObject');

  publicAPI.setType(ObjectType.ARRAY_BUFFER);

  publicAPI.createVBO = (
    cellArray,
    inRep,
    outRep,
    options,
    selectionMaps = null
  ) => {
    if (!cellArray.getData() || !cellArray.getData().length) {
      model.elementCount = 0;
      model.indexed = false;
      return 0;
    }

    // Figure out how big each block will be, currently 6 or 7 floats.
    model.blockSize = 3;
    model.vertexOffset = 0;
    model.normalOffset = 0;
    model.tCoordOffset = 0;
    model.tCoordComponents = 0;
    model.colorComponents = 0;
    model.colorOffset = 0;
    model.customData = [];

    const pointData = options.points.getData();
    let normalData = null;
    let tcoordData = null;
    let colorData = null;

    const colorComponents = options.colors
      ? options.colors.getNumberOfComponents()
      : 0;
    const textureComponents = options.tcoords
      ? options.tcoords.getNumberOfComponents()
      : 0;

    // the values of 4 below are because floats are 4 bytes

    if (options.normals) {
      model.normalOffset = 4 * model.blockSize;
      model.blockSize += 3;
      normalData = options.normals.getData();
    }

    if (options.customAttributes) {
      options.customAttributes.forEach((a) => {
        if (a) {
          model.customData.push({
            data: a.getData(),
            offset: 4 * model.blockSize,
            components: a.getNumberOfComponents(),
            name: a.getName(),
          });
          model.blockSize += a.getNumberOfComponents();
        }
      });
    }

    if (options.tcoords) {
      model.tCoordOffset = 4 * model.blockSize;
      model.tCoordComponents = textureComponents;
      model.blockSize += textureComponents;
      tcoordData = options.tcoords.getData();
    }

    if (options.colors) {
      model.colorComponents = options.colors.getNumberOfComponents();
      model.colorOffset = 0;
      colorData = options.colors.getData();
      if (!model.colorBO) {
        model.colorBO = vtkBufferObject.newInstance();
      }
      model.colorBO.setOpenGLRenderWindow(model._openGLRenderWindow);
    } else {
      model.colorBO = null;
    }
    model.stride = 4 * model.blockSize;

    // The indexed path avoids expanding point attributes once for every cell
    // vertex. It is limited to point based attributes; per cell attributes still
    // need the flattened path below.
    let pointIdx = 0;
    let normalIdx = 0;
    let tcoordIdx = 0;
    let colorIdx = 0;
    let custIdx = 0;

    if (canUseIndexedVBO(options)) {
      const { indices: indexArray, cellCount } = buildIndexArray(
        cellArray,
        inRep,
        outRep,
        options
      );
      if (!model.indexBO) {
        model.indexBO = vtkBufferObject.newInstance();
      }
      model.indexBO.setOpenGLRenderWindow(model._openGLRenderWindow);
      model.indexBO.upload(indexArray, ObjectType.ELEMENT_ARRAY_BUFFER);
      if (indexArray instanceof Uint16Array) {
        model.indexElementType = model.context.UNSIGNED_SHORT;
      } else {
        model.indexElementType = model.context.UNSIGNED_INT;
      }

      const numberOfPoints = options.points.getNumberOfPoints();
      const packedVBO = new Float32Array(numberOfPoints * model.blockSize);
      let vboidx = 0;

      const { useShiftAndScale, coordShift, coordScale } =
        computeCoordShiftAndScale(options.points);

      if (useShiftAndScale) {
        publicAPI.setCoordShiftAndScale(coordShift, coordScale);
      } else if (model.coordShiftAndScaleEnabled === true) {
        publicAPI.setCoordShiftAndScale(null, null);
      }

      for (let pointId = 0; pointId < numberOfPoints; pointId++) {
        pointIdx = pointId * 3;
        if (!model.coordShiftAndScaleEnabled) {
          packedVBO[vboidx++] = pointData[pointIdx++];
          packedVBO[vboidx++] = pointData[pointIdx++];
          packedVBO[vboidx++] = pointData[pointIdx++];
        } else {
          packedVBO[vboidx++] =
            (pointData[pointIdx++] - model.coordShift[0]) * model.coordScale[0];
          packedVBO[vboidx++] =
            (pointData[pointIdx++] - model.coordShift[1]) * model.coordScale[1];
          packedVBO[vboidx++] =
            (pointData[pointIdx++] - model.coordShift[2]) * model.coordScale[2];
        }

        if (normalData !== null) {
          normalIdx = pointId * 3;
          packedVBO[vboidx++] = normalData[normalIdx++];
          packedVBO[vboidx++] = normalData[normalIdx++];
          packedVBO[vboidx++] = normalData[normalIdx++];
        }

        model.customData.forEach((attr) => {
          custIdx = pointId * attr.components;
          for (let j = 0; j < attr.components; ++j) {
            packedVBO[vboidx++] = attr.data[custIdx++];
          }
        });

        if (tcoordData !== null) {
          tcoordIdx = pointId * textureComponents;
          for (let j = 0; j < textureComponents; ++j) {
            packedVBO[vboidx++] = tcoordData[tcoordIdx++];
          }
        }
      }

      publicAPI.upload(packedVBO, ObjectType.ARRAY_BUFFER);

      if (model.colorBO) {
        const packedUCVBO = new Uint8Array(numberOfPoints * 4);
        let ucidx = 0;
        for (let pointId = 0; pointId < numberOfPoints; pointId++) {
          colorIdx = pointId * colorComponents;
          packedUCVBO[ucidx++] = colorData[colorIdx++];
          packedUCVBO[ucidx++] = colorData[colorIdx++];
          packedUCVBO[ucidx++] = colorData[colorIdx++];
          if (colorComponents === 4) {
            packedUCVBO[ucidx++] = colorData[colorIdx++];
          } else {
            packedUCVBO[ucidx++] = 255;
          }
        }
        model.colorBOStride = 4;
        model.colorBO.upload(packedUCVBO, ObjectType.ARRAY_BUFFER);
      }

      model.elementCount = indexArray.length;
      model.indexed = true;
      return cellCount;
    }

    if (model.indexBO) {
      model.indexBO.releaseGraphicsResources();
    }
    model.indexed = false;
    model.indexElementType = null;

    let addAPoint;

    const { build: cellBuilder, count: cellCounter } = getCellHandlers(
      inRep,
      outRep
    );

    const array = cellArray.getData();
    const caboCount = countOutputVertices(array, cellCounter);

    let packedUCVBO = null;
    const packedVBO = new Float32Array(caboCount * model.blockSize);
    if (colorData) {
      packedUCVBO = new Uint8Array(caboCount * 4);
    }
    let vboidx = 0;
    let ucidx = 0;

    // Find out if shift scale should be used
    const { useShiftAndScale, coordShift, coordScale } =
      computeCoordShiftAndScale(options.points);

    if (useShiftAndScale) {
      publicAPI.setCoordShiftAndScale(coordShift, coordScale);
    } else if (model.coordShiftAndScaleEnabled === true) {
      // Make sure to reset
      publicAPI.setCoordShiftAndScale(null, null);
    }

    // Initialize the structures used to keep track of point ids and cell ids for selectors
    if (selectionMaps) {
      if (!selectionMaps.points && !selectionMaps.cells) {
        selectionMaps.points = new Int32Array(caboCount);
        selectionMaps.cells = new Int32Array(caboCount);
      } else {
        const newPoints = new Int32Array(
          caboCount + selectionMaps.points.length
        );
        newPoints.set(selectionMaps.points);
        selectionMaps.points = newPoints;
        const newCells = new Int32Array(caboCount + selectionMaps.cells.length);
        newCells.set(selectionMaps.cells);
        selectionMaps.cells = newCells;
      }
    }

    let pointCount = options.vertexOffset;
    addAPoint = function addAPointFunc(pointId, cellId) {
      // Keep track of original point and cell ids, for selection
      if (selectionMaps) {
        selectionMaps.points[pointCount] = pointId;
        selectionMaps.cells[pointCount] = cellId;
      }
      ++pointCount;

      // Vertices
      pointIdx = pointId * 3;

      if (!model.coordShiftAndScaleEnabled) {
        packedVBO[vboidx++] = pointData[pointIdx++];
        packedVBO[vboidx++] = pointData[pointIdx++];
        packedVBO[vboidx++] = pointData[pointIdx++];
      } else {
        // Apply shift and scale
        packedVBO[vboidx++] =
          (pointData[pointIdx++] - model.coordShift[0]) * model.coordScale[0];
        packedVBO[vboidx++] =
          (pointData[pointIdx++] - model.coordShift[1]) * model.coordScale[1];
        packedVBO[vboidx++] =
          (pointData[pointIdx++] - model.coordShift[2]) * model.coordScale[2];
      }

      if (normalData !== null) {
        if (options.haveCellNormals) {
          normalIdx = cellId * 3;
        } else {
          normalIdx = pointId * 3;
        }
        packedVBO[vboidx++] = normalData[normalIdx++];
        packedVBO[vboidx++] = normalData[normalIdx++];
        packedVBO[vboidx++] = normalData[normalIdx++];
      }

      model.customData.forEach((attr) => {
        custIdx = pointId * attr.components;
        for (let j = 0; j < attr.components; ++j) {
          packedVBO[vboidx++] = attr.data[custIdx++];
        }
      });

      if (tcoordData !== null) {
        if (options.useTCoordsPerCell) {
          tcoordIdx = cellId * textureComponents;
        } else {
          tcoordIdx = pointId * textureComponents;
        }
        for (let j = 0; j < textureComponents; ++j) {
          packedVBO[vboidx++] = tcoordData[tcoordIdx++];
        }
      }

      if (colorData !== null) {
        if (options.haveCellScalars) {
          colorIdx = cellId * colorComponents;
        } else {
          colorIdx = pointId * colorComponents;
        }
        packedUCVBO[ucidx++] = colorData[colorIdx++];
        packedUCVBO[ucidx++] = colorData[colorIdx++];
        packedUCVBO[ucidx++] = colorData[colorIdx++];
        packedUCVBO[ucidx++] =
          colorComponents === 4 ? colorData[colorIdx++] : 255;
      }
    };

    // Browse the cell array, expanding every cell vertex into the packed VBO.
    forEachCell(array, options.cellOffset, cellBuilder, addAPoint);

    model.elementCount = caboCount;
    publicAPI.upload(packedVBO, ObjectType.ARRAY_BUFFER);
    if (model.colorBO) {
      model.colorBOStride = 4;
      model.colorBO.upload(packedUCVBO, ObjectType.ARRAY_BUFFER);
    }
    return cellArray.getNumberOfCells();
  };

  publicAPI.setCoordShiftAndScale = (coordShift, coordScale) => {
    if (
      coordShift !== null &&
      (coordShift.constructor !== Float64Array || coordShift.length !== 3)
    ) {
      vtkErrorMacro('Wrong type for coordShift, expected vec3 or null');
      return;
    }

    if (
      coordScale !== null &&
      (coordScale.constructor !== Float64Array || coordScale.length !== 3)
    ) {
      vtkErrorMacro('Wrong type for coordScale, expected vec3 or null');
      return;
    }

    if (
      model.coordShift === null ||
      coordShift === null ||
      !vec3.equals(coordShift, model.coordShift)
    ) {
      model.coordShift = coordShift;
    }

    if (
      model.coordScale === null ||
      coordScale === null ||
      !vec3.equals(coordScale, model.coordScale)
    ) {
      model.coordScale = coordScale;
    }

    model.coordShiftAndScaleEnabled = shouldApplyCoordShiftAndScale(
      model.coordShift,
      model.coordScale
    );

    if (model.coordShiftAndScaleEnabled) {
      model.inverseShiftAndScaleMatrix = computeInverseShiftAndScaleMatrix(
        model.coordShift,
        model.coordScale
      );
    } else {
      model.inverseShiftAndScaleMatrix = null;
    }
  };

  const parentReleaseGraphicsResources = publicAPI.releaseGraphicsResources;
  publicAPI.releaseGraphicsResources = () => {
    parentReleaseGraphicsResources();
    if (model.indexBO) {
      model.indexBO.releaseGraphicsResources();
    }
    if (model.colorBO) {
      model.colorBO.releaseGraphicsResources();
    }
    model.indexed = false;
  };

  const parentGetAllocatedGPUMemoryInBytes =
    publicAPI.getAllocatedGPUMemoryInBytes;
  publicAPI.getAllocatedGPUMemoryInBytes = () =>
    parentGetAllocatedGPUMemoryInBytes() +
    (model.indexBO ? model.indexBO.getAllocatedGPUMemoryInBytes() : 0) +
    (model.colorBO ? model.colorBO.getAllocatedGPUMemoryInBytes() : 0);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  elementCount: 0,
  indexed: false,
  indexBO: null,
  indexElementType: null,
  stride: 0,
  colorBOStride: 0,
  vertexOffset: 0,
  normalOffset: 0,
  tCoordOffset: 0,
  tCoordComponents: 0,
  colorOffset: 0,
  colorComponents: 0,
  tcoordBO: null,
  customData: [],
  coordShift: null,
  coordScale: null,
  coordShiftAndScaleEnabled: false,
  inverseShiftAndScaleMatrix: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkBufferObject.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, [
    'colorBO',
    'elementCount',
    'stride',
    'colorBOStride',
    'vertexOffset',
    'normalOffset',
    'tCoordOffset',
    'tCoordComponents',
    'colorOffset',
    'colorComponents',
    'customData',
    'indexed',
    'indexBO',
    'indexElementType',
  ]);

  macro.get(publicAPI, model, [
    'coordShift',
    'coordScale',
    'coordShiftAndScaleEnabled',
    'inverseShiftAndScaleMatrix',
  ]);

  // Object specific methods
  vtkOpenGLCellArrayBufferObject(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
