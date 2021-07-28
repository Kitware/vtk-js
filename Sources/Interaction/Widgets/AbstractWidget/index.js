import macro from 'vtk.js/Sources/macros';
import vtkInteractorObserver from 'vtk.js/Sources/Rendering/Core/InteractorObserver';

// ----------------------------------------------------------------------------
// vtkAbstractWidget methods
// ----------------------------------------------------------------------------

function vtkAbstractWidget(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkAbstractWidget');
  const superClass = { ...publicAPI };

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

    if (model.interactor) {
      const renderer = model.interactor.getCurrentRenderer();
      if (renderer && model.widgetRep) {
        renderer.removeViewProp(model.widgetRep);
      }
    }

    // Enable/disable in superclass
    superClass.setEnabled(enable);

    if (enable) {
      // Add representation to new interactor's renderer
      if (!model.interactor) {
        return;
      }
      const renderer = model.interactor.getCurrentRenderer();
      if (!renderer) {
        return;
      }
      publicAPI.createDefaultRepresentation();
      model.widgetRep.setRenderer(renderer);
      model.widgetRep.buildRepresentation();
      renderer.addViewProp(model.widgetRep);
    }
  };

  //----------------------------------------------------------------------------
  publicAPI.render = () => {
    if (!model.parent && model.interactor) {
      model.interactor.render();
    }
  };

  publicAPI.isDragable = () =>
    model.dragable && (model.parent ? model.parent.isDragable() : true);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  enabled: false, // Make widgets disabled by default
  priority: 0.5, // Use a priority of 0.5, since default priority from vtkInteractorObserver is 0.0.
  widgetRep: null,
  parent: null,
  dragable: true,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  const newDefault = { ...DEFAULT_VALUES, ...initialValues };

  // Inheritance
  vtkInteractorObserver.extend(publicAPI, model, newDefault);

  macro.setGet(publicAPI, model, ['widgetRep', 'parent', 'dragable']);

  // Object methods
  vtkAbstractWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkAbstractWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
