import * as macro from '../../../macro';
import ViewNodeFactory from '../../SceneGraph/ViewNodeFactory';
import WebGLRenderWindow from '../RenderWindow';
import WebGLRenderer from '../Renderer';
import WebGLActor from '../Actor';
import WebGLPolyDataMapper from '../PolyDataMapper';

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

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  ViewNodeFactory.extend(publicAPI, model);

  // Object methods
  webGLViewNodeFactory(publicAPI, model);

  // Initialization
  publicAPI.registerOverride('vtkRenderWindow', WebGLRenderWindow.newInstance);
  publicAPI.registerOverride('vtkRenderer', WebGLRenderer.newInstance);
  publicAPI.registerOverride('vtkActor', WebGLActor.newInstance);
  publicAPI.registerOverride('vtkPolyDataMapper', WebGLPolyDataMapper.newInstance);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };

