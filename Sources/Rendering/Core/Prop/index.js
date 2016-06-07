import * as macro from '../../../macro';

function notImplemented(method) {
  return () => console.log('vtkProp::${method} - NOT IMPLEMENTED');
}

// ----------------------------------------------------------------------------
// vtkProp methods
// ----------------------------------------------------------------------------

function vtkProp(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkProp');

  publicAPI.pick = notImplemented('pick');
  publicAPI.hasKey = notImplemented('hasKey');

  publicAPI.renderFilteredOpaqueGeometry = (viewport, requiredKeys) => {
    if (publicAPI.hasKey(requiredKeys)) {
      return !!publicAPI.renderOpaqueGeometry(viewport);
    }
    return false;
  };

  publicAPI.renderFilteredTranslucentPolygonalGeometry = (viewport, requiredKeys) => {
    if (publicAPI.hasKey(requiredKeys)) {
      return !!publicAPI.renderTranslucentPolygonalGeometry(viewport);
    }
    return false;
  };

  publicAPI.renderFilteredVolumetricGeometry = (viewport, requiredKeys) => {
    if (publicAPI.hasKey(requiredKeys)) {
      return !!publicAPI.renderVolumetricGeometry(viewport);
    }
    return false;
  };

  publicAPI.renderFilteredOverlay = (viewport, requiredKeys) => {
    if (publicAPI.hasKey(requiredKeys)) {
      return !!publicAPI.renderOverlay(viewport);
    }
    return false;
  };

  publicAPI.getRedrawMTime = () => model.mtime;

  publicAPI.setEstimatedRenderTime = t => {
    model.estimatedRenderTime = t;
    model.savedEstimatedRenderTime = t;
  };

  publicAPI.restoreEstimatedRenderTime = () => {
    model.estimatedRenderTime = model.savedEstimatedRenderTime;
  };

  publicAPI.addEstimatedRenderTime = t => {
    model.estimatedRenderTime += t;
  };

  publicAPI.setAllocatedRenderTime = t => {
    model.allocatedRenderTime = t;
    model.savedEstimatedRenderTime = model.estimatedRenderTime;
    model.estimatedRenderTime = 0;
  };

  publicAPI.getSupportsSelection = () => false;

  publicAPI.getTextures = () => model.textures;
  publicAPI.hasTexture = (texture) => !!model.textures.filter(item => item === texture).length;
  publicAPI.addTexture = (texture) => {
    if (texture && !publicAPI.hasTexture(texture)) {
      model.textures = model.props.concat(texture);
    }
  };

  publicAPI.removeTexture = (texture) => {
    const newTextureList = model.textures.filter(item => item === texture);
    if (model.texture.length !== newTextureList.length) {
      texture.releaseGraphicsResources(model.vtkWindow);
      model.textures = newTextureList;
    }
  };

  publicAPI.removeAllTextures = () => {
    model.textures.forEach(texture => {
      texture.releaseGraphicsResources(model.vtkWindow);
    });
    model.textures = [];
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
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
  macro.get(publicAPI, model, [
    'estimatedRenderTime',
    'allocatedRenderTime',
  ]);
  macro.setGet(publicAPI, model, [
    'visibility',
    'pickable',
    'dragable',
    'useBounds',
    'renderTimeMultiplier',
  ]);

  // Object methods
  vtkProp(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
