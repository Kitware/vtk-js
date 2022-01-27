import macro from 'vtk.js/Sources/macros';
import vtkViewNode from 'vtk.js/Sources/Rendering/SceneGraph/ViewNode';

// ----------------------------------------------------------------------------
// vtkRenderWindowViewNode is intended to be a superclass for all api specific
// RenderWindows. It is intended to define a common API that can be invoked
// upon an api specific render window and provide some common method
// implementations. If your application requires communicating with an api specific
// view try to limit such interactions to methods defined in this class.
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------
// vtkRenderWindowViewNode methods
// ----------------------------------------------------------------------------

function vtkRenderWindowViewNode(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkRenderWindowViewNode');

  publicAPI.getViewNodeFactory = () => null;

  publicAPI.getAspectRatio = () => model.size[0] / model.size[1];

  publicAPI.getAspectRatioForRenderer = (renderer) => {
    const viewport = renderer.getViewportByReference();
    return (
      (model.size[0] * (viewport[2] - viewport[0])) /
      ((viewport[3] - viewport[1]) * model.size[1])
    );
  };

  publicAPI.isInViewport = (x, y, viewport) => {
    const vCoords = viewport.getViewportByReference();
    const size = publicAPI.getFramebufferSize();
    if (
      vCoords[0] * size[0] <= x &&
      vCoords[2] * size[0] >= x &&
      vCoords[1] * size[1] <= y &&
      vCoords[3] * size[1] >= y
    ) {
      return true;
    }
    return false;
  };

  publicAPI.getViewportSize = (viewport) => {
    const vCoords = viewport.getViewportByReference();
    const size = publicAPI.getFramebufferSize();

    return [
      (vCoords[2] - vCoords[0]) * size[0],
      (vCoords[3] - vCoords[1]) * size[1],
    ];
  };

  publicAPI.getViewportCenter = (viewport) => {
    const size = publicAPI.getViewportSize(viewport);
    return [size[0] * 0.5, size[1] * 0.5];
  };

  publicAPI.displayToNormalizedDisplay = (x, y, z) => {
    const size = publicAPI.getFramebufferSize();
    return [x / size[0], y / size[1], z];
  };

  publicAPI.normalizedDisplayToDisplay = (x, y, z) => {
    const size = publicAPI.getFramebufferSize();
    return [x * size[0], y * size[1], z];
  };

  publicAPI.worldToView = (x, y, z, renderer) => renderer.worldToView(x, y, z);

  publicAPI.viewToWorld = (x, y, z, renderer) => renderer.viewToWorld(x, y, z);

  publicAPI.worldToDisplay = (x, y, z, renderer) => {
    const val = renderer.worldToView(x, y, z);
    const dims = publicAPI.getViewportSize(renderer);
    const val2 = renderer.viewToProjection(
      val[0],
      val[1],
      val[2],
      dims[0] / dims[1]
    );
    const val3 = renderer.projectionToNormalizedDisplay(
      val2[0],
      val2[1],
      val2[2]
    );
    return publicAPI.normalizedDisplayToDisplay(val3[0], val3[1], val3[2]);
  };

  publicAPI.displayToWorld = (x, y, z, renderer) => {
    const val = publicAPI.displayToNormalizedDisplay(x, y, z);
    const val2 = renderer.normalizedDisplayToProjection(val[0], val[1], val[2]);
    const dims = publicAPI.getViewportSize(renderer);
    const val3 = renderer.projectionToView(
      val2[0],
      val2[1],
      val2[2],
      dims[0] / dims[1]
    );
    return renderer.viewToWorld(val3[0], val3[1], val3[2]);
  };

  publicAPI.normalizedDisplayToViewport = (x, y, z, renderer) => {
    let vCoords = renderer.getViewportByReference();
    vCoords = publicAPI.normalizedDisplayToDisplay(vCoords[0], vCoords[1], 0.0);
    const coords = publicAPI.normalizedDisplayToDisplay(x, y, z);
    return [coords[0] - vCoords[0] - 0.5, coords[1] - vCoords[1] - 0.5, z];
  };

  publicAPI.viewportToNormalizedViewport = (x, y, z, renderer) => {
    const size = publicAPI.getViewportSize(renderer);
    if (size && size[0] !== 0 && size[1] !== 0) {
      return [x / (size[0] - 1.0), y / (size[1] - 1.0), z];
    }
    return [x, y, z];
  };

  publicAPI.normalizedViewportToViewport = (x, y, z, renderer) => {
    const size = publicAPI.getViewportSize(renderer);
    return [x * (size[0] - 1.0), y * (size[1] - 1.0), z];
  };

  publicAPI.displayToLocalDisplay = (x, y, z) => {
    const size = publicAPI.getFramebufferSize();
    return [x, size[1] - y - 1, z];
  };

  publicAPI.viewportToNormalizedDisplay = (x, y, z, renderer) => {
    let vCoords = renderer.getViewportByReference();
    vCoords = publicAPI.normalizedDisplayToDisplay(vCoords[0], vCoords[1], 0.0);
    const x2 = x + vCoords[0] + 0.5;
    const y2 = y + vCoords[1] + 0.5;
    return publicAPI.displayToNormalizedDisplay(x2, y2, z);
  };

  publicAPI.getPixelData = (x1, y1, x2, y2) => {
    macro.vtkErrorMacro('not implemented');
    return undefined;
  };

  publicAPI.createSelector = () => {
    macro.vtkErrorMacro('not implemented');
    return undefined;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  size: undefined,
  selector: undefined,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  if (!model.size) {
    model.size = [300, 300];
  }

  macro.getArray(publicAPI, model, ['size'], 2);
  macro.get(publicAPI, model, ['selector']);

  // Inheritance
  vtkViewNode.extend(publicAPI, model, initialValues);

  // Object methods
  vtkRenderWindowViewNode(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkRenderWindowViewNode');

// ----------------------------------------------------------------------------

export default {
  newInstance,
  extend,
};
