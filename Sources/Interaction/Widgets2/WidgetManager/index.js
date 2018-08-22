import macro from 'vtk.js/Sources/macro';
import vtkOpenGLHardwareSelector from 'vtk.js/Sources/Rendering/OpenGL/HardwareSelector';
import { FieldAssociations } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';
import { ViewTypes } from 'vtk.js/Sources/Interaction/Widgets2/WidgetManager/Constants';
// ----------------------------------------------------------------------------
// vtkWidgetManager methods
// ----------------------------------------------------------------------------

function vtkWidgetManager(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkWidgetManager');

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

  function removeAllRepresentations() {
    if (model.renderer && model.actors) {
      for (let i = 0; i < model.actors.length; i++) {
        model.renderer.removeActor(model.actors[i]);
      }
      model.actors = [];
    }
  }

  function getActors(widget) {
    const actorList = [];
    const representations = widget.getRepresentationsForViewType(
      model.viewType
    );
    for (let i = 0; i < representations.length; i++) {
      const actors = representations[i].getActors();
      for (let j = 0; j < actors.length; j++) {
        actorList.push(actors[j]);
      }
    }
    return actorList;
  }

  function addAllRepresentations() {
    if (model.renderer && model.actors && model.actors === 0) {
      for (let i = 0; i < model.widgets.length; i++) {
        model.actors = model.actors.concat(getActors(model.widgets[i]));
      }
      // Register all actors to renderer
      model.actors.forEach(model.renderer.addActor);
    }
  }

  function captureBufferForSelection() {
    const [w, h] = model.openGLRenderWindow.getSize();
    model.selector.setArea(0, 0, w, h);
    model.selector.releasePixBuffers();
    model.pickingAvailable = model.selector.captureBuffers();
    console.log('captureBuffers', model.pickingAvailable);
    publicAPI.modified();
  }

  // --------------------------------------------------------------------------
  // API public
  // --------------------------------------------------------------------------

  publicAPI.capture = macro.debounce(captureBufferForSelection, 100);

  publicAPI.setRenderingContext = (openGLRenderWindow, renderer) => {
    removeAllRepresentations();
    model.renderer = renderer;
    model.openGLRenderWindow = openGLRenderWindow;
    model.selector.attach(openGLRenderWindow, renderer);
    addAllRepresentations();
    publicAPI.modified();
  };

  publicAPI.registerWidget = (w) => {
    if (w && model.widgets.indexOf(w) === -1) {
      model.widgets.push(w);
      if (model.renderer) {
        // Register all new actors to renderer
        getActors(w).forEach((a) => {
          model.actors.push(a);
          model.renderer.addActor(a);
        });
      }
      publicAPI.modified();
    }
  };

  publicAPI.unregisterWidget = (w) => {
    const index = model.widgets.indexOf(w);
    if (index !== -1) {
      model.widgets.splice(index, 1);
      removeAllRepresentations();
      addAllRepresentations();
    }
  };

  publicAPI.updateSelectionFromXY = (x, y) => {
    if (model.pickingAvailable) {
      model.selections = model.selector.generateSelection(x, y, x + 1, y + 1);
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
      return {};
    }
    const { propID, compositeID } = model.selections.getProperties();
    const actor = model.renderer.getActors()[propID];
    const widget = model.widgets.find((w) => w.isOwnerOf(actor));
    const representation = widget.getRepresentationOf(actor);
    const widgetState = representation.getWidgetState(compositeID);
    return { actor, widget, representation, widgetState };
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  widgets: [],
  renderer: [],
  actors: [],
  viewType: 0,
  pickingAvailable: false,
  selections: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);
  macro.setGet(publicAPI, model, [
    { type: 'enum', name: 'viewType', enum: ViewTypes },
  ]);
  macro.get(publicAPI, model, ['selections']);

  // Object specific methods
  vtkWidgetManager(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkWidgetManager');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
