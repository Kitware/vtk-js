import macro from 'vtk.js/Sources/macros';

function notImplemented(method) {
  return () => macro.vtkErrorMacro(`vtkProp::${method} - NOT IMPLEMENTED`);
}

// ----------------------------------------------------------------------------
// vtkProp methods
// ----------------------------------------------------------------------------

function vtkProp(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkProp');

  publicAPI.getMTime = () => {
    let m1 = model.mtime;
    for (let index = 0; index < model.textures.length; ++index) {
      const m2 = model.textures[index].getMTime();
      if (m2 > m1) {
        m1 = m2;
      }
    }
    return m1;
  };

  publicAPI.processSelectorPixelBuffers = (selector, pixeloffsets) => {};

  publicAPI.getNestedProps = () => null;
  publicAPI.getActors = () => [];
  publicAPI.getActors2D = () => [];
  publicAPI.getVolumes = () => [];

  publicAPI.pick = notImplemented('pick');
  publicAPI.hasKey = notImplemented('hasKey');

  publicAPI.getNestedVisibility = () =>
    model.visibility &&
    (!model._parentProp || model._parentProp.getNestedVisibility());
  publicAPI.getNestedPickable = () =>
    model.pickable &&
    (!model._parentProp || model._parentProp.getNestedPickable());
  publicAPI.getNestedDragable = () =>
    model.dragable &&
    (!model._parentProp || model._parentProp.getNestedDragable());

  publicAPI.getRedrawMTime = () => model.mtime;

  publicAPI.setEstimatedRenderTime = (t) => {
    model.estimatedRenderTime = t;
    model.savedEstimatedRenderTime = t;
  };

  publicAPI.restoreEstimatedRenderTime = () => {
    model.estimatedRenderTime = model.savedEstimatedRenderTime;
  };

  publicAPI.addEstimatedRenderTime = (t) => {
    model.estimatedRenderTime += t;
  };

  publicAPI.setAllocatedRenderTime = (t) => {
    model.allocatedRenderTime = t;
    model.savedEstimatedRenderTime = model.estimatedRenderTime;
    model.estimatedRenderTime = 0;
  };

  publicAPI.getSupportsSelection = () => false;

  publicAPI.getTextures = () => model.textures;
  publicAPI.hasTexture = (texture) => model.textures.indexOf(texture) !== -1;
  publicAPI.addTexture = (texture) => {
    if (texture && !publicAPI.hasTexture(texture)) {
      model.textures = model.textures.concat(texture);
      publicAPI.modified();
    }
  };

  publicAPI.removeTexture = (texture) => {
    const newTextureList = model.textures.filter((item) => item !== texture);
    if (model.textures.length !== newTextureList.length) {
      model.textures = newTextureList;
      publicAPI.modified();
    }
  };

  publicAPI.removeAllTextures = () => {
    model.textures = [];
    publicAPI.modified();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // _parentProp: null,
  visibility: true,
  pickable: true,
  dragable: true,
  useBounds: true,
  allocatedRenderTime: 10,
  estimatedRenderTime: 0,
  savedEstimatedRenderTime: 0,
  renderTimeMultiplier: 1,
  paths: null,
  textures: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['estimatedRenderTime', 'allocatedRenderTime']);
  macro.setGet(publicAPI, model, [
    'visibility',
    'pickable',
    'dragable',
    'useBounds',
    'renderTimeMultiplier',
    '_parentProp',
  ]);
  macro.moveToProtected(publicAPI, model, ['parentProp']);

  // Object methods
  vtkProp(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkProp');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
