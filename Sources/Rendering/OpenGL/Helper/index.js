import * as macro from '../../../macro';
import VertexArrayObject from '../VertexArrayObject';
import IndexBufferObject from '../IndexBufferObject';
import ShaderProgram from '../ShaderProgram';

// ----------------------------------------------------------------------------
// vtkOpenGLHelper methods
// ----------------------------------------------------------------------------

export function helper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLHelper');

  publicAPI.setContext = (ctx) => {
    model.program.setContext(ctx);
    model.VAO.setContext(ctx);
    model.IBO.setContext(ctx);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  program: null,
  shaderSourceTime: null,
  VAO: null,
  attributeUpdateTime: null,
  IBO: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  model.program = ShaderProgram.newInstance();
  model.VAO = VertexArrayObject.newInstance();
  model.IBO = IndexBufferObject.newInstance();

  model.shaderSourceTime = {};
  macro.obj(model.shaderSourceTime);

  model.shaderSourceTime = {};
  macro.obj(model.shaderSourceTime);


  macro.setGet(publicAPI, model, [
    'program',
    'shaderSourceTime',
    'VAO',
    'attributeUpdateTime',
    'IBO',
  ]);

  // Object methods
  helper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
