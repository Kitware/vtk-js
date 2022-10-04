import macro from 'vtk.js/Sources/macros';
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

  const superClass = { ...publicAPI };

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
          model._interactor[`on${eventName}`]((callData) => {
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
    if (i === model._interactor) {
      return;
    }

    unsubscribeFromEvents();

    model._interactor = i;

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
      if (model._interactor) {
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

    return model._interactor.getView().displayToWorld(x, y, z, renderer);
  };

  //----------------------------------------------------------------------------
  // Description:
  // Transform from world to display coordinates.
  publicAPI.computeWorldToDisplay = (renderer, x, y, z) => {
    if (!renderer) {
      return null;
    }

    return model._interactor.getView().worldToDisplay(x, y, z, renderer);
  };

  //----------------------------------------------------------------------------

  publicAPI.setPriority = (priority) => {
    const modified = superClass.setPriority(priority);

    if (modified && model._interactor) {
      unsubscribeFromEvents();
      subscribeToEvents();
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  enabled: true,
  // _interactor: null,
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
  macro.get(publicAPI, model, ['_interactor', 'enabled']);

  // Create get-set macros
  macro.setGet(publicAPI, model, ['priority', 'processEvents']);

  macro.moveToProtected(publicAPI, model, ['interactor']);

  // For more macro methods, see "Sources/macros.js"

  // Object specific methods
  vtkInteractorObserver(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkInteractorObserver');

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...STATIC };
