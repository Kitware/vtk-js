import * as macro from '../../../macro';
import ViewNodeFactory from '../../SceneGraph/ViewNodeFactory';
import OpenGLRenderWindow from '../RenderWindow';
import OpenGLRenderer from '../Renderer';
import OpenGLActor from '../Actor';
import OpenGLCamera from '../Camera';
import OpenGLPolyDataMapper from '../PolyDataMapper';

// ----------------------------------------------------------------------------
// vtkOpenGLViewNodeFactory methods
// ----------------------------------------------------------------------------

export function openGLViewNodeFactory(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOpenGLViewNodeFactory');
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
  openGLViewNodeFactory(publicAPI, model);

  // Initialization
  publicAPI.registerOverride('vtkRenderWindow', OpenGLRenderWindow.newInstance);
  publicAPI.registerOverride('vtkRenderer', OpenGLRenderer.newInstance);
  publicAPI.registerOverride('vtkActor', OpenGLActor.newInstance);
  publicAPI.registerOverride('vtkMapper', OpenGLPolyDataMapper.newInstance);
  publicAPI.registerOverride('vtkCamera', OpenGLCamera.newInstance);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };

