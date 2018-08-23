import macro from 'vtk.js/Sources/macro';
import vtkInteractorObserver from 'vtk.js/Sources/Rendering/Core/InteractorObserver';
import Constants from 'vtk.js/Sources/Interaction/Widgets2/AbstractWidget/Constants';

const { WIDGET_PRIORITY } = Constants;

// ----------------------------------------------------------------------------

function vtkAbstractWidget(publicAPI, model) {
  model.classHierarchy.push('vtkAbstractWidget');

  const subscriptions = [];
  let moveSubscription = null;

  if (!model.representations) {
    model.representations = {};
  }
  const actorsWeakMap = new WeakMap();

  // Expect sub-class to fill mapping
  // model.representationBuilder = {
  //    DEFAULT: [{ builder: vtkSphereHandleRepresentation, labels: []}],
  //    SLICE: [{ builder: vtkSphereHandleRepresentation, labels: []}],
  // }
  // model.viewTypeAlias = [DEFAULT, DEFAULT, SLICE, DEFAULT];

  // --------------------------------------------------------------------------

  publicAPI.activateHandle = ({ selectedState, representation }) => {
    model.widgetState.activateOnly(selectedState);
    model.keepHandleControl = false;
    model.activeState = selectedState;
  };

  // --------------------------------------------------------------------------

  publicAPI.deactivateAllHandles = () => {
    model.widgetState.deactivateAll();
  };

  // --------------------------------------------------------------------------

  publicAPI.getRepresentationsForViewType = (viewType) => {
    const key = model.viewTypeAlias[viewType];
    if (!model.representations[key]) {
      model.representations[key] = model.representationBuilder[key].map(
        ({ builder, labels }) => builder.newInstance({ labels })
      );
      model.representations[key].forEach((rep, idx) => {
        rep.setInputData(model.widgetState);
        rep.getActors().forEach((actor) => {
          actorsWeakMap.set(actor, rep);
        });
      });
    }
    return model.representations[key];
  };

  // --------------------------------------------------------------------------

  publicAPI.hasActor = (actor) => actorsWeakMap.has(actor);

  // --------------------------------------------------------------------------

  publicAPI.getRepresentationFromActor = (actor) => actorsWeakMap.get(actor);

  // --------------------------------------------------------------------------

  // only wire up drag logic if widget implements it
  function setupDrag() {
    while (subscriptions.length) {
      subscriptions.pop().unsubscribe();
    }

    if (model.interactor) {
      subscriptions.push(
        model.interactor.onLeftButtonPress(() => {
          if (!model.activeState || !model.activeState.getActive()) {
            return macro.VOID;
          }
          model.keepHandleControl = true;
          if (moveSubscription) {
            moveSubscription.unsubscribe();
          }
          moveSubscription = model.interactor.onMouseMove(publicAPI.handleDrag);
          return macro.EVENT_ABORT;
        }, WIDGET_PRIORITY)
      );
      subscriptions.push(
        model.interactor.onLeftButtonRelease(() => {
          model.keepHandleControl = false;
          if (moveSubscription) {
            moveSubscription.unsubscribe();
          }
          model.widgetState.deactivateAll();
        }, WIDGET_PRIORITY)
      );
    }
  }

  // --------------------------------------------------------------------------

  publicAPI.setInteractor = macro.chain(publicAPI.setInteractor, () => {
    if (publicAPI.handleDrag) {
      setupDrag();
    }
  });

  // --------------------------------------------------------------------------

  publicAPI.setPriority(WIDGET_PRIORITY);

  // --------------------------------------------------------------------------

  publicAPI.hasControl = () => model.keepHandleControl;
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  widgetState: null,
  openGLRenderWindow: null,
  renderer: null,
  representations: null,
  keepHandleControl: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkInteractorObserver.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, [
    'widgetState',
    'openGLRenderWindow',
    'renderer',
  ]);

  vtkAbstractWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkAbstractWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
