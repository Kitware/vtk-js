import macro from 'vtk.js/Sources/macro';
import vtkInteractorObserver from 'vtk.js/Sources/Rendering/Core/InteractorObserver';
import vtkStateObserver from 'vtk.js/Sources/Interaction/Widgets2/StateObserver';

import Constants from './Constants';

// ----------------------------------------------------------------------------
// vtkAbstractWidget methods
// ----------------------------------------------------------------------------

function vtkAbstractWidget(publicAPI, model) {
  model.classHierarchy.push('vtkAbstractWidget');

  model.representation = null;

  //----------------------------------------------------------------------------
  // Public API methods
  //----------------------------------------------------------------------------

  // Virtual method
  // This is called whenever widget is enabled.
  // You should either create default reps here or
  // no-op if a user supplied reps for you.
  publicAPI.createDefaultRepresentation = () => {};

  //----------------------------------------------------------------------------

  // Invoke superclass setEnabled first
  publicAPI.setEnabled = macro.chain(publicAPI.setEnabled, (enable) => {
    if (enable) {
      if (!model.interactor) {
        return;
      }

      const renderer = model.interactor.getCurrentRenderer();
      if (!renderer) {
        return;
      }

      const rep = publicAPI.createDefaultRepresentation();
      if (rep) {
        model.representation = rep;
        rep.setWidgetState(publicAPI.getWidgetState());
        renderer.addViewProp(rep);
      }
    } else {
      if (!model.interactor) {
        return;
      }

      const renderer = model.interactor.getCurrentRenderer();
      if (renderer && model.representation) {
        renderer.removeViewProp(model.representation);
      }
    }
  });

  //----------------------------------------------------------------------------

  publicAPI.render = () => {
    if (!model.parent && model.interactor) {
      model.interactor.render();
    }
  };

  //----------------------------------------------------------------------------

  // start off disabled
  publicAPI.setEnabled(false);
  publicAPI.setPriority(Constants.WIDGET_PRIORITY);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkInteractorObserver.extend(publicAPI, model, initialValues);

  macro.get(publicAPI, model, ['parent']);
  macro.setGet(publicAPI, model, ['representation']);

  // mixin
  vtkStateObserver(publicAPI, model);

  // Object methods
  vtkAbstractWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkAbstractWidget');

// ----------------------------------------------------------------------------

export default Object.assign({ newInstance, extend }, Constants);
