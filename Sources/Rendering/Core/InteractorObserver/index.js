import macro from 'vtk.js/Sources/macro';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';

const { vtkErrorMacro, VOID } = macro;

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
          model.interactor[`on${eventName}`]((callData) => {
            if (model.processEvents) {
              return publicAPI[`handle${eventName}`](callData);
            }
            return VOID;
          }, model.priority)
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

    if (enable) {
      if (model.interactor) {
        subscribeToEvents();
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
  // Description:
  // Transform from display to world coordinates.
  publicAPI.computeDisplayToWorld = (renderer, x, y, z) => {
    if (!renderer) {
      return null;
    }

    return model.interactor.getView().displayToWorld(x, y, z, renderer);
  };

  //----------------------------------------------------------------------------
  // Description:
  // Transform from world to display coordinates.
  publicAPI.computeWorldToDisplay = (renderer, x, y, z) => {
    if (!renderer) {
      return null;
    }

    return model.interactor.getView().worldToDisplay(x, y, z, renderer);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  enabled: true,
  interactor: null,
  priority: 0.0,
  processEvents: true,
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
  macro.get(publicAPI, model, ['interactor', 'enabled']);

  // Create get-set macros
  macro.setGet(publicAPI, model, ['priority', 'processEvents']);

  // For more macro methods, see "Sources/macro.js"

  // Object specific methods
  vtkInteractorObserver(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkInteractorObserver');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, STATIC);
