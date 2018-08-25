import macro from 'vtk.js/Sources/macro';
import vtkOpenGLHardwareSelector from 'vtk.js/Sources/Rendering/OpenGL/HardwareSelector';
import { FieldAssociations } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';
import {
  ViewTypes,
  RenderingTypes,
} from 'vtk.js/Sources/Interaction/Widgets2/WidgetManager/Constants';

const { vtkErrorMacro } = macro;
let viewIdCount = 1;

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
  // Internal variable
  // --------------------------------------------------------------------------

  model.selector = vtkOpenGLHardwareSelector.newInstance();
  model.selector.setFieldAssociation(
    FieldAssociations.FIELD_ASSOCIATION_POINTS
  );

  // --------------------------------------------------------------------------
  // API internal
  // --------------------------------------------------------------------------

  function getActors(widget) {
    const actorList = [];
    const representations = widget.getRepresentations();
    for (let i = 0; i < representations.length; i++) {
      const representation = representations[i];
      const origin = { widget, representation };
      const actors = representation.getActors();
      for (let j = 0; j < actors.length; j++) {
        const actor = actors[j];
        actorList.push(actor);
        propsWeakMap.set(actor, origin);
      }
    }
    return actorList;
  }

  // --------------------------------------------------------------------------
  // API public
  // --------------------------------------------------------------------------

  function updateWidgetForRender(w) {
    w.updateRepresentationForRender(model.renderingType);
  }

  publicAPI.enablePicking = () => {
    model.renderingType = RenderingTypes.PICKING_BUFFER;
    model.widgets.forEach(updateWidgetForRender);

    console.time('capture');
    const [w, h] = model.openGLRenderWindow.getSize();
    model.selector.setArea(0, 0, w, h);
    model.selector.releasePixBuffers();
    model.pickingAvailable = model.selector.captureBuffers();
    model.previousSelectedData = null;
    console.timeEnd('capture');
    publicAPI.modified();

    model.renderingType = RenderingTypes.FRONT_BUFFER;
    model.widgets.forEach(updateWidgetForRender);
  };

  publicAPI.disablePicking = () => {
    model.pickingAvailable = false;
  };

  publicAPI.setRenderingContext = (openGLRenderWindow, renderer) => {
    while (subscriptions.length) {
      subscriptions.pop().unsubscribe();
    }

    model.renderer = renderer;
    model.openGLRenderWindow = openGLRenderWindow;
    model.selector.attach(openGLRenderWindow, renderer);
    const interactor = renderer.getRenderWindow().getInteractor();

    subscriptions.push(interactor.onStartAnimation(publicAPI.disablePicking));
    subscriptions.push(interactor.onEndAnimation(publicAPI.enablePicking));

    subscriptions.push(
      interactor.onMouseMove(({ position }) => {
        if (!model.pickingAvailable) {
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

        for (let i = 0; i < model.widgets.length; i++) {
          const w = model.widgets[i];
          if (w === widget && w.getActive()) {
            w.activateHandle({ selectedState, representation });
            model.activeWidget = w;
          } else {
            w.deactivateAllHandles();
          }
        }
        interactor.render();
      })
    );

    publicAPI.modified();
    publicAPI.enablePicking();
  };

  publicAPI.registerWidget = (widget, viewType, initialValues) => {
    if (!model.renderer) {
      vtkErrorMacro(
        'Widget manager MUST BE link to a view before registering widgets'
      );
      return null;
    }
    const { viewId, openGLRenderWindow, renderer } = model;
    const w = widget.getWidgetForView({
      viewId,
      openGLRenderWindow,
      renderer,
      viewType: viewType || ViewTypes.DEFAULT,
      initialValues,
    });

    if (model.widgets.indexOf(w) === -1) {
      model.widgets.push(w);

      // Register all new actors to renderer
      getActors(w).forEach((a) => {
        model.renderer.addActor(a);
      });

      publicAPI.modified();
    }

    return w;
  };

  publicAPI.unregisterWidget = (widget) => {
    const viewWidget = widget.isA('vtkAbstractWidget')
      ? widget
      : widget.getWidgetForView({ viewId: model.viewId });
    const index = model.widgets.indexOf(viewWidget);
    if (index !== -1) {
      model.widgets.splice(index, 1);
      const actorsToRemove = getActors(viewWidget);
      while (actorsToRemove.length) {
        model.renderer.removeActor(actorsToRemove.pop());
      }
      model.renderer
        .getRenderWindow()
        .getInteractor()
        .render();
      publicAPI.enablePicking();

      // free internal model + unregister it from its parent
      viewWidget.delete();
    }
  };

  publicAPI.updateSelectionFromXY = (x, y) => {
    if (model.pickingAvailable) {
      model.selections = model.selector.generateSelection(x, y, x, y);
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

    const { widget, representation } = propsWeakMap.get(prop);
    if (widget && representation) {
      const selectedState = representation.getRepresentationStates()[
        compositeID
      ];
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
  selections: null,
  previousSelectedData: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, [
    { type: 'enum', name: 'viewType', enum: ViewTypes },
  ]);
  macro.get(publicAPI, model, ['selections', 'widgets', 'viewId']);

  // Object specific methods
  vtkWidgetManager(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWidgetManager');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
