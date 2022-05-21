import { mat4, quat, vec3 } from 'gl-matrix';

import macro from 'vtk.js/Sources/macros';
import vtkBufferObject from 'vtk.js/Sources/Rendering/OpenGL/BufferObject';
import { ObjectType } from 'vtk.js/Sources/Rendering/OpenGL/BufferObject/Constants';
import { Representation } from 'vtk.js/Sources/Rendering/Core/Property/Constants';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// Static functions
// ----------------------------------------------------------------------------

function computeInverseShiftAndScaleMatrix(coordShift, coordScale) {
  const inverseScale = new Float64Array(3);
  vec3.inverse(inverseScale, coordScale);

  const matrix = new Float64Array(16);
  mat4.fromRotationTranslationScale(
    matrix,
    quat.create(),
    coordShift,
    inverseScale
  );

  return matrix;
}

function shouldApplyCoordShiftAndScale(coordShift, coordScale) {
  if (coordShift === null || coordScale === null) {
    return false;
  }

  return !(
    vec3.exactEquals(coordShift, [0, 0, 0]) &&
    vec3.exactEquals(coordScale, [1, 1, 1])
  );
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

    let pointIdx = 0;
    let normalIdx = 0;
    let tcoordIdx = 0;
    let colorIdx = 0;
    let custIdx = 0;
    let cellCount = 0;
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
        if (numPoints > 2) {
          for (let i = 0; i < numPoints; ++i) {
            addAPoint(cellPts[offset + i]);
            addAPoint(cellPts[offset + ((i + 1) % numPoints)]);
          }
        }
      },
      stripsToWireframe(numPoints, cellPts, offset) {
        if (numPoints > 2) {
          // for strips we add a bunch of segments and close it
          for (let i = 0; i < numPoints - 1; ++i) {
            addAPoint(cellPts[offset + i]);
            addAPoint(cellPts[offset + i + 1]);
          }
          for (let i = 0; i < numPoints - 2; i++) {
            addAPoint(cellPts[offset + i]);
            addAPoint(cellPts[offset + i + 2]);
          }
        }
      },
      polysToSurface(npts, cellPts, offset) {
        for (let i = 0; i < npts - 2; i++) {
          addAPoint(cellPts[offset + 0]);
          addAPoint(cellPts[offset + i + 1]);
          addAPoint(cellPts[offset + i + 2]);
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
        if (npts > 2) {
          return (npts - 2) * 3;
        }
        return 0;
      },
    };

    let func = null;
    let countFunc = null;
    if (outRep === Representation.POINTS || inRep === 'verts') {
      func = cellBuilders.anythingToPoints;
      countFunc = cellCounters.anythingToPoints;
    } else if (outRep === Representation.WIREFRAME || inRep === 'lines') {
      func = cellBuilders[`${inRep}ToWireframe`];
      countFunc = cellCounters[`${inRep}ToWireframe`];
    } else {
      func = cellBuilders[`${inRep}ToSurface`];
      countFunc = cellCounters[`${inRep}ToSurface`];
    }

    const array = cellArray.getData();
    const size = array.length;
    let caboCount = 0;
    for (let index = 0; index < size; ) {
      caboCount += countFunc(array[index], array);
      index += array[index] + 1;
    }

    let packedUCVBO = null;
    const packedVBO = new Float32Array(caboCount * model.blockSize);
    if (colorData) {
      packedUCVBO = new Uint8Array(caboCount * 4);
    }
    let vboidx = 0;
    let ucidx = 0;

    // Find out if shift scale should be used
    // Compute squares of diagonal size and distance from the origin
    let diagSq = 0.0;
    let distSq = 0.0;
    for (let i = 0; i < 3; ++i) {
      const range = options.points.getRange(i);

      const delta = range[1] - range[0];
      diagSq += delta * delta;

      const distShift = 0.5 * (range[1] + range[0]);
      distSq += distShift * distShift;
    }

    const useShiftAndScale =
      diagSq > 0 &&
      (Math.abs(distSq) / diagSq > 1.0e6 || // If data is far from the origin relative to its size
        Math.abs(Math.log10(diagSq)) > 3.0 || // If the size is huge when not far from the origin
        (diagSq === 0 && distSq > 1.0e6)); // If data is a point, but far from the origin

    if (useShiftAndScale) {
      // Compute shift and scale vectors
      const coordShift = new Float64Array(3);
      const coordScale = new Float64Array(3);
      for (let i = 0; i < 3; ++i) {
        const range = options.points.getRange(i);
        const delta = range[1] - range[0];

        coordShift[i] = 0.5 * (range[1] + range[0]);
        coordScale[i] = delta > 0 ? 1.0 / delta : 1.0;
      }
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
        const newCells = new Int32Array(
          caboCount + selectionMaps.points.length
        );
        newCells.set(selectionMaps.cells);
        selectionMaps.cells = newCells;
      }
    }

    let pointCount = options.vertexOffset;
    addAPoint = function addAPointFunc(i) {
      // Keep track of original point and cell ids, for selection
      if (selectionMaps) {
        selectionMaps.points[pointCount] = i;
        selectionMaps.cells[pointCount] = cellCount;
      }
      ++pointCount;

      // Vertices
      pointIdx = i * 3;

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
          normalIdx = (cellCount + options.cellOffset) * 3;
        } else {
          normalIdx = i * 3;
        }
        packedVBO[vboidx++] = normalData[normalIdx++];
        packedVBO[vboidx++] = normalData[normalIdx++];
        packedVBO[vboidx++] = normalData[normalIdx++];
      }

      model.customData.forEach((attr) => {
        custIdx = i * attr.components;
        for (let j = 0; j < attr.components; ++j) {
          packedVBO[vboidx++] = attr.data[custIdx++];
        }
      });

      if (tcoordData !== null) {
        tcoordIdx = i * textureComponents;
        for (let j = 0; j < textureComponents; ++j) {
          packedVBO[vboidx++] = tcoordData[tcoordIdx++];
        }
      }

      if (colorData !== null) {
        if (options.haveCellScalars) {
          colorIdx = (cellCount + options.cellOffset) * colorComponents;
        } else {
          colorIdx = i * colorComponents;
        }
        packedUCVBO[ucidx++] = colorData[colorIdx++];
        packedUCVBO[ucidx++] = colorData[colorIdx++];
        packedUCVBO[ucidx++] = colorData[colorIdx++];
        packedUCVBO[ucidx++] =
          colorComponents === 4 ? colorData[colorIdx++] : 255;
      }
    };

    for (let index = 0; index < size; ) {
      func(array[index], array, index + 1);
      index += array[index] + 1;
      cellCount++;
    }
    model.elementCount = caboCount;
    publicAPI.upload(packedVBO, ObjectType.ARRAY_BUFFER);
    if (model.colorBO) {
      model.colorBOStride = 4;
      model.colorBO.upload(packedUCVBO, ObjectType.ARRAY_BUFFER);
    }
    return cellCount;
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
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  elementCount: 0,
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
