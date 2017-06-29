import macro               from 'vtk.js/Sources/macro';
import vtkBufferObject     from 'vtk.js/Sources/Rendering/OpenGL/BufferObject';
import { ObjectType }      from 'vtk.js/Sources/Rendering/OpenGL/BufferObject/Constants';
import { Representation }  from 'vtk.js/Sources/Rendering/Core/Property/Constants';

const { vtkDebugMacro, vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkOpenGLCellArrayBufferObject methods
// ----------------------------------------------------------------------------

function vtkOpenGLCellArrayBufferObject(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLCellArrayBufferObject');

  publicAPI.setType(ObjectType.ARRAY_BUFFER);

  publicAPI.updatePointsDataVBO = (poly, updateOptions) => {
    if (!model.packedVBO) {
      return;
    }

    const pointsData = poly.getPoints().getData();
    const countPointsComp = updateOptions.points ? 0 : 3;

    const normalsData = poly.getPointData().getNormals().getData();
    const countNormalsComp = updateOptions.normals ? 0 : 3;

    const tCoordsData = poly.getPointData().getTCoords().getData();
    const countTCoordsComp = updateOptions.tCoords ? 0 : 2;

    let pointIdx = 0;
    let normalIdx = 0;
    let tCoordsIdx = 0;
    let vboidx = 0;

    const cellData = poly.getPolys().getData();
    const size = cellData.length;

    for (let index = 0; index < size;) {
      const npts = cellData[index];
      const offset = index + 1;
      for (let i = 0; i < npts; i++) {
        if (updateOptions.points) {
          pointIdx = cellData[offset + i] * 3;
          model.packedVBO[vboidx++] = pointsData[pointIdx++];
          model.packedVBO[vboidx++] = pointsData[pointIdx++];
          model.packedVBO[vboidx++] = pointsData[pointIdx++];
        }

        if (updateOptions.normals) {
          normalIdx = cellData[offset + i] * 3;
          model.packedVBO[vboidx++] = normalsData[normalIdx++];
          model.packedVBO[vboidx++] = normalsData[normalIdx++];
          model.packedVBO[vboidx++] = normalsData[normalIdx++];
        }

        if (updateOptions.tCoords) {
          tCoordsIdx = cellData[offset + i] * 2;
          model.packedVBO[vboidx++] = tCoordsData[tCoordsIdx++];
          model.packedVBO[vboidx++] = tCoordsData[tCoordsIdx++];
        }
        vboidx += countPointsComp + countNormalsComp + countTCoordsComp;
      }
      index += npts + 1;
    }
    publicAPI.upload(model.packedVBO, ObjectType.ARRAY_BUFFER);
  };

  publicAPI.createVBO = (cellArray, inRep, outRep, options) => {
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

    const pointData = options.points.getData();
    let normalData = null;
    let tcoordData = null;
    let colorData = null;

    const colorComponents = (options.colors ? options.colors.getNumberOfComponents() : 0);
    const textureComponents = (options.tcoords ? options.tcoords.getNumberOfComponents() : 0);

    // the values of 4 below are because floats are 4 bytes

    if (options.normals) {
      model.normalOffset = 4 * model.blockSize;
      model.blockSize += 3;
      normalData = options.normals.getData();
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
      model.colorBO.setContext(model.context);
    } else {
      model.colorBO = null;
    }
    model.stride = 4 * model.blockSize;

    let pointIdx = 0;
    let normalIdx = 0;
    let tcoordIdx = 0;
    let colorIdx = 0;
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
        return (numPoints * 4) - 6;
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
    for (let index = 0; index < size;) {
      caboCount += countFunc(array[index], array);
      index += (array[index] + 1);
    }

    let packedUCVBO = null;

    if (!model.packedVBO || (model.packedVBO && (model.packedVBO.length !== caboCount * model.blockSize))) {
      model.packedVBO = new Float32Array(caboCount * model.blockSize);
    }

    if (colorData) {
      packedUCVBO = new Uint8Array(caboCount * 4);
    }
    let vboidx = 0;
    let ucidx = 0;

    addAPoint = function addAPointFunc(i) {
      // Vertices
      pointIdx = i * 3;

      model.packedVBO[vboidx++] = pointData[pointIdx++];
      model.packedVBO[vboidx++] = pointData[pointIdx++];
      model.packedVBO[vboidx++] = pointData[pointIdx++];

      if (normalData !== null) {
        if (options.haveCellNormals) {
          normalIdx = (cellCount + options.cellOffset) * 3;
        } else {
          normalIdx = i * 3;
        }
        model.packedVBO[vboidx++] = normalData[normalIdx++];
        model.packedVBO[vboidx++] = normalData[normalIdx++];
        model.packedVBO[vboidx++] = normalData[normalIdx++];
      }

      if (tcoordData !== null) {
        tcoordIdx = i * textureComponents;
        for (let j = 0; j < textureComponents; ++j) {
          model.packedVBO[vboidx++] = tcoordData[tcoordIdx++];
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
          (colorComponents === 4 ? colorData[colorIdx++] : 255);
      }
    };

    for (let index = 0; index < size;) {
      func(array[index], array, index + 1);
      index += (array[index] + 1);
      cellCount++;
    }
    model.elementCount = caboCount;
    publicAPI.upload(model.packedVBO, ObjectType.ARRAY_BUFFER);
    if (model.colorBO) {
      model.colorBOStride = 4;
      model.colorBO.upload(packedUCVBO, ObjectType.ARRAY_BUFFER);
    }
    return cellCount;
  };

  publicAPI.setCoordShiftAndScaleMethod = (shiftScaleMethod) => {
    vtkErrorMacro('coordinate shift and scale not yet implemented');
  };

  publicAPI.setCoordShift = (shiftArray) => {
    vtkErrorMacro('coordinate shift and scale not yet implemented');
  };

  publicAPI.setCoordScale = (scaleArray) => {
    vtkErrorMacro('coordinate shift and scale not yet implemented');
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

  packedVBO: null,
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
    'packedVBO',
  ]);

  // Object specific methods
  vtkOpenGLCellArrayBufferObject(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
