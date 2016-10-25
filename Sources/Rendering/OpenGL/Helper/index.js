import * as macro from '../../../macro';
import vtkCellArrayBufferObject from '../CellArrayBufferObject';
import vtkShaderProgram from '../ShaderProgram';
import vtkVertexArrayObject from '../VertexArrayObject';

// ----------------------------------------------------------------------------
// vtkOpenGLHelper methods
// ----------------------------------------------------------------------------

export function vtkOpenGLHelper(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLHelper');

  publicAPI.setContext = (ctx) => {
    model.program.setContext(ctx);
    model.VAO.setContext(ctx);
    model.CABO.setContext(ctx);
  };

  publicAPI.releaseGraphicsResources = (oglwin) => {
    model.VAO.releaseGraphicsResources();
    model.CABO.releaseGraphicsResources();
    model.CABO.setElementCount(0);
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
  CABO: null,
  primitiveType: 0,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  model.shaderSourceTime = {};
  macro.obj(model.shaderSourceTime);

  model.attributeUpdateTime = {};
  macro.obj(model.attributeUpdateTime);

  macro.setGet(publicAPI, model, [
    'program',
    'shaderSourceTime',
    'VAO',
    'attributeUpdateTime',
    'CABO',
    'primitiveType',
  ]);

  model.program = vtkShaderProgram.newInstance();
  model.VAO = vtkVertexArrayObject.newInstance();
  model.CABO = vtkCellArrayBufferObject.newInstance();

  // Object methods
  vtkOpenGLHelper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
