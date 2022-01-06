import macro from 'vtk.js/Sources/macros';
import { ObjectType } from 'vtk.js/Sources/Rendering/OpenGL/BufferObject/Constants';

// ----------------------------------------------------------------------------
// vtkOpenGLVertexArrayObject methods
// ----------------------------------------------------------------------------

function vtkOpenGLVertexArrayObject(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLVertexArrayObject');

  // Public API methods
  publicAPI.exposedMethod = () => {
    // This is a publicly exposed method of this object
  };

  publicAPI.initialize = () => {
    model.handleVAO = model.context.createVertexArray();
  };

  publicAPI.isReady = () => model.handleVAO !== 0;

  publicAPI.bind = () => {
    // Either simply bind the VAO, or emulate behavior by binding all attributes.
    if (!publicAPI.isReady()) {
      publicAPI.initialize();
    }
    if (publicAPI.isReady()) {
      model.context.bindVertexArray(model.handleVAO);
    }
  };

  publicAPI.release = () => {
    // Either simply release the VAO, or emulate behavior by releasing all attributes.
    if (publicAPI.isReady()) {
      model.context.bindVertexArray(null);
    }
  };

  publicAPI.shaderProgramChanged = () => {
    publicAPI.release();
    if (model.handleVAO) {
      model.context.deleteVertexArray(model.handleVAO);
    }
    model.handleVAO = 0;
    model.handleProgram = 0;
  };

  publicAPI.releaseGraphicsResources = () => {
    publicAPI.shaderProgramChanged();
    if (model.handleVAO) {
      model.context.deleteVertexArray(model.handleVAO);
    }
    model.handleVAO = 0;
    model.handleProgram = 0;
  };

  publicAPI.addAttributeArray = (
    program,
    buffer,
    name,
    offset,
    stride,
    elementType,
    elementTupleSize,
    normalize
  ) =>
    publicAPI.addAttributeArrayWithDivisor(
      program,
      buffer,
      name,
      offset,
      stride,
      elementType,
      elementTupleSize,
      normalize,
      0,
      false
    );

  publicAPI.addAttributeArrayWithDivisor = (
    program,
    buffer,
    name,
    offset,
    stride,
    elementType,
    elementTupleSize,
    normalize,
    divisor,
    isMatrix
  ) => {
    if (!program) {
      return false;
    }

    // Check the program is bound, and the buffer is valid.
    if (
      !program.isBound() ||
      buffer.getHandle() === 0 ||
      buffer.getType() !== ObjectType.ARRAY_BUFFER
    ) {
      return false;
    }

    // Perform initialization if necessary, ensure program matches VAOs.
    if (model.handleProgram === 0) {
      model.handleProgram = program.getHandle();
    }
    if (!publicAPI.isReady()) {
      publicAPI.initialize();
    }
    if (!publicAPI.isReady() || model.handleProgram !== program.getHandle()) {
      return false;
    }

    const gl = model.context;

    const attribs = {};
    attribs.name = name;
    attribs.index = gl.getAttribLocation(model.handleProgram, name);
    attribs.offset = offset;
    attribs.stride = stride;
    attribs.type = elementType;
    attribs.size = elementTupleSize;
    attribs.normalize = normalize;
    attribs.isMatrix = isMatrix;
    attribs.divisor = divisor;

    if (attribs.Index === -1) {
      return false;
    }

    // Always make the call as even the first use wants the attrib pointer setting
    // up when we are emulating.
    buffer.bind();
    gl.enableVertexAttribArray(attribs.index);
    gl.vertexAttribPointer(
      attribs.index,
      attribs.size,
      attribs.type,
      attribs.normalize,
      attribs.stride,
      attribs.offset
    );

    if (divisor > 0) {
      gl.vertexAttribDivisor(attribs.index, 1);
    }

    attribs.buffer = buffer.getHandle();

    return true;
  };

  publicAPI.addAttributeMatrixWithDivisor = (
    program,
    buffer,
    name,
    offset,
    stride,
    elementType,
    elementTupleSize,
    normalize,
    divisor
  ) => {
    // bind the first row of values
    const result = publicAPI.addAttributeArrayWithDivisor(
      program,
      buffer,
      name,
      offset,
      stride,
      elementType,
      elementTupleSize,
      normalize,
      divisor,
      true
    );

    if (!result) {
      return result;
    }

    const gl = model.context;

    const index = gl.getAttribLocation(model.handleProgram, name);

    for (let i = 1; i < elementTupleSize; i++) {
      gl.enableVertexAttribArray(index + i);
      gl.vertexAttribPointer(
        index + i,
        elementTupleSize,
        elementType,
        normalize,
        stride,
        offset + (stride * i) / elementTupleSize
      );
      if (divisor > 0) {
        gl.vertexAttribDivisor(index + i, 1);
      }
    }

    return true;
  };

  publicAPI.removeAttributeArray = (name) => {
    if (!publicAPI.isReady() || model.handleProgram === 0) {
      return false;
    }
    return true;
  };

  publicAPI.setOpenGLRenderWindow = (rw) => {
    if (model.openGLRenderWindow === rw) {
      return;
    }
    publicAPI.releaseGraphicsResources();
    model.openGLRenderWindow = rw;
    model.context = null;
    if (rw) {
      model.context = model.openGLRenderWindow.getContext();
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  forceEmulation: false,
  handleVAO: 0,
  handleProgram: 0,
  buffers: null,
  context: null,
  openGLRenderWindow: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Internal objects initialization
  model.buffers = [];

  // Object methods
  macro.obj(publicAPI, model);

  // Create get-set macros
  macro.setGet(publicAPI, model, ['forceEmulation']);

  // For more macro methods, see "Sources/macros.js"

  // Object specific methods
  vtkOpenGLVertexArrayObject(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkOpenGLVertexArrayObject'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
