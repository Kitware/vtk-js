import * as macro from '../../../macro';
import ViewNodeFactory from '../../SceneGraph/ViewNodeFactory';
import WebGLRenderWindow from '../WebGLRenderWindow';
import WebGLRenderer from '../WebGLRenderer';
import WebGLActor from '../WebGLActor';
import WebGLPolyDataMapper from '../WebGLPolyDataMapper';

// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// Light methods
// ----------------------------------------------------------------------------

export function webGLViewNodeFactory(publicAPI, model) {
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
};

// ----------------------------------------------------------------------------

function newInstance(initialValues = {}) {
  const model = Object.assign({}, ViewNodeFactory.DEFAULT_VALUES, DEFAULT_VALUES, initialValues);
  const publicAPI = {};

  // Build VTK API
  macro.obj(publicAPI, model);

  // Object methods
  ViewNodeFactory.viewNodeFactory(publicAPI, model);

  webGLViewNodeFactory(publicAPI, model);

  publicAPI.registerOverride('vtkWebGLRenderWindow', WebGLRenderWindow.newInstance);
  publicAPI.registerOverride('vtkWebGLRenderer', WebGLRenderer.newInstance);
  publicAPI.registerOverride('vtkWebGLActor', WebGLActor.newInstance);
  publicAPI.registerOverride('vtkWebGLPolyDataMapper', WebGLPolyDataMapper.newInstance);

  return Object.freeze(publicAPI);
}

// ----------------------------------------------------------------------------

export default { newInstance };
