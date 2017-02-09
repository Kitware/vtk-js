import macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------
// vtkInteractorObserver methods
// ----------------------------------------------------------------------------

function vtkInteractorObserver(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkInteractorObserver');

  // Public API methods
  publicAPI.setInteractor = (i) => {
    if (i === model.interactor) {
      return;
    }

  // Since the observer mediator is bound to the interactor, reset it to
  // 0 so that the next time it is requested, it is queried from the
  // new interactor.
  // Furthermore, remove ourself from the mediator queue.

  // if (this->ObserverMediator)
  //   {
  //   this->ObserverMediator->RemoveAllCursorShapeRequests(this);
  //   this->ObserverMediator = 0;
  //   }

    // if we already have an Interactor then stop observing it
    if (model.interactor) {
      publicAPI.setEnabled(false); // disable the old interactor
      model.charObserverTag();
      model.charObserverTag = null;
      model.deleteObserverTag();
      model.deleteObserverTag = null;
    }

    model.interactor = i;

    // add observers for each of the events handled in ProcessEvents
    if (i) {
      model.charObserverTag = i.onCharEvent(
        publicAPI.keyPressCallbackCommand);
    //                                           this->Priority);
      model.deleteObserverTag = i.onDeleteEvent(
        publicAPI.keyPressCallbackCommand);
    //                                           this->Priority);
      // publicAPI.registerPickers();
    }

    publicAPI.modified();
  };

  //----------------------------------------------------------------------------
  // Description:
  // Transform from display to world coordinates.
  publicAPI.computeDisplayToWorld = (x, y, z) => {
    if (!model.currentRenderer) {
      return null;
    }

    const ndp =
      model.interactor.getView().displayToNormalizedDisplay(x, y, z);

    return model.currentRenderer.normalizedDisplayToWorld(ndp[0], ndp[1], ndp[2]);
  };

  //----------------------------------------------------------------------------
  // Description:
  // Transform from world to display coordinates.
  publicAPI.computeWorldToDisplay = (x, y, z) => {
    if (!model.currentRenderer) {
      return null;
    }

    const ndp = model.currentRenderer.worldToNormalizedDisplay(x, y, z);

    return model.interactor.getView().normalizedDisplayToDisplay(ndp[0], ndp[1], ndp[2]);
  };

  //----------------------------------------------------------------------------
  publicAPI.grabFocus = () => {
  // void vtkInteractorObserver::GrabFocus(vtkCommand *mouseEvents, vtkCommand *keypressEvents)
  // {
  //   if ( this->Interactor )
  //     {
  //     this->Interactor->GrabFocus(mouseEvents,keypressEvents);
  //     }
  };


  //----------------------------------------------------------------------------
  publicAPI.releaseFocus = () => {
  // void vtkInteractorObserver::ReleaseFocus()
  // {
  //   if ( this->Interactor )
  //     {
  //     this->Interactor->ReleaseFocus();
  //     }
  };


  // //----------------------------------------------------------------------------
  // void vtkInteractorObserver::StartInteraction()
  // {
  //   this->Interactor->GetRenderWindow()->SetDesiredUpdateRate(this->Interactor->GetDesiredUpdateRate());
  // }

  // //----------------------------------------------------------------------------
  // void vtkInteractorObserver::EndInteraction()
  // {
  //   this->Interactor->GetRenderWindow()->SetDesiredUpdateRate(this->Interactor->GetStillUpdateRate());
  // }
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  enabled: false,
  interactor: null,
  currentRenderer: null,
  defaultRenderer: null,
  priority: 0.0,
  keyPressActivationValue: 'i',
  charObserverTag: null,
  deleteObserverTag: null,
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
  macro.get(publicAPI, model, [
    'interactor',
  ]);

  // Create get-set macros
  macro.setGet(publicAPI, model, [
    'priority',
    'currentRenderer',
  ]);

  // For more macro methods, see "Sources/macro.js"

  // Object specific methods
  vtkInteractorObserver(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkInteractorObserver');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend });
