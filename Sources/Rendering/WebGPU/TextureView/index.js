import macro from 'vtk.js/Sources/macro';

// const { ObjectType } = Constants;

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

export const STATIC = {};

// ----------------------------------------------------------------------------
// vtkWebGPUTextureView methods
// ----------------------------------------------------------------------------

function vtkWebGPUTextureView(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGPUTextureView');

  publicAPI.create = (texture, options) => {
    model.texture = texture;
    // model.handle = model.texture.getHandle().createView({
    //   format,
    //   dimension, // 1d, 2d, 2d-array, cube, sube-array, 3d
    //   aspect, // all, stencil-only, depth-only
    //   baseMIPLevel,
    //   mipLevelCount,
    //   baseArrayLayer,
    //   arrayLayerCOunt,
    // });
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

  macro.get(publicAPI, model, ['handle']);
  macro.setGet(publicAPI, model, ['texture']);

  vtkWebGPUTextureView(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...STATIC };
