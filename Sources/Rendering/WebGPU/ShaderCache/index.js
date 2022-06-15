import macro from 'vtk.js/Sources/macros';
import vtkWebGPUShaderModule from 'vtk.js/Sources/Rendering/WebGPU/ShaderModule';

// perform in place string substitutions, indicate if a substitution was done
// this is useful for building up shader strings which typically involve
// lots of string substitutions. Return true if a substitution was done.
function substitute(source, search, replace, all = true) {
  const replaceStr = Array.isArray(replace) ? replace.join('\n') : replace;
  let replaced = false;
  if (source.search(search) !== -1) {
    replaced = true;
  }
  let gflag = '';
  if (all) {
    gflag = 'g';
  }
  const regex = new RegExp(search, gflag);
  const resultstr = source.replace(regex, replaceStr);
  return { replace: replaced, result: resultstr };
}

// ----------------------------------------------------------------------------
// vtkWebGPUShaderCache methods
// ----------------------------------------------------------------------------

function vtkWebGPUShaderCache(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUShaderCache');

  publicAPI.getShaderModule = (shaderDesc) => {
    // has it already been created?
    const sType = shaderDesc.getType();
    const sHash = shaderDesc.getHash();
    const keys = model._shaderModules.keys();
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (key.getHash() === sHash && key.getType() === sType) {
        return model._shaderModules.get(key);
      }
    }

    // console.log(JSON.stringify(shaderDesc));

    const sm = vtkWebGPUShaderModule.newInstance();
    sm.initialize(model.device, shaderDesc);
    model._shaderModules.set(shaderDesc, sm);
    return sm;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

function defaultValues(initialValues) {
  return {
    _shaderModules: new Map(),
    device: null,
    window: null,
    ...initialValues,
  };
}

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  macro.moveToProtected(publicAPI, initialValues, ['shaderModules']);
  Object.assign(initialValues, defaultValues(initialValues));
  // Build VTK API
  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, ['device', 'window']);

  // Object methods
  vtkWebGPUShaderCache(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkWebGPUShaderCache',
  true
);

// ----------------------------------------------------------------------------

export default { newInstance, extend, substitute };
