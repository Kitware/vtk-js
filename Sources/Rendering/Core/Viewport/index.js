import * as macro from '../../../macro';

function notImplemented(method) {
  return () => console.log('vtkViewport::${method} - NOT IMPLEMENTED');
}

// ----------------------------------------------------------------------------
// vtkViewport methods
// ----------------------------------------------------------------------------

function vtkViewport(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkViewport');

  // Public API methods
  publicAPI.getViewProps = () => model.props;
  publicAPI.hasViewProp = (prop) => !!model.props.filter(item => item === prop).length;
  publicAPI.addViewProp = (prop) => {
    if (prop && !publicAPI.hasViewProp(prop)) {
      model.props = model.props.concat(prop);
    }
  };

  publicAPI.removeViewProp = (prop) => {
    const newPropList = model.props.filter(item => item === prop);
    if (model.props.length !== newPropList.length) {
      prop.releaseGraphicsResources(model.vtkWindow);
      model.props = newPropList;
    }
  };

  publicAPI.removeAllViewProps = () => {
    model.props.forEach(prop => {
      prop.releaseGraphicsResources(model.vtkWindow);
    });
    model.props = [];
  };

  publicAPI.addActor2D = publicAPI.addViewProp;
  publicAPI.removeActor2D = (prop) => {
    // VTK way: model.actors2D.RemoveItem(prop);
    publicAPI.removeViewProp(prop);
  };

  publicAPI.getActor2D = () => {
    model.actors2D = [];
    model.props.forEach(prop => {
      model.actors2D = model.actors2D.concat(prop.getActor2D());
    });
  };

  // FIXME ?
  publicAPI.displayToView = notImplemented('displayToView');
  publicAPI.viewToDisplay = notImplemented('viewToDisplay');
  publicAPI.viewToWorld = notImplemented('viewToWorld');
  publicAPI.worldToView = notImplemented('worldToView');
  publicAPI.getSize = notImplemented('getSize');

  publicAPI.getOrigin = () => {
    if (model.vtkWindow) {
      const size = model.vtkWindow.getSize();
      // Round the origin up a pixel
      model.origin = [
        Math.floor(model.viewport[0] * (size[0] + 0.5)),
        Math.floor(model.viewport[1] * (size[1] + 0.5)),
      ];
    } else {
      model.origin = [0, 0];
    }
    return model.origin;
  };

  publicAPI.getCenter = () => {
    if (model.vtkWindow) {
      const size = model.vtkWindow.getSize();
      if (size && size[0] && size[1]) {
        model.center = [
          0.5 * (model.viewport[2] + model.viewport[0]) * size[0],
          0.5 * (model.viewport[3] + model.viewport[1]) * size[1],
        ];
      }
    } else {
      model.center = [0, 0];
    }
    return model.center;
  };

  publicAPI.isInViewport = (x, y) => {
    if (model.vtkWindow) {
      // get physical window dimensions
      const size = model.vtkWindow.getSize();
      if ((model.viewport[0] * size[0] <= x) &&
          (model.viewport[2] * size[0] >= x) &&
          (model.viewport[1] * size[1] <= y) &&
          (model.viewport[3] * size[1] >= y)) {
        return true;
      }
    }
    return false;
  };

  // FIXME ?
  publicAPI.localDisplayToDisplay = notImplemented('localDisplayToDisplay');
  publicAPI.displayToLocalDisplay = notImplemented('DisplayToLocalDisplay');
  publicAPI.displayToNormalizedDisplay = notImplemented('DisplayToNormalizedDisplay');
  publicAPI.normalizedDisplayToViewport = notImplemented('NormalizedDisplayToViewport');
  publicAPI.viewportToNormalizedViewport = notImplemented('ViewportToNormalizedViewport');
  publicAPI.normalizedViewportToView = notImplemented('NormalizedViewportToView');
  publicAPI.normalizedDisplayToDisplay = notImplemented('NormalizedDisplayToDisplay');
  publicAPI.viewportToNormalizedDisplay = notImplemented('ViewportToNormalizedDisplay');
  publicAPI.NormalizedViewportToViewport = notImplemented('NormalizedViewportToViewport');
  publicAPI.ViewToNormalizedViewport = notImplemented('ViewToNormalizedViewport');
  publicAPI.ComputeAspect = notImplemented('ComputeAspect');
  publicAPI.PickPropFrom = notImplemented('PickPropFrom');
  publicAPI.GetTiledSize = notImplemented('GetTiledSize');
  publicAPI.GetTiledSizeAndOrigin = notImplemented('GetTiledSizeAndOrigin');
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  vtkWindow: null,
  background: [0, 0, 0],
  background2: [0.2, 0.2, 0.2],
  gradientBackground: false,
  viewport: [0, 0, 1, 1],
  worldPoint: [0, 0, 0, 0],
  displayPoint: [0, 0, 0],
  viewPoint: [0, 0, 0],
  aspect: [1, 1],
  pixelAspect: [1, 1],
  center: [0, 0],
  size: [0, 0],
  origin: [0, 0],
  props: [],
  actors2D: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.event(publicAPI, model, 'event');

  vtkViewport(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
