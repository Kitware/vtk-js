import * as macro from '../../../macro';
import vtkViewNodeFactory from '../../SceneGraph/ViewNodeFactory';
import vtkOpenGLActor from '../Actor';
import vtkOpenGLCamera from '../Camera';
import vtkOpenGLPolyDataMapper from '../PolyDataMapper';
import vtkOpenGLRenderWindow from '../RenderWindow';
import vtkOpenGLRenderer from '../Renderer';
import vtkOpenGLTexture from '../Texture';

// ----------------------------------------------------------------------------
// vtkOpenGLViewNodeFactory methods
// ----------------------------------------------------------------------------

export function vtkOpenGLViewNodeFactory(publicAPI, model) {
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
  vtkViewNodeFactory.extend(publicAPI, model);

  // Object methods
  vtkOpenGLViewNodeFactory(publicAPI, model);

  // Initialization
  publicAPI.registerOverride('vtkRenderWindow', vtkOpenGLRenderWindow.newInstance);
  publicAPI.registerOverride('vtkRenderer', vtkOpenGLRenderer.newInstance);
  publicAPI.registerOverride('vtkActor', vtkOpenGLActor.newInstance);
  publicAPI.registerOverride('vtkMapper', vtkOpenGLPolyDataMapper.newInstance);
  publicAPI.registerOverride('vtkCamera', vtkOpenGLCamera.newInstance);
  publicAPI.registerOverride('vtkTexture', vtkOpenGLTexture.newInstance);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };

