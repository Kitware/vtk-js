import macro       from 'vtk.js/Sources/macro';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import Constants   from 'vtk.js/Sources/Interaction/Widgets/OrientationMarkerWidget/Constants';

// ----------------------------------------------------------------------------
// vtkOrientationMarkerWidget
// ----------------------------------------------------------------------------

// depends on Constants.Corners
const VIEWPORTS = {
  TOP_LEFT: size => [0, (1 - size), size, 1],
  TOP_RIGHT: size => [(1 - size), (1 - size), 1, 1],
  BOTTOM_LEFT: size => [0, 0, size, size],
  BOTTOM_RIGHT: size => [(1 - size), 0, 1, size],
};

function vtkOrientationMarkerWidget(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOrientationMarkerWidget');

  // Private variables

  const selfRenderer = vtkRenderer.newInstance();

  // private methods

  function updateMarkerOrientation() {
    const currentCamera = model.interactor.findPokedRenderer().getActiveCamera();

    if (!currentCamera) {
      return;
    }

    // window.camera = currentCamera;
    const state = currentCamera.get('position', 'focalPoint', 'viewUp');
    selfRenderer.getActiveCamera().set(state);
    selfRenderer.resetCamera();
  }

  function getViewport() {
    return VIEWPORTS[model.viewportCorner](model.viewportSize);
  }

  // public methods

  /**
   * Enables/Disables the orientation marker.
   */
  publicAPI.setEnabled = (enabling) => {
    if (enabling) {
      if (model.enabled) {
        return;
      }

      if (!model.actor) {
        console.error('Must set actor before enabling orientation marker.');
        return;
      }

      if (!model.interactor) {
        console.error('Must set interactor before enabling orientation marker.');
        return;
      }

      const renderWindow = model.interactor.findPokedRenderer().getRenderWindow();
      renderWindow.addRenderer(selfRenderer);
      if (renderWindow.getNumberOfLayers() < 2) {
        renderWindow.setNumberOfLayers(2);
      }
      selfRenderer.setLayer(renderWindow.getNumberOfLayers() - 1);
      selfRenderer.setInteractive(false);

      selfRenderer.addViewProp(model.actor);
      model.actor.setVisibility(true);

      selfRenderer.setViewport(...getViewport());

      model.interactor.onAnimation(updateMarkerOrientation);

      model.enabled = true;
    } else {
      model.enabled = false;

      // TODO interactor.offAnimation() or something similar

      model.actor.setVisibility(false);
      selfRenderer.removeViewProp(model.actor);

      const renderWindow = model.interactor.findPokedRenderer().getRenderWindow();
      if (renderWindow) {
        renderWindow.removeRenderer(selfRenderer);
      }
    }
  };

  /**
   * Sets the viewport corner.
   */
  publicAPI.setViewportCorner = (corner) => {
    model.viewportCorner = corner;
    if (model.enabled) {
      selfRenderer.setViewport(...getViewport());
    }
  };

  /**
   * Sets the viewport size.
   */
  publicAPI.setViewportSize = (sizeFactor) => {
    model.viewportSize = Math.min(1, Math.max(0, sizeFactor));
    if (model.enabled) {
      selfRenderer.setViewport(...getViewport());
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

export const DEFAULT_VALUES = {
  actor: null,
  interactor: null,
  viewportCorner: Constants.Corners.BOTTOM_LEFT,
  viewportSize: 0.2,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  macro.get(publicAPI, model, [
    'enabled',
    'viewportCorner',
    'viewportSize',
  ]);

  // NOTE: setting these while the widget is enabled will
  // not update the widget.
  macro.setGet(publicAPI, model, [
    'actor',
    'interactor',
  ]);

  // Object methods
  vtkOrientationMarkerWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkOrientationMarkerWidget');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, Constants);
