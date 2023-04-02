import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import { FieldAssociations } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';
import macro from 'vtk.js/Sources/macros';
import Constants from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';
import { WIDGET_PRIORITY } from 'vtk.js/Sources/Widgets/Core/AbstractWidget/Constants';

const { ViewTypes, RenderingTypes, CaptureOn } = Constants;
const { vtkErrorMacro, vtkWarningMacro } = macro;

let viewIdCount = 1;

// ----------------------------------------------------------------------------
// Helper
// ----------------------------------------------------------------------------

export function extractRenderingComponents(renderer) {
  const camera = renderer.getActiveCamera();
  const renderWindow = renderer.getRenderWindow();
  const interactor = renderWindow.getInteractor();
  const apiSpecificRenderWindow = interactor.getView();
  return {
    renderer,
    renderWindow,
    interactor,
    apiSpecificRenderWindow,
    camera,
  };
}

export function getPixelWorldHeightAtCoord(worldCoord, displayScaleParams) {
  const {
    dispHeightFactor,
    cameraPosition,
    cameraDir,
    isParallel,
    rendererPixelDims,
  } = displayScaleParams;
  let scale = 1;
  if (isParallel) {
    scale = dispHeightFactor;
  } else {
    const worldCoordToCamera = [...worldCoord];
    vtkMath.subtract(worldCoordToCamera, cameraPosition, worldCoordToCamera);
    scale = vtkMath.dot(worldCoordToCamera, cameraDir) * dispHeightFactor;
  }

  const rHeight = rendererPixelDims[1];
  return scale / rHeight;
}
// ----------------------------------------------------------------------------
// vtkWidgetManager methods
// ----------------------------------------------------------------------------

function vtkWidgetManager(publicAPI, model) {
  if (!model.viewId) {
    model.viewId = `view-${viewIdCount++}`;
  }
  model.classHierarchy.push('vtkWidgetManager');
  const propsWeakMap = new WeakMap();
  const subscriptions = [];

  // --------------------------------------------------------------------------
  // API internal
  // --------------------------------------------------------------------------

  function updateWidgetWeakMap(widget) {
    const representations = widget.getRepresentations();
    for (let i = 0; i < representations.length; i++) {
      const representation = representations[i];
      const origin = { widget, representation };
      const actors = representation.getActors();
      for (let j = 0; j < actors.length; j++) {
        const actor = actors[j];
        propsWeakMap.set(actor, origin);
      }
    }
  }

  function getViewWidget(widget) {
    return (
      widget &&
      (widget.isA('vtkAbstractWidget')
        ? widget
        : widget.getWidgetForView({ viewId: model.viewId }))
    );
  }

  // --------------------------------------------------------------------------
  // Widget scaling
  // --------------------------------------------------------------------------

  function updateDisplayScaleParams() {
    const { _apiSpecificRenderWindow, _camera, _renderer } = model;
    if (_renderer && _apiSpecificRenderWindow && _camera) {
      const [rwW, rwH] = _apiSpecificRenderWindow.getSize();
      const [vxmin, vymin, vxmax, vymax] = _renderer.getViewport();
      const pixelRatio = _apiSpecificRenderWindow.getComputedDevicePixelRatio();
      const rendererPixelDims = [
        (rwW * (vxmax - vxmin)) / pixelRatio,
        (rwH * (vymax - vymin)) / pixelRatio,
      ];

      const cameraPosition = _camera.getPosition();
      const cameraDir = _camera.getDirectionOfProjection();
      const isParallel = _camera.getParallelProjection();
      const dispHeightFactor = isParallel
        ? 2 * _camera.getParallelScale()
        : 2 * Math.tan(vtkMath.radiansFromDegrees(_camera.getViewAngle()) / 2);

      model.widgets.forEach((w) => {
        w.getNestedProps().forEach((r) => {
          if (r.getScaleInPixels()) {
            r.setDisplayScaleParams({
              dispHeightFactor,
              cameraPosition,
              cameraDir,
              isParallel,
              rendererPixelDims,
            });
          }
        });
      });
    }
  }

  // --------------------------------------------------------------------------
  // API public
  // --------------------------------------------------------------------------

  async function updateSelection(callData, fromTouchEvent, callID) {
    const { position } = callData;
    const { requestCount, selectedState, representation, widget } =
      await publicAPI.getSelectedDataForXY(position.x, position.y);

    if (requestCount || callID !== model._currentUpdateSelectionCallID) {
      // requestCount > 0: Call activate only once
      // callID check: drop old calls
      return;
    }

    function activateHandle(w) {
      if (fromTouchEvent) {
        // release any previous left button interaction
        model._interactor.invokeLeftButtonRelease(callData);
      }
      w.activateHandle({ selectedState, representation });
      if (fromTouchEvent) {
        // re-trigger the left button press to pick the now-active widget
        model._interactor.invokeLeftButtonPress(callData);
      }
    }

    // Default cursor behavior
    model._apiSpecificRenderWindow.setCursor(widget ? 'pointer' : 'default');

    model.activeWidget = null;
    let wantRender = false;
    if (model.widgetInFocus === widget && widget.hasFocus()) {
      activateHandle(widget);
      model.activeWidget = widget;
      wantRender = true;
    } else {
      for (let i = 0; i < model.widgets.length; i++) {
        const w = model.widgets[i];
        if (w === widget && w.getNestedPickable()) {
          activateHandle(w);
          model.activeWidget = w;
          wantRender = true;
        } else {
          wantRender ||= !!w.getActiveState();
          w.deactivateAllHandles();
        }
      }
    }

    if (wantRender) {
      model._interactor.render();
    }
  }

  const handleEvent = async (callData, fromTouchEvent = false) => {
    if (
      !model.isAnimating &&
      model.pickingEnabled &&
      callData.pokedRenderer === model._renderer
    ) {
      const callID = Symbol('UpdateSelection');
      model._currentUpdateSelectionCallID = callID;
      await updateSelection(callData, fromTouchEvent, callID);
    }
  };

  function updateWidgetForRender(w) {
    w.updateRepresentationForRender(model.renderingType);
  }

  function renderPickingBuffer() {
    model.renderingType = RenderingTypes.PICKING_BUFFER;
    model.widgets.forEach(updateWidgetForRender);
  }

  function renderFrontBuffer() {
    model.renderingType = RenderingTypes.FRONT_BUFFER;
    model.widgets.forEach(updateWidgetForRender);
  }

  async function captureBuffers(x1, y1, x2, y2) {
    if (model._captureInProgress) {
      return;
    }
    model._captureInProgress = true;
    renderPickingBuffer();

    model._capturedBuffers = null;
    model._capturedBuffers = await model._selector.getSourceDataAsync(
      model._renderer,
      x1,
      y1,
      x2,
      y2
    );
    model.previousSelectedData = null;
    renderFrontBuffer();
    model._captureInProgress = false;
  }

  publicAPI.enablePicking = () => {
    model.pickingEnabled = true;
    publicAPI.renderWidgets();
  };

  publicAPI.renderWidgets = () => {
    if (model.pickingEnabled && model.captureOn === CaptureOn.MOUSE_RELEASE) {
      const [w, h] = model._apiSpecificRenderWindow.getSize();
      captureBuffers(0, 0, w, h);
    }

    renderFrontBuffer();
    publicAPI.modified();
  };

  publicAPI.disablePicking = () => {
    model.pickingEnabled = false;
  };

  publicAPI.setRenderer = (renderer) => {
    const renderingComponents = extractRenderingComponents(renderer);
    Object.assign(model, renderingComponents);
    macro.moveToProtected({}, model, Object.keys(renderingComponents));
    while (subscriptions.length) {
      subscriptions.pop().unsubscribe();
    }

    model._selector = model._apiSpecificRenderWindow.createSelector();
    model._selector.setFieldAssociation(
      FieldAssociations.FIELD_ASSOCIATION_POINTS
    );

    subscriptions.push(
      model._apiSpecificRenderWindow.onWindowResizeEvent(
        updateDisplayScaleParams
      )
    );
    subscriptions.push(model._camera.onModified(updateDisplayScaleParams));
    updateDisplayScaleParams();

    subscriptions.push(
      model._interactor.onStartAnimation(() => {
        model.isAnimating = true;
      })
    );
    subscriptions.push(
      model._interactor.onEndAnimation(() => {
        model.isAnimating = false;
        publicAPI.renderWidgets();
      })
    );

    subscriptions.push(
      model._interactor.onMouseMove((eventData) => {
        handleEvent(eventData);
        return macro.VOID;
      })
    );

    // must be handled after widgets, hence the given priority.
    subscriptions.push(
      model._interactor.onLeftButtonPress((eventData) => {
        const { deviceType } = eventData;
        const touchEvent = deviceType === 'touch' || deviceType === 'pen';
        // only try selection if the left button press is from touch.
        if (touchEvent) {
          handleEvent(eventData, touchEvent);
        }
        return macro.VOID;
      }, WIDGET_PRIORITY / 2)
    );

    publicAPI.modified();

    if (model.pickingEnabled) {
      publicAPI.enablePicking();
    }
  };

  function addWidgetInternal(viewWidget) {
    viewWidget.setWidgetManager(publicAPI);
    updateWidgetWeakMap(viewWidget);
    updateDisplayScaleParams();

    // Register to renderer
    model._renderer.addActor(viewWidget);
  }

  publicAPI.addWidget = (widget, viewType, initialValues) => {
    if (!model._renderer) {
      vtkErrorMacro(
        'Widget manager MUST BE link to a view before registering widgets'
      );
      return null;
    }
    const { viewId, _renderer } = model;
    const w = widget.getWidgetForView({
      viewId,
      renderer: _renderer,
      viewType: viewType || ViewTypes.DEFAULT,
      initialValues,
    });

    if (w != null && model.widgets.indexOf(w) === -1) {
      model.widgets.push(w);
      addWidgetInternal(w);
      publicAPI.modified();
    }

    return w;
  };

  function removeWidgetInternal(viewWidget) {
    model._renderer.removeActor(viewWidget);
    viewWidget.delete();
  }

  function onWidgetRemoved() {
    model._renderer.getRenderWindow().getInteractor().render();
    publicAPI.renderWidgets();
  }

  publicAPI.removeWidgets = () => {
    model.widgets.forEach(removeWidgetInternal);
    model.widgets = [];
    model.widgetInFocus = null;
    onWidgetRemoved();
  };

  publicAPI.removeWidget = (widget) => {
    const viewWidget = getViewWidget(widget);
    const index = model.widgets.indexOf(viewWidget);
    if (index !== -1) {
      model.widgets.splice(index, 1);

      const isWidgetInFocus = model.widgetInFocus === viewWidget;
      if (isWidgetInFocus) {
        publicAPI.releaseFocus();
      }

      removeWidgetInternal(viewWidget);
      onWidgetRemoved();
    }
  };

  publicAPI.getSelectedDataForXY = async (x, y) => {
    model.selections = null;
    if (model.pickingEnabled) {
      // do we require a new capture?
      if (!model._capturedBuffers || model.captureOn === CaptureOn.MOUSE_MOVE) {
        await captureBuffers(x, y, x, y);
      } else {
        // or do we need a pixel that is outside the last capture?
        const capturedRegion = model._capturedBuffers.area;
        if (
          x < capturedRegion[0] ||
          x > capturedRegion[2] ||
          y < capturedRegion[1] ||
          y > capturedRegion[3]
        ) {
          await captureBuffers(x, y, x, y);
        }
      }

      model.selections = model._capturedBuffers.generateSelection(x, y, x, y);
    }
    return publicAPI.getSelectedData();
  };

  publicAPI.updateSelectionFromXY = (x, y) => {
    vtkWarningMacro(
      'updateSelectionFromXY is deprecated, please use getSelectedDataForXY'
    );
    if (model.pickingEnabled) {
      // Then pick regular representations.
      if (model.captureOn === CaptureOn.MOUSE_MOVE) {
        captureBuffers(x, y, x, y);
      }
    }
  };

  publicAPI.updateSelectionFromMouseEvent = (event) => {
    vtkWarningMacro(
      'updateSelectionFromMouseEvent is deprecated, please use getSelectedDataForXY'
    );
    const { pageX, pageY } = event;
    const { top, left, height } = model._apiSpecificRenderWindow
      .getCanvas()
      .getBoundingClientRect();
    const x = pageX - left;
    const y = height - (pageY - top);
    publicAPI.updateSelectionFromXY(x, y);
  };

  publicAPI.getSelectedData = () => {
    if (!model.selections || !model.selections.length) {
      model.previousSelectedData = null;
      return {};
    }
    const { propID, compositeID, prop } = model.selections[0].getProperties();
    let { widget, representation } = model.selections[0].getProperties();
    // widget is undefined for handle representation.
    if (
      model.previousSelectedData &&
      model.previousSelectedData.prop === prop &&
      model.previousSelectedData.widget === widget &&
      model.previousSelectedData.compositeID === compositeID
    ) {
      model.previousSelectedData.requestCount++;
      return model.previousSelectedData;
    }

    if (propsWeakMap.has(prop)) {
      const props = propsWeakMap.get(prop);
      widget = props.widget;
      representation = props.representation;
    }

    if (widget && representation) {
      const selectedState = representation.getSelectedState(prop, compositeID);
      model.previousSelectedData = {
        requestCount: 0,
        propID,
        compositeID,
        prop,
        widget,
        representation,
        selectedState,
      };
      return model.previousSelectedData;
    }
    model.previousSelectedData = null;
    return {};
  };

  publicAPI.grabFocus = (widget) => {
    const viewWidget = getViewWidget(widget);
    if (model.widgetInFocus && model.widgetInFocus !== viewWidget) {
      model.widgetInFocus.loseFocus();
    }
    model.widgetInFocus = viewWidget;
    if (model.widgetInFocus) {
      model.widgetInFocus.grabFocus();
    }
  };

  publicAPI.releaseFocus = () => publicAPI.grabFocus(null);

  const superDelete = publicAPI.delete;
  publicAPI.delete = () => {
    while (subscriptions.length) {
      subscriptions.pop().unsubscribe();
    }
    superDelete();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // _camera: null,
  // _selector: null,
  // _currentUpdateSelectionCallID: null,
  viewId: null,
  widgets: [],
  activeWidget: null,
  renderer: null,
  viewType: ViewTypes.DEFAULT,
  isAnimating: false,
  pickingEnabled: true,
  selections: null,
  previousSelectedData: null,
  widgetInFocus: null,
  captureOn: CaptureOn.MOUSE_MOVE,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, [
    'captureOn',
    { type: 'enum', name: 'viewType', enum: ViewTypes },
  ]);
  macro.get(publicAPI, model, [
    'selections',
    'widgets',
    'viewId',
    'pickingEnabled',
    'activeWidget',
  ]);

  // Object specific methods
  vtkWidgetManager(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWidgetManager');

// ----------------------------------------------------------------------------

export default { newInstance, extend, Constants, getPixelWorldHeightAtCoord };
