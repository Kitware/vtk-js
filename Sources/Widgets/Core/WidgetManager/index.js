import { radiansFromDegrees } from 'vtk.js/Sources/Common/Core/Math';
import { FieldAssociations } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';
import macro from 'vtk.js/Sources/macros';
import vtkSelectionNode from 'vtk.js/Sources/Common/DataModel/SelectionNode';
import Constants from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';
import vtkSVGRepresentation from 'vtk.js/Sources/Widgets/SVG/SVGRepresentation';
import { WIDGET_PRIORITY } from 'vtk.js/Sources/Widgets/Core/AbstractWidget/Constants';
import { diff } from './vdom';

const { ViewTypes, RenderingTypes, CaptureOn } = Constants;
const { vtkErrorMacro, vtkWarningMacro } = macro;
const { createSvgElement, createSvgDomElement } = vtkSVGRepresentation;

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

// ----------------------------------------------------------------------------

function createSvgRoot(id) {
  const svgRoot = createSvgDomElement('svg');
  svgRoot.setAttribute('version', '1.1');
  svgRoot.setAttribute('baseProfile', 'full');

  return svgRoot;
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
  const widgetToSvgMap = new WeakMap();
  const svgVTrees = new WeakMap();
  const subscriptions = [];

  // --------------------------------------------------------------------------
  // Internal variable
  // --------------------------------------------------------------------------

  model.svgRoot = createSvgRoot(model.viewId);

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
  // internal SVG API
  // --------------------------------------------------------------------------

  const pendingSvgRenders = new WeakMap();

  function enableSvgLayer() {
    const container = model._apiSpecificRenderWindow.getReferenceByName('el');
    const canvas = model._apiSpecificRenderWindow.getCanvas();
    container.insertBefore(model.svgRoot, canvas.nextSibling);
    const containerStyles = window.getComputedStyle(container);
    if (containerStyles.position === 'static') {
      container.style.position = 'relative';
    }
  }

  function disableSvgLayer() {
    const container = model._apiSpecificRenderWindow.getReferenceByName('el');
    container.removeChild(model.svgRoot);
  }

  function removeFromSvgLayer(viewWidget) {
    const group = widgetToSvgMap.get(viewWidget);
    if (group) {
      widgetToSvgMap.delete(viewWidget);
      svgVTrees.delete(viewWidget);
      model.svgRoot.removeChild(group);
    }
  }

  function setSvgSize() {
    const [cwidth, cheight] = model._apiSpecificRenderWindow.getViewportSize(
      model._renderer
    );
    const ratio = window.devicePixelRatio || 1;
    const bwidth = String(cwidth / ratio);
    const bheight = String(cheight / ratio);
    const viewBox = `0 0 ${cwidth} ${cheight}`;

    const origWidth = model.svgRoot.getAttribute('width');
    const origHeight = model.svgRoot.getAttribute('height');
    const origViewBox = model.svgRoot.getAttribute('viewBox');

    if (origWidth !== bwidth) {
      model.svgRoot.setAttribute('width', bwidth);
    }
    if (origHeight !== bheight) {
      model.svgRoot.setAttribute('height', bheight);
    }
    if (origViewBox !== viewBox) {
      model.svgRoot.setAttribute('viewBox', viewBox);
    }
  }

  function setSvgRootStyle() {
    const viewport = model._renderer.getViewport().map((v) => v * 100);
    model.svgRoot.setAttribute(
      'style',
      `position: absolute; left: ${viewport[0]}%; top: ${
        100 - viewport[3]
      }%; width: ${viewport[2] - viewport[0]}%; height: ${
        viewport[3] - viewport[1]
      }%;`
    );
  }

  function updateSvg() {
    if (model.useSvgLayer) {
      for (let i = 0; i < model.widgets.length; i++) {
        const widget = model.widgets[i];
        const svgReps = widget
          .getRepresentations()
          .filter((r) => r.isA('vtkSVGRepresentation'));

        let pendingContent = [];
        if (widget.getVisibility()) {
          pendingContent = svgReps
            .filter((r) => r.getVisibility())
            .map((r) => r.render());
        }

        const promise = Promise.all(pendingContent);

        const renders = pendingSvgRenders.get(widget) || [];
        renders.push(promise);
        pendingSvgRenders.set(widget, renders);

        promise.then((vnodes) => {
          let pendingRenders = pendingSvgRenders.get(widget) || [];
          const idx = pendingRenders.indexOf(promise);
          if (model.deleted || widget.isDeleted() || idx === -1) {
            return;
          }

          // throw away previous renders
          pendingRenders = pendingRenders.slice(idx + 1);
          pendingSvgRenders.set(widget, pendingRenders);

          const oldVTree = svgVTrees.get(widget);
          const newVTree = createSvgElement('g');
          for (let ni = 0; ni < vnodes.length; ni++) {
            newVTree.appendChild(vnodes[ni]);
          }

          const widgetGroup = widgetToSvgMap.get(widget);
          let node = widgetGroup;

          const patchFns = diff(oldVTree, newVTree);
          for (let j = 0; j < patchFns.length; j++) {
            node = patchFns[j](node);
          }

          if (!widgetGroup && node) {
            // add
            model.svgRoot.appendChild(node);
            widgetToSvgMap.set(widget, node);
          } else if (widgetGroup && !node) {
            // delete
            widgetGroup.remove();
            widgetToSvgMap.delete(widget);
          }

          svgVTrees.set(widget, newVTree);
        });
      }
    }
  }

  // --------------------------------------------------------------------------
  // Widget scaling
  // --------------------------------------------------------------------------

  function updateDisplayScaleParams() {
    const { _apiSpecificRenderWindow, _camera, _renderer } = model;
    if (_renderer && _apiSpecificRenderWindow && _camera) {
      const [rwW, rwH] = _apiSpecificRenderWindow.getSize();
      const [vxmin, vymin, vxmax, vymax] = _renderer.getViewport();
      const rendererPixelDims = [rwW * (vxmax - vxmin), rwH * (vymax - vymin)];

      const cameraPosition = _camera.getPosition();
      const cameraDir = _camera.getDirectionOfProjection();
      const isParallel = _camera.getParallelProjection();
      const dispHeightFactor = isParallel
        ? 2 * _camera.getParallelScale()
        : 2 * Math.tan(radiansFromDegrees(_camera.getViewAngle()) / 2);

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

  async function updateSelection({ position }) {
    model._selectionInProgress = true;
    const { requestCount, selectedState, representation, widget } =
      await publicAPI.getSelectedDataForXY(position.x, position.y);
    model._selectionInProgress = false;

    if (requestCount) {
      // Call activate only once
      return;
    }

    // Default cursor behavior
    model._apiSpecificRenderWindow.setCursor(widget ? 'pointer' : 'default');

    if (model.widgetInFocus === widget && widget.hasFocus()) {
      widget.activateHandle({ selectedState, representation });
      // Ken FIXME
      model._interactor.render();
      model._interactor.render();
    } else {
      for (let i = 0; i < model.widgets.length; i++) {
        const w = model.widgets[i];
        if (w === widget && w.getNestedPickable()) {
          w.activateHandle({ selectedState, representation });
          model.activeWidget = w;
        } else {
          w.deactivateAllHandles();
        }
      }
      // Ken FIXME
      model._interactor.render();
      model._interactor.render();
    }
  }

  const handleEvent = (eventName) => {
    let guard = false;
    return (callData) => {
      if (
        guard ||
        model.isAnimating ||
        !model.pickingEnabled ||
        model._selectionInProgress
      ) {
        return macro.VOID;
      }

      const updatePromise = updateSelection(callData);
      macro.measurePromiseExecution(updatePromise, (elapsed) => {
        // 100ms is deemed fast enough. Anything higher can degrade usability.
        if (elapsed > 100) {
          macro.vtkWarningMacro(
            `vtkWidgetManager updateSelection() took ${elapsed}ms on ${eventName}`
          );
        }
      });

      updatePromise.then(() => {
        if (model._interactor) {
          // re-trigger the event, ignoring our own handler
          guard = true;
          model._interactor[`invoke${eventName}`](callData);
          guard = false;
        }
      });
      return macro.EVENT_ABORT;
    };
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

    subscriptions.push(model._interactor.onRenderEvent(updateSvg));

    subscriptions.push(renderer.onModified(setSvgRootStyle));
    setSvgRootStyle();

    subscriptions.push(model._apiSpecificRenderWindow.onModified(setSvgSize));
    setSvgSize();

    subscriptions.push(
      model._apiSpecificRenderWindow.onModified(updateDisplayScaleParams)
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

    subscriptions.push(model._interactor.onMouseMove(handleEvent('MouseMove')));
    subscriptions.push(
      model._interactor.onLeftButtonPress(
        handleEvent('LeftButtonPress'),
        // stay after widgets, but before default of 0
        WIDGET_PRIORITY / 2
      )
    );

    publicAPI.modified();

    if (model.pickingEnabled) {
      publicAPI.enablePicking();
    }

    if (model.useSvgLayer) {
      enableSvgLayer();
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
    removeFromSvgLayer(viewWidget);
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
      // First pick SVG representation
      for (let i = 0; i < model.widgets.length; ++i) {
        const widget = model.widgets[i];
        const hoveredSVGReps = widget
          .getRepresentations()
          .filter((r) => r.isA('vtkSVGRepresentation') && r.getHover() != null);
        if (hoveredSVGReps.length) {
          const selection = vtkSelectionNode.newInstance();
          selection.getProperties().compositeID = hoveredSVGReps[0].getHover();
          selection.getProperties().widget = widget;
          selection.getProperties().representation = hoveredSVGReps[0];
          model.selections = [selection];
          return publicAPI.getSelectedData();
        }
      }

      // do we require a new capture?
      if (!model._capturedBuffers || model.captureOn === CaptureOn.MOUSE_MOVE) {
        await captureBuffers(x, y, x, y);
      }

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

      model.selections = model._capturedBuffers.generateSelection(x, y, x, y);
    }
    return publicAPI.getSelectedData();
  };

  publicAPI.updateSelectionFromXY = (x, y) => {
    vtkWarningMacro(
      'updateSelectionFromXY is deprecated, please use getSelectedDataForXY'
    );
    if (model.pickingEnabled) {
      // First pick SVG representation
      for (let i = 0; i < model.widgets.length; ++i) {
        const widget = model.widgets[i];
        const hoveredSVGReps = widget
          .getRepresentations()
          .filter((r) => r.isA('vtkSVGRepresentation') && r.getHover() != null);
        if (hoveredSVGReps.length) {
          const selection = vtkSelectionNode.newInstance();
          selection.getProperties().compositeID = hoveredSVGReps[0].getHover();
          selection.getProperties().widget = widget;
          selection.getProperties().representation = hoveredSVGReps[0];
          model.selections = [selection];
          return;
        }
      }

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
    // prop is undefined for SVG representation, widget is undefined for handle
    // representation.
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

  publicAPI.setUseSvgLayer = (useSvgLayer) => {
    if (useSvgLayer !== model.useSvgLayer) {
      model.useSvgLayer = useSvgLayer;

      if (model._renderer) {
        if (useSvgLayer) {
          enableSvgLayer();
          // force a render so svg widgets can be drawn
          updateSvg();
        } else {
          disableSvgLayer();
        }
      }

      return true;
    }
    return false;
  };

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
  viewId: null,
  widgets: [],
  renderer: null,
  viewType: ViewTypes.DEFAULT,
  isAnimating: false,
  pickingEnabled: true,
  selections: null,
  previousSelectedData: null,
  widgetInFocus: null,
  useSvgLayer: true,
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
    'useSvgLayer',
  ]);

  // Object specific methods
  vtkWidgetManager(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWidgetManager');

// ----------------------------------------------------------------------------

export default { newInstance, extend, Constants };
