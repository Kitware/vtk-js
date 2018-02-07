import macro from 'vtk.js/Sources/macro';
import vtkInteractorObserver from 'vtk.js/Sources/Rendering/Core/InteractorObserver';

// ----------------------------------------------------------------------------
// vtkAbstractWidget methods
// ----------------------------------------------------------------------------

function vtkAbstractWidget(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkAbstractWidget');
  const superClass = Object.assign({}, publicAPI);

  //----------------------------------------------------------------------------
  // Public API methods
  //----------------------------------------------------------------------------
  // Virtual method
  publicAPI.createDefaultRepresentation = () => {};

  //----------------------------------------------------------------------------
  publicAPI.setEnabled = (enable) => {
    if (enable === model.enabled) {
      return;
    }

    if (model.currentRenderer && model.widgetRep) {
      model.currentRenderer.removeViewProp(model.widgetRep);
    }

    // Enable/disable in superclass
    superClass.setEnabled(enable);

    // Add representation to new interactor's renderer
    if (!model.currentRenderer) {
      return;
    }
    publicAPI.createDefaultRepresentation();
    model.widgetRep.setRenderer(model.currentRenderer);
    model.widgetRep.buildRepresentation();
    model.currentRenderer.addViewProp(model.widgetRep);
  };

  //----------------------------------------------------------------------------
  publicAPI.render = () => {
    if (!model.parent && model.interactor) {
      model.interactor.render();
    }
  };

  //----------------------------------------------------------------------------
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
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkInteractorObserver.extend(publicAPI, model, initialValues);

  // Make widgets disabled by default
  publicAPI.setEnabled(false);

  // Use a priority of 0.5, since default priority from
  // vtkInteractorObserver is 0.0.
  publicAPI.setPriority(0.5);
  macro.setGet(publicAPI, model, ['widgetRep', 'parent']);

  // Object methods
  vtkAbstractWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkAbstractWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
