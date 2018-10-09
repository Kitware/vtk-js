import macro from 'vtk.js/Sources/macro';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import Constants from 'vtk.js/Sources/Interaction/Widgets/OrientationMarkerWidget/Constants';

const { vtkErrorMacro } = macro;
const { Corners } = Constants;

// ----------------------------------------------------------------------------
// vtkOrientationMarkerWidget
// ----------------------------------------------------------------------------

function vtkOrientationMarkerWidget(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkOrientationMarkerWidget');

  // Private variables

  const previousCameraInput = [];
  const selfRenderer = vtkRenderer.newInstance();
  let interactorUnsubscribe = null;
  let viewUnsubscribe = null;

  publicAPI.computeViewport = () => {
    const [viewXSize, viewYSize] = model.interactor.getView().getSize();
    const minViewSize = Math.min(viewXSize, viewYSize);

    let pixelSize = model.viewportSize * minViewSize;
    // clamp pixel size
    pixelSize = Math.max(
      Math.min(model.minPixelSize, minViewSize),
      Math.min(model.maxPixelSize, pixelSize)
    );

    const xFrac = pixelSize / viewXSize;
    const yFrac = pixelSize / viewYSize;
    // [left bottom right top]
    switch (model.viewportCorner) {
      case Corners.TOP_LEFT:
        return [0, 1 - yFrac, xFrac, 1];
      case Corners.TOP_RIGHT:
        return [1 - xFrac, 1 - yFrac, 1, 1];
      case Corners.BOTTOM_LEFT:
        return [0, 0, xFrac, yFrac];
      case Corners.BOTTOM_RIGHT:
        return [1 - xFrac, 0, 1, yFrac];
      default:
        vtkErrorMacro('Invalid widget corner');
        return null;
    }
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

    const position = currentCamera.getReferenceByName('position');
    const focalPoint = currentCamera.getReferenceByName('focalPoint');
    const viewUp = currentCamera.getReferenceByName('viewUp');
    if (
      previousCameraInput[0] !== position[0] ||
      previousCameraInput[1] !== position[1] ||
      previousCameraInput[2] !== position[2] ||
      previousCameraInput[3] !== focalPoint[0] ||
      previousCameraInput[4] !== focalPoint[1] ||
      previousCameraInput[5] !== focalPoint[2] ||
      previousCameraInput[6] !== viewUp[0] ||
      previousCameraInput[7] !== viewUp[1] ||
      previousCameraInput[8] !== viewUp[2]
    ) {
      previousCameraInput[0] = position[0];
      previousCameraInput[1] = position[1];
      previousCameraInput[2] = position[2];
      previousCameraInput[3] = focalPoint[0];
      previousCameraInput[4] = focalPoint[1];
      previousCameraInput[5] = focalPoint[2];
      previousCameraInput[6] = viewUp[0];
      previousCameraInput[7] = viewUp[1];
      previousCameraInput[8] = viewUp[2];
      const activeCamera = selfRenderer.getActiveCamera();
      activeCamera.setPosition(position[0], position[1], position[2]);
      activeCamera.setFocalPoint(focalPoint[0], focalPoint[1], focalPoint[2]);
      activeCamera.setViewUp(viewUp[0], viewUp[1], viewUp[2]);
      selfRenderer.resetCamera();
    }
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
        vtkErrorMacro('Must set actor before enabling orientation marker.');
        return;
      }

      if (!model.interactor) {
        vtkErrorMacro(
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

      ({ unsubscribe: interactorUnsubscribe } = model.interactor.onAnimation(
        publicAPI.updateMarkerOrientation
      ));

      ({ unsubscribe: viewUnsubscribe } = model.interactor
        .getView()
        .onModified(publicAPI.updateViewport));

      publicAPI.updateViewport();
      publicAPI.updateMarkerOrientation();

      model.enabled = true;
    } else {
      if (!model.enabled) {
        return;
      }
      model.enabled = false;

      viewUnsubscribe();
      viewUnsubscribe = null;
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
    publicAPI.modified();
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

  publicAPI.setActor = (actor) => {
    const previousState = model.enabled;
    publicAPI.setEnabled(false);
    model.actor = actor;
    publicAPI.setEnabled(previousState);
  };

  publicAPI.getRenderer = () => selfRenderer;
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
    'interactor',
    'minPixelSize',
    'maxPixelSize',
  ]);
  macro.get(publicAPI, model, ['actor']);

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
