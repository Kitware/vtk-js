import * as macro from '../../../macro';
import { OBJECT_TYPE } from './Constants';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {};

// ----------------------------------------------------------------------------
// vtkOpenGLBufferObject methods
// ----------------------------------------------------------------------------

function vtkOpenGLBufferObject(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLBufferObject');

  // Class-specific private functions
  function convertType(type) {
    switch (type) {
      case OBJECT_TYPE.ELEMENT_ARRAY_BUFFER:
        return model.context.ELEMENT_ARRAY_BUFFER;
      case OBJECT_TYPE.TEXTURE_BUFFER:
        if ('TEXTURE_BUFFER' in model.context) {
          return model.context.TEXTURE_BUFFER;
        }
      /* eslint-disable no-fallthrough */
      // Intentional fallthrough in case there is no TEXTURE_BUFFER in WebGL
      default:
      /* eslint-enable no-fallthrough */
      case OBJECT_TYPE.ARRAY_BUFFER:
        return model.context.ARRAY_BUFFER;
    }
  }

  let internalType = null;
  let internalHandle = null;
  let dirty = true;
  let error = '';

  // Public API methods
  publicAPI.getType = () => internalType;

  publicAPI.setType = (value) => {
    internalType = value;
  };

  publicAPI.getHandle = () => internalHandle;
  publicAPI.isReady = () => dirty === false;

  publicAPI.generateBuffer = (type) => {
    const objectTypeGL = convertType(type);
    if (internalHandle === null) {
      internalHandle = model.context.createBuffer();
      internalType = type;
    }
    return (convertType(internalType) === objectTypeGL);
  };

  publicAPI.upload = (data, type) => {
    // buffer, size, type
    const alreadyGenerated = publicAPI.generateBuffer(type);
    if (!alreadyGenerated) {
      error = 'Trying to upload array buffer to incompatible buffer.';
      return false;
    }
    model.context.bindBuffer(convertType(internalType), internalHandle);
    model.context.bufferData(convertType(internalType), data, model.context.STATIC_DRAW);
    dirty = false;
    return true;
  };

  publicAPI.bind = () => {
    if (!internalHandle) {
      return false;
    }
    model.context.bindBuffer(convertType(internalType), internalHandle);
    return true;
  };

  publicAPI.release = () => {
    if (!internalHandle) {
      return false;
    }
    model.context.bindBuffer(convertType(internalType), null);
    return true;
  };

  publicAPI.releaseGraphicsResources = () => {
    if (internalHandle !== null) {
      model.context.bindBuffer(convertType(internalType), null);
      model.context.deleteBuffer(internalHandle);
      internalHandle = null;
    }
  };

  publicAPI.getError = () => error;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  objectType: OBJECT_TYPE.ARRAY_BUFFER,
  context: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);

  macro.setGet(publicAPI, model, [
    'context',
  ]);

  vtkOpenGLBufferObject(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, STATIC);
