import macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------
// vtkWebGPUShaderDescription methods
// ----------------------------------------------------------------------------

// shader description

function vtkWebGPUShaderDescription(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUShaderDescription');

  publicAPI.getOutputDeclaration = (type, name) => {
    const result = `[[location(${model.outputNames.length})]] var<out> ${name} : ${type};`;
    model.outputTypes.push(type);
    model.outputNames.push(name);
    return result;
  };

  publicAPI.getInputDeclaration = (sDesc, name) => {
    const outputNames = sDesc.getOutputNamesByReference();
    for (let i = 0; i < outputNames.length; i++) {
      if (outputNames[i] === name) {
        const outputTypes = sDesc.getOutputTypesByReference();
        return `[[location(${i})]] var<in> ${name} : ${outputTypes[i]};`;
      }
    }
    return null;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  type: null, // 'vertex' or 'fragment'
  hash: null,
  code: null,
  outputNames: null,
  outputTypes: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  model.outputNames = [];
  model.outputTypes = [];

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['type', 'hash', 'code']);
  macro.getArray(publicAPI, model, ['outputTypes', 'outputNames']);

  // Object methods
  vtkWebGPUShaderDescription(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkWebGPUShaderDescription'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
