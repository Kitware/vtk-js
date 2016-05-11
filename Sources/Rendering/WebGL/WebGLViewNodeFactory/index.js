import * as macro from '../../../macro';
import ViewNodeFactory from '../../SceneGraph/ViewNodeFactory';
import WebGLRenderWindow from '../WebGLRenderWindow';
import WebGLRenderer from '../WebGLRenderer';
import WebGLActor from '../WebGLActor';
import WebGLPolyDataMapper from '../WebGLPolyDataMapper';

// ----------------------------------------------------------------------------
// vtkWebGLViewNodeFactory methods
// ----------------------------------------------------------------------------

export function webGLViewNodeFactory(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWebGLViewNodeFactory');
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, initialValues = {}) {
  const model = Object.assign(initialValues, DEFAULT_VALUES);

  // Inheritance
  ViewNodeFactory.extend(publicAPI, model);

  // Object methods
  webGLViewNodeFactory(publicAPI, model);

  // Initialization
  publicAPI.registerOverride('vtkWebGLRenderWindow', WebGLRenderWindow.newInstance);
  publicAPI.registerOverride('vtkWebGLRenderer', WebGLRenderer.newInstance);
  publicAPI.registerOverride('vtkWebGLActor', WebGLActor.newInstance);
  publicAPI.registerOverride('vtkWebGLPolyDataMapper', WebGLPolyDataMapper.newInstance);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };

