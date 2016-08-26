import * as macro from '../../../macro';
import vtkBufferObject from '../BufferObject';
import DynamicTypedArray from '../../../Common/Core/DynamicTypedArray';
import { SHIFT_SCALE_METHOD } from './Constants';
import { OBJECT_TYPE } from '../BufferObject/Constants';

// ----------------------------------------------------------------------------
// vtkOpenGLVertexBufferObject methods
// ----------------------------------------------------------------------------

function vtkOpenGLVertexBufferObject(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLVertexBufferObject');

  const packedVBO = new DynamicTypedArray(); // the data

  publicAPI.setType(OBJECT_TYPE.ARRAY_BUFFER);

  publicAPI.createVBO = (points, numPts, normals, tcoords, colors, colorComponents) => {
    if (model.coordShiftAndScaleMethod === SHIFT_SCALE_METHOD.AUTO_SHIFT_SCALE) {
      const bds = points.bounds;
      const shift = [0, 0, 0];
      const scale = [1, 1, 1];
      let needed = false;
      for (let i = 0; i < 3; ++i) {
        shift[i] = bds[2 * i]; // -0.5 * (bds[2 * i + 1] + bds[2 * i]);
        const delta = bds[(2 * i) + 1] - bds[2 * i];
        if (delta > 0.0 && Math.abs(shift[i]) / delta > 1.0e4) {
          needed = true;
          scale[i] = 1.0 / delta;
        } else {
          scale[i] = 1.0;
        }
      }
      if (needed) {
        model.setCoordShift(shift);
        model.setCoordScale(scale);
      }
    }
    // fast path
    if (model.coordShiftAndScaleEnabled === false && tcoords === null && normals === null &&
        colors === null && points.getDataType() === 'Float32Array') {
      const blockSize = 3;
      model.vertexOffset = 0;
      model.normalOffset = 0;
      model.tCoordOffset = 0;
      model.tCoordComponents = 0;
      // colorComponents = 0;
      model.colorOffset = 0;
      model.stride = 4 * blockSize;   // FIXME: Do we need to worry about hard-coded float size here
      model.vertexCount = numPts;
      publicAPI.upload(points.getData(), OBJECT_TYPE.ARRAY_BUFFER);
      return;
    }

    // slower path
    model.vertexCount = 0;
    publicAPI.appendVBO(points, numPts, normals, tcoords, colors, colorComponents);
    publicAPI.upload(packedVBO, OBJECT_TYPE.ARRAY_BUFFER);
    packedVBO.reset();
  };

  publicAPI.appendVBO = (points, numPoints, normals, tcoords, colors, colorComponents) => {
    // Figure out how big each block will be, currently 6 or 7 floats.
    let blockSize = 3;
    model.vertexOffset = 0;
    model.normalOffset = 0;
    model.tCoordOffset = 0;
    model.tCoordComponents = 0;
    model.colorComponents = 0;
    model.colorOffset = 0;

    const pointData = points.getData();
    let normalData = null;
    let tcoordData = null;
    let colorData = null;

    const textureComponents = tcoords.getNumberOfComponents();

    if (normals !== null) {
      model.normalOffset = /* sizeof(float) */ 4 * blockSize;
      blockSize += 3;
      normalData = normals.getData();
    }

    if (tcoords !== null) {
      model.tCoordOffset = /* sizeof(float) */ 4 * blockSize;
      model.tCoordComponents = textureComponents;
      blockSize += textureComponents;
      tcoordData = tcoords.getData();
    }

    if (colors !== null) {
      model.colorComponents = colorComponents;
      model.colorOffset = /* sizeof(float) */ 4 * blockSize;
      blockSize += 1;
      colorData = colors.getData();
    }
    model.stride = /* sizeof(float) */ 4 * blockSize;

    let pointIdx = 0;
    let normalIdx = 0;
    let tcoordIdx = 0;
    let colorIdx = 0;

    const colorHolder = new Uint8Array(4);

    // TODO: optimize this somehow, lots of if statements in here
    for (let i = 0; i < numPoints; ++i) {
      pointIdx = i * 3;
      normalIdx = i * 3;
      tcoordIdx = i * textureComponents;
      colorIdx = i * colorComponents;

      // Vertices
      packedVBO.push(pointData[pointIdx++]);
      packedVBO.push(pointData[pointIdx++]);
      packedVBO.push(pointData[pointIdx++]);

      if (normalData !== null) {
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
        colorHolder[0] = colorData[colorIdx++];
        colorHolder[1] = colorData[colorIdx++];
        colorHolder[2] = colorData[colorIdx++];

        if (colorComponents === 4) {
          colorHolder[3] = colorData[colorIdx++];
        } else {  // must be 3 color components then
          colorHolder[3] = 255;
        }

        packedVBO.push(new Float32Array(colorHolder.buffer)[0]);
      }
    }

    model.vertexCount += numPoints;
  };

  publicAPI.setCoordShiftAndScaleMethod = shiftScaleMethod => {
    console.log('coordinate shift and scale not yet implemented');
  };

  publicAPI.setCoordShift = shiftArray => {
    console.log('coordinate shift and scale not yet implemented');
  };

  publicAPI.setCoordScale = scaleArray => {
    console.log('coordinate shift and scale not yet implemented');
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  coordShift: [0, 0, 0],
  coordScale: [1, 1, 1],
  shiftScaleMethod: SHIFT_SCALE_METHOD.DISABLE_SHIFT_SCALE,
  coordShiftAndScaleEnabled: false,
  vertexCount: 0,
  stride: 0,
  vertexOffset: 0,
  normalOffset: 0,
  tCoordOffset: 0,
  tCoordComponents: 0,
  colorOffset: 0,
  numColorComponents: 0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkBufferObject.extend(publicAPI, model);

  macro.get(publicAPI, model, [
    'coordShiftAndScaleEnabled',
    'vertexCount',
    'stride',
    'vertexOffset',
    'normalOffset',
    'tCoordOffset',
    'tCoordComponents',
    'colorOffset',
    'numColorComponents',
  ]);

  // macro.get(publicAPI, model, [
  //   { name: 'shiftScaleMethod', enum: SHIFT_SCALE_METHOD, type: 'enum' },
  // ]);

  macro.getArray(publicAPI, model, [
    'coordShift',
    'coordScale',
  ]);

  // Object specific methods
  vtkOpenGLVertexBufferObject(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
