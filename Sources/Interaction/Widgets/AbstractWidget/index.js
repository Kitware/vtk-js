import macro from 'vtk.js/Sources/macro';
import vtkInteractorObserver from 'vtk.js/Sources/Rendering/Core/InteractorObserver';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkAbstractWidget methods
// ----------------------------------------------------------------------------

function vtkAbstractWidget(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkAbstractWidget');

  // Virtual method
  publicAPI.createDefaultRepresentation = () => {};

  // Virtual method
  publicAPI.listenEvents = () => {};

  publicAPI.render = () => {
    if (!model.parent && model.interactor) {
      model.interactor.render();
    }
  };

  publicAPI.setEnable = (enable) => {
    if (enable) {
      if (model.enabled) {
        // widget already enabled
        return;
      }
      if (!model.interactor) {
        vtkErrorMacro(
          'The interactor must be set prior to enabling the widget'
        );
        return;
      }

      const eventPosition = model.interactor.getEventPosition();
      let X = 0;
      let Y = 0;
      if (eventPosition) {
        X = eventPosition[0];
        Y = eventPosition[1];
      }

      if (!model.currentRenderer) {
        model.currentRenderer = model.interactor.findPokedRenderer(X, Y);
        if (!model.currentRenderer) {
          return;
        }
      }
      model.enabled = 1;
      publicAPI.createDefaultRepresentation();
      model.widgetRep.setRenderer(model.currentRenderer);

      // Enable listening events
      publicAPI.listenEvents();

      model.widgetRep.getBounds();
      model.widgetRep.buildRepresentation();
      model.currentRenderer.addViewProp(model.widgetRep);
    } else {
      if (!model.enabled) {
        // already
        return;
      }
      model.enabled = 0;

      // Don't listen events
      while (model.unsubscribes.length) {
        model.unsubscribes.pop().unsubscribe();
      }

      if (model.currentRenderer) {
        model.currentRenderer.removeViewProp(model.widgetRep);
      }
      model.currentRenderer = null;
    }
  };

  publicAPI.get2DPointerPosition = () => {
    const pos = model.interactor.getEventPosition(
      model.interactor.getPointerIndex()
    );
    const boundingContainer = model.interactor
      .getCanvas()
      .getBoundingClientRect();
    const position = [
      pos.x - boundingContainer.left,
      pos.y + boundingContainer.top,
    ];
    return position;
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  widgetRep: null,
  parent: null,
  unsubscribes: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkInteractorObserver.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['widgetRep', 'parent']);

  model.unsubscribes = [];

  // Object methods
  vtkAbstractWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkAbstractWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
