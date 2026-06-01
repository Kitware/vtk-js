import macro from 'vtk.js/Sources/macros';
import { ObjectType } from 'vtk.js/Sources/Rendering/OpenGL/BufferObject/Constants';

// ----------------------------------------------------------------------------
// vtkOpenGLVertexArrayObject methods
// ----------------------------------------------------------------------------

function vtkOpenGLVertexArrayObject(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLVertexArrayObject');

  publicAPI.initialize = () => {
    model.handleVAO = model.context.createVertexArray();
  };

  publicAPI.isReady = () => model.handleVAO !== 0;

  publicAPI.bind = () => {
    if (!publicAPI.isReady()) {
      publicAPI.initialize();
    }
    model.context.bindVertexArray(model.handleVAO);
  };

  publicAPI.release = () => {
    if (model.context) {
      model.context.bindVertexArray(null);
    }
  };

  publicAPI.shaderProgramChanged = () => {
    publicAPI.release();
    if (model.handleVAO && model.context) {
      model.context.deleteVertexArray(model.handleVAO);
    }
    model.handleVAO = 0;
    model.handleProgram = 0;
  };

  publicAPI.releaseGraphicsResources = () => {
    publicAPI.shaderProgramChanged();
    if (model.handleVAO && model.context) {
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

    const index = gl.getAttribLocation(model.handleProgram, name);
    if (index === -1) {
      return false;
    }

    buffer.bind();
    gl.enableVertexAttribArray(index);
    gl.vertexAttribPointer(
      index,
      elementTupleSize,
      elementType,
      normalize,
      stride,
      offset
    );

    if (divisor > 0) {
      gl.vertexAttribDivisor(index, 1);
    }

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
    // With core vertex array objects, the attribute state lives inside the VAO
    // and is overwritten on the next bind, so there is nothing to do here.
    return true;
  };

  publicAPI.setOpenGLRenderWindow = (rw) => {
    if (model._openGLRenderWindow === rw) {
      return;
    }
    publicAPI.releaseGraphicsResources();
    model._openGLRenderWindow = rw;
    model.context = null;
    if (rw) {
      model.context = model._openGLRenderWindow.getContext();
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  handleVAO: 0,
  handleProgram: 0,
  context: null,
  // _openGLRenderWindow: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);

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
