import macro from 'vtk.js/Sources/macro';

const { vtkErrorMacro } = macro;

// export const SHADER_TYPES = ['Vertex', 'Fragment', 'Geometry', 'Unknown'];

// ----------------------------------------------------------------------------
// vtkShader methods
// ----------------------------------------------------------------------------

function vtkShader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkShader');

  publicAPI.compile = () => {
    let stype = model.context.VERTEX_SHADER;

    if (
      !model.source ||
      !model.source.length ||
      model.shaderType === 'Unknown'
    ) {
      return false;
    }

    // Ensure we delete the previous shader if necessary.
    if (model.handle !== 0) {
      model.context.deleteShader(model.handle);
      model.handle = 0;
    }

    switch (model.shaderType) {
      // case vtkShader::Geometry:
      //   type = GL_GEOMETRY_SHADER;
      //   break;
      case 'Fragment':
        stype = model.context.FRAGMENT_SHADER;
        break;
      case 'Vertex':
      default:
        stype = model.context.VERTEX_SHADER;
        break;
    }

    model.handle = model.context.createShader(stype);
    model.context.shaderSource(model.handle, model.source);
    model.context.compileShader(model.handle);
    const isCompiled = model.context.getShaderParameter(
      model.handle,
      model.context.COMPILE_STATUS
    );
    if (!isCompiled) {
      const lastError = model.context.getShaderInfoLog(model.handle);
      vtkErrorMacro(`Error compiling shader '${model.source}': ${lastError}`);
      model.context.deleteShader(model.handle);
      model.handle = 0;
      return false;
    }

    // The shader compiled, store its handle and return success.
    return true;
  };

  publicAPI.cleanup = () => {
    if (model.shaderType === 'Unknown' || model.handle === 0) {
      return;
    }

    model.context.deleteShader(model.handle);
    model.handle = 0;
    model.dirty = true;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  shaderType: 'Unknown',
  source: '',
  error: '',
  handle: 0,
  dirty: false,
  context: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, [
    'shaderType',
    'source',
    'error',
    'handle',
    'context',
  ]);

  // Object methods
  vtkShader(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkShader');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
