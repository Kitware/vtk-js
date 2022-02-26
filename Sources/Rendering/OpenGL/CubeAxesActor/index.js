import * as macro from 'vtk.js/Sources/macros';
import vtkCubeAxesActor from 'vtk.js/Sources/Rendering/Core/CubeAxesActor';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

import { registerOverride } from 'vtk.js/Sources/Rendering/OpenGL/ViewNodeFactory';

// ----------------------------------------------------------------------------
// vtkOpenGLCubeAxesActor methods
// ----------------------------------------------------------------------------

function vtkOpenGLCubeAxesActor(publicAPI, model) {
  model.classHierarchy.push('vtkOpenGLCubeAxesActor');

  // Builds myself.
  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      model.openGLRenderer =
        publicAPI.getFirstAncestorOfType('vtkOpenGLRenderer');
      model.openGLRenderWindow = model.openGLRenderer.getParent();

      if (!model.CubeAxesActorHelper.getRenderable()) {
        model.CubeAxesActorHelper.setRenderable(model.renderable);
      }

      publicAPI.prepareNodes();
      publicAPI.addMissingNode(model.CubeAxesActorHelper.getTmActor());
      publicAPI.addMissingNode(model.renderable.getGridActor());
      publicAPI.removeUnusedNodes();
    }
  };

  publicAPI.opaquePass = (prepass, renderPass) => {
    if (prepass) {
      const camera = model.openGLRenderer
        ? model.openGLRenderer.getRenderable().getActiveCamera()
        : null;
      const tsize = model.openGLRenderer.getTiledSizeAndOrigin();

      model.CubeAxesActorHelper.updateAPISpecificData(
        [tsize.usize, tsize.vsize],
        camera,
        model.openGLRenderWindow.getRenderable()
      );
    }
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

  model.CubeAxesActorHelper = vtkCubeAxesActor.newCubeAxesActorHelper();

  // Object methods
  vtkOpenGLCubeAxesActor(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOpenGLCubeAxesActor');

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to OpenGL backend if imported
registerOverride('vtkCubeAxesActor', newInstance);
