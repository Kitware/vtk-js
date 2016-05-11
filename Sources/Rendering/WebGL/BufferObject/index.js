
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

function bufferObject(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLBufferObject');

  // Public API methods
  publicAPI.getType = () => {

  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  objectType: OBJECT_TYPE.ARRAY_BUFFER,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);

  bufferObject(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, STATIC);
