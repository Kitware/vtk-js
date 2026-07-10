import * as macro from 'vtk.js/Sources/macros';
import vtkCubeAxesActor from 'vtk.js/Sources/Rendering/Core/CubeAxesActor';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

import { registerOverride } from 'vtk.js/Sources/Rendering/WebGPU/ViewNodeFactory';
import { getWebGPUContext } from 'vtk.js/Sources/Rendering/WebGPU/Helpers/Context';

// ----------------------------------------------------------------------------
// vtkWebGPUCubeAxesActor methods
// ----------------------------------------------------------------------------

function vtkWebGPUCubeAxesActor(publicAPI, model) {
  model.classHierarchy.push('vtkWebGPUCubeAxesActor');

  // Builds myself.
  publicAPI.buildPass = (prepass) => {
    if (prepass) {
      const { renderer, renderWindow } = getWebGPUContext(publicAPI);
      model.WebGPURenderer = renderer;
      model.WebGPURenderWindow = renderWindow;

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
      const camera = model.WebGPURenderer
        ? model.WebGPURenderer.getRenderable().getActiveCamera()
        : null;
      const tsize = model.WebGPURenderer.getTiledSizeAndOrigin();

      model.CubeAxesActorHelper.updateAPISpecificData(
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

  model.CubeAxesActorHelper = vtkCubeAxesActor.newCubeAxesActorHelper();

  // Object methods
  vtkWebGPUCubeAxesActor(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWebGPUCubeAxesActor');

// ----------------------------------------------------------------------------

export default { newInstance, extend };

// Register ourself to WebGPU backend if imported
registerOverride('vtkCubeAxesActor', newInstance);
