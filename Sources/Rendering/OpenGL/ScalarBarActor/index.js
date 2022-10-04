import * as macro from 'vtk.js/Sources/macros';
import vtkScalarBarActor from 'vtk.js/Sources/Rendering/Core/ScalarBarActor';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

import { registerOverride } from 'vtk.js/Sources/Rendering/OpenGL/ViewNodeFactory';

// ----------------------------------------------------------------------------
// vtkOpenGLScalarBarActor methods
// ----------------------------------------------------------------------------

function vtkOpenGLScalarBarActor(publicAPI, model) {
  model.classHierarchy.push('vtkOpenGLScalarBarActor');

  // Builds myself.
  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      model.openGLRenderer =
        publicAPI.getFirstAncestorOfType('vtkOpenGLRenderer');
      model._openGLRenderWindow = model.openGLRenderer.getParent();

      if (!model.scalarBarActorHelper.getRenderable()) {
        model.scalarBarActorHelper.setRenderable(model.renderable);
      }

      publicAPI.prepareNodes();
      publicAPI.addMissingNode(model.scalarBarActorHelper.getBarActor());
      publicAPI.addMissingNode(model.scalarBarActorHelper.getTmActor());
      publicAPI.removeUnusedNodes();
    }
  };

  publicAPI.opaquePass = (prepass, renderPass) => {
    if (prepass) {
      const camera = model.openGLRenderer
        ? model.openGLRenderer.getRenderable().getActiveCamera()
        : null;
      const tsize = model.openGLRenderer.getTiledSizeAndOrigin();

      model.scalarBarActorHelper.updateAPISpecificData(
        [tsize.usize, tsize.vsize],
        camera,
        model._openGLRenderWindow.getRenderable()
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

  model.scalarBarActorHelper = vtkScalarBarActor.newScalarBarActorHelper();

  // Object methods
  vtkOpenGLScalarBarActor(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOpenGLScalarBarActor');

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to OpenGL backend if imported
registerOverride('vtkScalarBarActor', newInstance);
