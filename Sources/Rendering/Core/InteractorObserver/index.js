import macro from 'vtk.js/Sources/macro';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

//----------------------------------------------------------------------------
// Description:
// Transform from world to display coordinates.
function computeWorldToDisplay(renderer, x, y, z) {
  const view = renderer.getRenderWindow().getViews()[0];
  return view.worldToDisplay(x, y, z, renderer);
}

//----------------------------------------------------------------------------
// Description:
// Transform from display to world coordinates.
function computeDisplayToWorld(renderer, x, y, z) {
  const view = renderer.getRenderWindow().getViews()[0];
  return view.displayToWorld(x, y, z, renderer);
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------
export const STATIC = {
  computeWorldToDisplay,
  computeDisplayToWorld,
};

// ----------------------------------------------------------------------------
// vtkInteractorObserver methods
// ----------------------------------------------------------------------------

function vtkInteractorObserver(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkInteractorObserver');

  //----------------------------------------------------------------------------
  function unsubscribeFromEvents() {
    while (model.subscribedEvents.length) {
      model.subscribedEvents.pop().unsubscribe();
    }
  }

  //----------------------------------------------------------------------------
  // Check what events we can handle and register callbacks
  function subscribeToEvents() {
    vtkRenderWindowInteractor.handledEvents.forEach((eventName) => {
      if (publicAPI[`handle${eventName}`]) {
        model.subscribedEvents.push(
          model.interactor[`on${eventName}`](
            publicAPI[`handle${eventName}`],
            model.priority
          )
        );
      }
    });
  }

  //----------------------------------------------------------------------------
  // Public API methods
  //----------------------------------------------------------------------------
  publicAPI.setInteractor = (i) => {
    if (i === model.interactor) {
      return;
    }

    unsubscribeFromEvents();
    model.currentRenderer = null;

    model.interactor = i;

    if (i && model.enabled) {
      subscribeToEvents();
    }

    publicAPI.modified();
  };

  //----------------------------------------------------------------------------
  publicAPI.setEnabled = (enable) => {
    if (enable === model.enabled) {
      return;
    }

    unsubscribeFromEvents();
    model.currentRenderer = null;

    if (enable) {
      if (model.interactor) {
        subscribeToEvents();

        // Update CurrentRenderer
        const eventPosition = model.interactor.getEventPosition();
        let X = 0;
        let Y = 0;
        if (eventPosition) {
          X = eventPosition[0];
          Y = eventPosition[1];
        }
        publicAPI.findPokedRenderer(X, Y);
      } else {
        vtkErrorMacro(`
          The interactor must be set before subscribing to events
        `);
      }
    }

    model.enabled = enable;
    publicAPI.modified();
  };

  //----------------------------------------------------------------------------
  publicAPI.findPokedRenderer = (x, y) => {
    publicAPI.setCurrentRenderer(model.interactor.findPokedRenderer(x, y));
  };

  //----------------------------------------------------------------------------
  // Description:
  // Transform from display to world coordinates.
  publicAPI.computeDisplayToWorld = (x, y, z) => {
    if (!model.currentRenderer) {
      return null;
    }

    return model.interactor
      .getView()
      .displayToWorld(x, y, z, model.currentRenderer);
  };

  //----------------------------------------------------------------------------
  // Description:
  // Transform from world to display coordinates.
  publicAPI.computeWorldToDisplay = (x, y, z) => {
    if (!model.currentRenderer) {
      return null;
    }

    return model.interactor
      .getView()
      .worldToDisplay(x, y, z, model.currentRenderer);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  enabled: true,
  interactor: null,
  currentRenderer: null,
  defaultRenderer: null,
  priority: 0.0,
  subscribedEvents: [],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Object methods
  macro.obj(publicAPI, model);

  macro.event(publicAPI, model, 'InteractionEvent');
  macro.event(publicAPI, model, 'StartInteractionEvent');
  macro.event(publicAPI, model, 'EndInteractionEvent');

  // Create get-only macros
  macro.get(publicAPI, model, ['interactor']);

  // Create get-set macros
  macro.setGet(publicAPI, model, ['priority', 'currentRenderer']);

  // For more macro methods, see "Sources/macro.js"

  // Object specific methods
  vtkInteractorObserver(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkInteractorObserver');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, STATIC);
