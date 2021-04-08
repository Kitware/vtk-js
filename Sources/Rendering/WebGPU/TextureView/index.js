import macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------
// vtkWebGPUTextureView methods
// ----------------------------------------------------------------------------

function vtkWebGPUTextureView(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUTextureView');

  publicAPI.create = (texture, options) => {
    model.texture = texture;
    model.options = options;
    model.textureHandle = texture.getHandle();
    model.handle = model.textureHandle.createView(model.options);
  };

  // if the texture has changed then get a new view
  publicAPI.getHandle = () => {
    if (model.texture.getHandle() !== model.textureHandle) {
      model.textureHandle = model.texture.getHandle();
      model.handle = model.textureHandle.createView(model.options);
    }
    return model.handle;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  texture: null,
  handle: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);

  macro.get(publicAPI, model, ['texture']);

  vtkWebGPUTextureView(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
