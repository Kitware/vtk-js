import * as macro from '../../../macro';
import vtkBufferObject from '../BufferObject';
import DynamicTypedArray from '../../../Common/Core/DynamicTypedArray';
import { ObjectType } from '../BufferObject/Constants';
import { Representation } from '../../Core/Property/Constants';


// ----------------------------------------------------------------------------
// vtkOpenGLCellArrayBufferObject methods
// ----------------------------------------------------------------------------

function vtkOpenGLCellArrayBufferObject(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLCellArrayBufferObject');

  const packedVBO = new DynamicTypedArray({ chunkSize: 65500, arrayType: 'Float32Array' }); // the data

  publicAPI.setType(ObjectType.ARRAY_BUFFER);

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
      model.colorOffset = 4 * model.blockSize;
      model.blockSize += model.colorComponents;
      colorData = options.colors.getData();
    }
    model.stride = 4 * model.blockSize;

    let pointIdx = 0;
    let normalIdx = 0;
    let tcoordIdx = 0;
    let colorIdx = 0;
    let cellCount = 0;

    const addAPoint = function addAPoint(i) {
      // Vertices
      pointIdx = i * 3;
      tcoordIdx = i * textureComponents;

      packedVBO.push(pointData[pointIdx++]);
      packedVBO.push(pointData[pointIdx++]);
      packedVBO.push(pointData[pointIdx++]);

      if (normalData !== null) {
        if (options.haveCellNormals) {
          normalIdx = (cellCount + options.cellOffset) * 3;
        } else {
          normalIdx = i * 3;
        }
        packedVBO.push(normalData[normalIdx++]);
        packedVBO.push(normalData[normalIdx++]);
        packedVBO.push(normalData[normalIdx++]);
      }

      if (tcoordData !== null) {
        for (let j = 0; j < textureComponents; ++j) {
          packedVBO.push(tcoordData[tcoordIdx++]);
        }
      }

      if (colorData !== null) {
        if (options.haveCellScalars) {
          colorIdx = (cellCount + options.cellOffset) * colorComponents;
        } else {
          colorIdx = i * colorComponents;
        }

        for (let j = 0; j < colorComponents; ++j) {
          packedVBO.push(colorData[colorIdx++] / 255.5);
        }
      }
    };

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
          console.log('skipping degenerate triangle');
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

    let func = null;
    if (outRep === Representation.POINTS || inRep === 'verts') {
      func = cellBuilders.anythingToPoints;
    } else if (outRep === Representation.WIREFRAME || inRep === 'lines') {
      func = cellBuilders[`${inRep}ToWireframe`];
    } else {
      func = cellBuilders[`${inRep}ToSurface`];
    }

    let currentIndex = 0;
    const array = cellArray.getData();
    const size = array.length;
    for (let index = 0; index < size; index++) {
      if (index === currentIndex) {
        func(array[index], array, currentIndex + 1);
        currentIndex += array[index] + 1;
        cellCount++;
      }
    }
    model.elementCount = packedVBO.getNumberOfElements() / model.blockSize;
    const vboArray = packedVBO.getFrozenArray();
    publicAPI.upload(vboArray, ObjectType.ARRAY_BUFFER);
    packedVBO.reset();
    return cellCount;
  };

  publicAPI.setCoordShiftAndScaleMethod = (shiftScaleMethod) => {
    console.log('coordinate shift and scale not yet implemented');
  };

  publicAPI.setCoordShift = (shiftArray) => {
    console.log('coordinate shift and scale not yet implemented');
  };

  publicAPI.setCoordScale = (scaleArray) => {
    console.log('coordinate shift and scale not yet implemented');
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  elementCount: 0,
  stride: 0,
  vertexOffset: 0,
  normalOffset: 0,
  tCoordOffset: 0,
  tCoordComponents: 0,
  colorOffset: 0,
  colorComponents: 0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkBufferObject.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, [
    'elementCount',
  ]);
  macro.get(publicAPI, model, [
    'stride',
    'vertexOffset',
    'normalOffset',
    'tCoordOffset',
    'tCoordComponents',
    'colorOffset',
    'colorComponents',
  ]);

  // Object specific methods
  vtkOpenGLCellArrayBufferObject(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
