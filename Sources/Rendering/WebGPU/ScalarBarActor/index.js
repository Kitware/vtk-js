import * as macro from 'vtk.js/Sources/macros';
import vtkScalarBarActor from 'vtk.js/Sources/Rendering/Core/ScalarBarActor';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

import { registerOverride } from 'vtk.js/Sources/Rendering/WebGPU/ViewNodeFactory';
import { getWebGPUContext } from 'vtk.js/Sources/Rendering/WebGPU/Helpers/Context';

// ----------------------------------------------------------------------------
// vtkWebGPUScalarBarActor methods
// ----------------------------------------------------------------------------

function vtkWebGPUScalarBarActor(publicAPI, model) {
  model.classHierarchy.push('vtkWebGPUScalarBarActor');

  // Builds myself.
  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      const { renderer, renderWindow } = getWebGPUContext(publicAPI);
      model.WebGPURenderer = renderer;
      model.WebGPURenderWindow = renderWindow;

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
      const camera = model.WebGPURenderer
        ? model.WebGPURenderer.getRenderable().getActiveCamera()
        : null;
      const tsize = model.WebGPURenderer.getTiledSizeAndOrigin();

      model.scalarBarActorHelper.updateAPISpecificData(
        [tsize.usize, tsize.vsize],
        camera,
        model.WebGPURenderWindow.getRenderable()
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
  vtkWebGPUScalarBarActor(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUScalarBarActor');

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to WebGPU backend if imported
registerOverride('vtkScalarBarActor', newInstance);
