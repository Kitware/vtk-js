import macro              from 'vtk.js/Sources/macro';
import vtkViewNode        from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

// ----------------------------------------------------------------------------
// vtkOpenGLPixelSpaceCallbackMapper methods
// ----------------------------------------------------------------------------

function vtkOpenGLPixelSpaceCallbackMapper(publicAPI, model) {
  model.classHierarchy.push('vtkOpenGLPixelSpaceCallbackMapper');

  publicAPI.opaquePass = () => {
    const oglren = publicAPI.getFirstAncestorOfType('vtkOpenGLRenderer');
    const aspectRatio = oglren.getAspectRatio();
    const ren = publicAPI.getFirstAncestorOfType('vtkOpenGLRenderer');
    const camera = ren ? ren.getRenderable().getActiveCamera() : null;
    const tsize = ren.getTiledSizeAndOrigin();

    model.renderable.invokeCallback(model.renderable.getInputData(), camera, aspectRatio, tsize);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  // Object methods
  vtkOpenGLPixelSpaceCallbackMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOpenGLPixelSpaceCallbackMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
