import macro from 'vtk.js/Sources/macro';
import { radiansFromDegrees } from 'vtk.js/Sources/Common/Core/Math';
import vtkOpenGLHardwareSelector from 'vtk.js/Sources/Rendering/OpenGL/HardwareSelector';
import { FieldAssociations } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';
import Constants from 'vtk.js/Sources/Widgets/Core/WidgetManager/Constants';
import vtkSVGRepresentation from 'vtk.js/Sources/Widgets/SVG/SVGRepresentation';

import { diff } from './vdom';

const { ViewTypes, RenderingTypes, CaptureOn } = Constants;
const { vtkErrorMacro } = macro;
const { createSvgElement, createSvgDomElement } = vtkSVGRepresentation;

let viewIdCount = 1;

// ----------------------------------------------------------------------------
// Helper
// ----------------------------------------------------------------------------

export function extractRenderingComponents(renderer) {
  const camera = renderer.getActiveCamera();
  const renderWindow = renderer.getRenderWindow();
  const interactor = renderWindow.getInteractor();
  const openGLRenderWindow = interactor.getView();
  return { renderer, renderWindow, interactor, openGLRenderWindow, camera };
}

// ----------------------------------------------------------------------------

function createSvgRoot(id) {
  const svgRoot = createSvgDomElement('svg');
  svgRoot.setAttribute(
    'style',
    'position: absolute; top: 0; left: 0; width: 100%; height: 100%;'
  );
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

  model.selector = vtkOpenGLHardwareSelector.newInstance();
  model.selector.setFieldAssociation(
    FieldAssociations.FIELD_ASSOCIATION_POINTS
  );

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

  function enableSvgLayer() {
    const container = model.openGLRenderWindow.getReferenceByName('el');
    const canvas = model.openGLRenderWindow.getCanvas();
    container.insertBefore(model.svgRoot, canvas.nextSibling);
    const containerStyles = window.getComputedStyle(container);
    if (containerStyles.position === 'static') {
      container.style.position = 'relative';
    }
  }

  function disableSvgLayer() {
    const container = model.openGLRenderWindow.getReferenceByName('el');
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
    const [cwidth, cheight] = model.openGLRenderWindow.getSize();
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

        Promise.all(pendingContent).then((vnodes) => {
          if (model.deleted) {
            return;
          }
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
    const { openGLRenderWindow, camera, renderer } = model;
    if (renderer && openGLRenderWindow && camera) {
      const [rwW, rwH] = openGLRenderWindow.getSize();
      const [vxmin, vymin, vxmax, vymax] = renderer.getViewport();
      const rendererPixelDims = [rwW * (vxmax - vxmin), rwH * (vymax - vymin)];

      const cameraPosition = camera.getPosition();
      const cameraDir = camera.getDirectionOfProjection();
      const isParallel = camera.getParallelProjection();
      const dispHeightFactor = isParallel
        ? camera.getParallelScale()
        : 2 * Math.tan(radiansFromDegrees(camera.getViewAngle()) / 2);

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

  function captureBuffers(x1, y1, x2, y2) {
    renderPickingBuffer();

    model.selector.setArea(x1, y1, x2, y2);
    model.selector.releasePixBuffers();

    model.previousSelectedData = null;
    return model.selector.captureBuffers();
  }

  publicAPI.enablePicking = () => {
    model.pickingEnabled = true;
    model.pickingAvailable = true;
    publicAPI.renderWidgets();
  };

  publicAPI.renderWidgets = () => {
    if (model.pickingEnabled && model.captureOn === CaptureOn.MOUSE_RELEASE) {
      const [w, h] = model.openGLRenderWindow.getSize();
      model.pickingAvailable = captureBuffers(0, 0, w, h);
    }

    renderFrontBuffer();
    publicAPI.modified();
  };

  publicAPI.disablePicking = () => {
    model.pickingEnabled = false;
    model.pickingAvailable = false;
  };

  publicAPI.setRenderer = (renderer) => {
    Object.assign(model, extractRenderingComponents(renderer));
    while (subscriptions.length) {
      subscriptions.pop().unsubscribe();
    }

    model.selector.attach(model.openGLRenderWindow, model.renderer);

    subscriptions.push(model.interactor.onRenderEvent(updateSvg));

    subscriptions.push(model.openGLRenderWindow.onModified(setSvgSize));
    setSvgSize();

    subscriptions.push(
      model.openGLRenderWindow.onModified(updateDisplayScaleParams)
    );
    subscriptions.push(model.camera.onModified(updateDisplayScaleParams));
    updateDisplayScaleParams();

    subscriptions.push(
      model.interactor.onStartAnimation(() => {
        model.isAnimating = true;
      })
    );
    subscriptions.push(
      model.interactor.onEndAnimation(() => {
        model.isAnimating = false;
        if (model.pickingEnabled) {
          publicAPI.enablePicking();
        }
      })
    );

    subscriptions.push(
      model.interactor.onMouseMove(({ position }) => {
        if (model.isAnimating || !model.pickingAvailable) {
          return;
        }
        publicAPI.updateSelectionFromXY(position.x, position.y);
        const {
          requestCount,
          selectedState,
          representation,
          widget,
        } = publicAPI.getSelectedData();

        if (requestCount) {
          // Call activate only once
          return;
        }

        // Default cursor behavior
        model.openGLRenderWindow.setCursor(widget ? 'pointer' : 'default');

        if (model.widgetInFocus === widget && widget.hasFocus()) {
          widget.activateHandle({ selectedState, representation });
          // Ken FIXME
          model.interactor.render();
          model.interactor.render();
        } else {
          for (let i = 0; i < model.widgets.length; i++) {
            const w = model.widgets[i];
            if (w === widget && w.getPickable()) {
              w.activateHandle({ selectedState, representation });
              model.activeWidget = w;
            } else {
              w.deactivateAllHandles();
            }
          }
          // Ken FIXME
          model.interactor.render();
          model.interactor.render();
        }
      })
    );

    publicAPI.modified();

    if (model.pickingEnabled) {
      publicAPI.enablePicking();
    }

    if (model.useSvgLayer) {
      enableSvgLayer();
    }
  };

  publicAPI.addWidget = (widget, viewType, initialValues) => {
    if (!model.renderer) {
      vtkErrorMacro(
        'Widget manager MUST BE link to a view before registering widgets'
      );
      return null;
    }
    const { viewId, renderer } = model;
    const w = widget.getWidgetForView({
      viewId,
      renderer,
      viewType: viewType || ViewTypes.DEFAULT,
      initialValues,
    });

    if (model.widgets.indexOf(w) === -1) {
      model.widgets.push(w);
      w.setWidgetManager(publicAPI);
      updateWidgetWeakMap(w);

      // Register to renderer
      model.renderer.addActor(w);

      publicAPI.modified();
    }

    return w;
  };

  publicAPI.removeWidget = (widget) => {
    const viewWidget = getViewWidget(widget);
    const index = model.widgets.indexOf(viewWidget);
    if (index !== -1) {
      model.widgets.splice(index, 1);
      model.renderer.removeActor(viewWidget);
      model.renderer.getRenderWindow().getInteractor().render();
      publicAPI.enablePicking();

      removeFromSvgLayer(viewWidget);

      if (model.widgetInFocus === viewWidget) {
        publicAPI.releaseFocus();
      }

      // free internal model + unregister it from its parent
      viewWidget.delete();
    }
  };

  publicAPI.updateSelectionFromXY = (x, y) => {
    if (model.pickingEnabled) {
      let pickingAvailable = model.pickingAvailable;

      if (model.captureOn === CaptureOn.MOUSE_MOVE) {
        pickingAvailable = captureBuffers(x, y, x, y);
        renderFrontBuffer();
      }

      if (pickingAvailable) {
        model.selections = model.selector.generateSelection(x, y, x, y);
      }
    }
  };

  publicAPI.updateSelectionFromMouseEvent = (event) => {
    const { pageX, pageY } = event;
    const {
      top,
      left,
      height,
    } = model.openGLRenderWindow.getCanvas().getBoundingClientRect();
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
    if (
      model.previousSelectedData &&
      model.previousSelectedData.prop === prop &&
      model.previousSelectedData.compositeID === compositeID
    ) {
      model.previousSelectedData.requestCount++;
      return model.previousSelectedData;
    }

    if (!propsWeakMap.has(prop)) {
      return {};
    }

    const { widget, representation } = propsWeakMap.get(prop);
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

      if (model.renderer) {
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
  viewId: null,
  widgets: [],
  renderer: [],
  viewType: ViewTypes.DEFAULT,
  pickingAvailable: false,
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
