import macro from 'vtk.js/Sources/macro';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import Constants from 'vtk.js/Sources/Interaction/Widgets/OrientationMarkerWidget/Constants';

// ----------------------------------------------------------------------------
// vtkOrientationMarkerWidget
// ----------------------------------------------------------------------------

function vtkOrientationMarkerWidget(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOrientationMarkerWidget');

  // Private variables

  const selfRenderer = vtkRenderer.newInstance();
  let interactorUnsubscribe = null;

  publicAPI.computeViewport = () => {
    const [viewXSize, viewYSize] = model.interactor.getView().getSize();
    let pixelSize = model.viewportSize * Math.min(viewXSize, viewYSize);
    // clamp pixel size
    pixelSize = Math.max(
      model.minPixelSize,
      Math.min(model.maxPixelSize, pixelSize)
    );

    const xFrac = pixelSize / viewXSize;
    const yFrac = pixelSize / viewYSize;
    // [left bottom right top]
    return [0, 1 - yFrac, xFrac, 1];
  };

  publicAPI.updateViewport = () => {
    selfRenderer.setViewport(...publicAPI.computeViewport());
    model.interactor.render();
  };

  publicAPI.updateMarkerOrientation = () => {
    const currentCamera = model.interactor
      .findPokedRenderer()
      .getActiveCamera();

    if (!currentCamera) {
      return;
    }

    const state = currentCamera.get('position', 'focalPoint', 'viewUp');
    selfRenderer.getActiveCamera().set(state);
    selfRenderer.resetCamera();
  };

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
        console.error(
          'Must set interactor before enabling orientation marker.'
        );
        return;
      }

      const renderWindow = model.interactor
        .findPokedRenderer()
        .getRenderWindow();
      renderWindow.addRenderer(selfRenderer);
      if (renderWindow.getNumberOfLayers() < 2) {
        renderWindow.setNumberOfLayers(2);
      }
      // Highest number is foreground
      selfRenderer.setLayer(renderWindow.getNumberOfLayers() - 1);
      selfRenderer.setInteractive(false);

      selfRenderer.addViewProp(model.actor);
      model.actor.setVisibility(true);

      const { unsubscribe } = model.interactor.onAnimation(
        publicAPI.updateMarkerOrientation
      );
      interactorUnsubscribe = unsubscribe;

      window.addEventListener('resize', publicAPI.updateViewport);

      publicAPI.updateViewport();
      publicAPI.updateMarkerOrientation();

      model.enabled = true;
    } else {
      if (!model.enabled) {
        return;
      }
      model.enabled = false;

      window.removeEventListener('resize', publicAPI.updateViewport);

      interactorUnsubscribe();
      interactorUnsubscribe = null;

      model.actor.setVisibility(false);
      selfRenderer.removeViewProp(model.actor);

      const renderWindow = model.interactor
        .findPokedRenderer()
        .getRenderWindow();
      if (renderWindow) {
        renderWindow.removeRenderer(selfRenderer);
      }
    }
  };

  /**
   * Sets the viewport corner.
   */
  publicAPI.setViewportCorner = (corner) => {
    if (corner === model.viewportCorner) {
      return;
    }

    model.viewportCorner = corner;
    if (model.enabled) {
      publicAPI.updateViewport();
    }
  };

  /**
   * Sets the viewport size.
   */
  publicAPI.setViewportSize = (sizeFactor) => {
    const viewportSize = Math.min(1, Math.max(0, sizeFactor));
    if (viewportSize === model.viewportSize) {
      return;
    }

    model.viewportSize = viewportSize;
    if (model.enabled) {
      publicAPI.updateViewport();
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

export const DEFAULT_VALUES = {
  // actor: null,
  // interactor: null,
  viewportCorner: Constants.Corners.BOTTOM_LEFT,
  viewportSize: 0.2,
  minPixelSize: 50,
  maxPixelSize: 200,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  macro.get(publicAPI, model, ['enabled', 'viewportCorner', 'viewportSize']);

  // NOTE: setting these while the widget is enabled will
  // not update the widget.
  macro.setGet(publicAPI, model, [
    'actor',
    'interactor',
    'minPixelSize',
    'maxPixelSize',
  ]);

  // Object methods
  vtkOrientationMarkerWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkOrientationMarkerWidget'
);

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, Constants);
