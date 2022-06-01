import macro from 'vtk.js/Sources/macros';
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

  const superClass = { ...publicAPI };

  // Private variables

  const previousCameraInput = [];
  const selfRenderer = vtkRenderer.newInstance();
  const resizeObserver = new ResizeObserver((entries) => {
    publicAPI.updateViewport();
  });
  let onCameraChangedSub = null;
  let onCameraModifiedSub = null;
  let onAnimationSub = null;
  let onEndAnimationSub = null;
  let selfSubscription = null;

  function onCameraModified() {
    // If animating, marker will be updated on Animation event
    if (!model._interactor.isAnimating()) {
      publicAPI.updateMarkerOrientation();
    }
  }

  publicAPI.computeViewport = () => {
    const parentRen =
      model.parentRenderer || model._interactor.getCurrentRenderer();

    const [xMin, yMin, xMax, yMax] = parentRen.getViewport();

    const view = model._interactor.getView();
    const canvasSize = view.getSize();
    const [viewXSize, viewYSize] = view.getViewportSize(parentRen);
    const minViewSize = Math.min(viewXSize, viewYSize);

    let pixelSize = model.viewportSize * minViewSize;
    // clamp pixel size
    pixelSize = Math.max(
      Math.min(model.minPixelSize, minViewSize),
      Math.min(model.maxPixelSize, pixelSize)
    );

    const xFrac = pixelSize / canvasSize[0];
    const yFrac = pixelSize / canvasSize[1];
    // [left bottom right top]
    switch (model.viewportCorner) {
      case Corners.TOP_LEFT:
        return [xMin, yMax - yFrac, xMin + xFrac, yMax];
      case Corners.TOP_RIGHT:
        return [xMax - xFrac, yMax - yFrac, xMax, yMax];
      case Corners.BOTTOM_LEFT:
        return [xMin, yMin, xMin + xFrac, yMin + yFrac];
      case Corners.BOTTOM_RIGHT:
        return [xMax - xFrac, yMin, xMax, yMin + yFrac];
      default:
        vtkErrorMacro('Invalid widget corner');
        return null;
    }
  };

  publicAPI.updateViewport = () => {
    if (model.enabled) {
      selfRenderer.setViewport(...publicAPI.computeViewport());
      model._interactor.render();
    }
  };

  publicAPI.updateMarkerOrientation = () => {
    const ren = model.parentRenderer || model._interactor.getCurrentRenderer();
    const currentCamera = ren.getActiveCamera();
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

      if (!model._interactor) {
        vtkErrorMacro(
          'Must set interactor before enabling orientation marker.'
        );
        return;
      }

      const ren =
        model.parentRenderer || model._interactor.getCurrentRenderer();
      const renderWindow = ren.getRenderWindow();
      renderWindow.addRenderer(selfRenderer);
      if (renderWindow.getNumberOfLayers() < 2) {
        renderWindow.setNumberOfLayers(2);
      }
      // Highest number is foreground
      selfRenderer.setLayer(renderWindow.getNumberOfLayers() - 1);
      selfRenderer.setInteractive(false);

      selfRenderer.addViewProp(model.actor);
      model.actor.setVisibility(true);

      onCameraChangedSub = ren.onEvent((event) => {
        if (event.type === 'ActiveCameraEvent') {
          if (onCameraModifiedSub) {
            onCameraModifiedSub.unsubscribe();
          }
          onCameraModifiedSub = event.camera.onModified(onCameraModified);
        }
      });
      onCameraModifiedSub = ren.getActiveCamera().onModified(onCameraModified);
      onAnimationSub = model._interactor.onAnimation(
        publicAPI.updateMarkerOrientation
      );
      onEndAnimationSub = model._interactor.onEndAnimation(
        publicAPI.updateMarkerOrientation
      );

      resizeObserver.observe(model._interactor.getView().getCanvas());

      publicAPI.updateViewport();
      publicAPI.updateMarkerOrientation();

      model.enabled = true;
    } else {
      if (!model.enabled) {
        return;
      }
      model.enabled = false;

      resizeObserver.disconnect();
      onCameraChangedSub.unsubscribe();
      onCameraChangedSub = null;
      onCameraModifiedSub.unsubscribe();
      onCameraModifiedSub = null;
      onAnimationSub.unsubscribe();
      onAnimationSub = null;
      onEndAnimationSub.unsubscribe();
      onEndAnimationSub = null;

      model.actor.setVisibility(false);
      selfRenderer.removeViewProp(model.actor);

      const renderWindow = model._interactor
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
    publicAPI.updateViewport();
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
    publicAPI.updateViewport();
  };

  publicAPI.setActor = (actor) => {
    const previousState = model.enabled;
    publicAPI.setEnabled(false);
    model.actor = actor;
    publicAPI.setEnabled(previousState);
  };

  publicAPI.setParentRenderer = (ren) => {
    const changed = superClass.setParentRenderer(ren);
    if (changed) {
      publicAPI.updateViewport();
    }
    return changed;
  };

  publicAPI.getRenderer = () => selfRenderer;

  publicAPI.delete = () => {
    superClass.delete();
    if (selfSubscription) {
      selfSubscription.unsubscribe();
      selfSubscription = null;
    }
    if (onCameraChangedSub) {
      onCameraChangedSub.unsubscribe();
      onCameraChangedSub = null;
    }
    if (onCameraModifiedSub) {
      onCameraModifiedSub.unsubscribe();
      onCameraModifiedSub = null;
    }
    if (onAnimationSub) {
      onAnimationSub.unsubscribe();
      onAnimationSub = null;
    }
    if (onEndAnimationSub) {
      onEndAnimationSub.unsubscribe();
      onEndAnimationSub = null;
    }
    resizeObserver.disconnect();
  };

  // --------------------------------------------------------------------------

  // update viewport whenever we are updated
  selfSubscription = publicAPI.onModified(publicAPI.updateViewport);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

export const DEFAULT_VALUES = {
  // actor: null,
  // _interactor: null,
  viewportCorner: Constants.Corners.BOTTOM_LEFT,
  viewportSize: 0.2,
  minPixelSize: 50,
  maxPixelSize: 200,
  parentRenderer: null,
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
    '_interactor',
    'minPixelSize',
    'maxPixelSize',
    'parentRenderer',
  ]);
  macro.get(publicAPI, model, ['actor']);
  macro.moveToProtected(publicAPI, model, ['interactor']);

  // Object methods
  vtkOrientationMarkerWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkOrientationMarkerWidget'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...Constants };
