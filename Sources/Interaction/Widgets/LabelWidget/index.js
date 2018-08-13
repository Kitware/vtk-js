import macro from 'vtk.js/Sources/macro';
import vtkHandleWidget from 'vtk.js/Sources/Interaction/Widgets/HandleWidget';
import vtkLabelRepresentation from 'vtk.js/Sources/Interaction/Widgets/LabelRepresentation';

const { VOID } = macro;

// ----------------------------------------------------------------------------
// vtkLabelWidget methods
// ----------------------------------------------------------------------------

function vtkLabelWidget(publicAPI, model) {
  // // Set our className
  model.classHierarchy.push('vtkLabelWidget');

  const superClass = Object.assign({}, publicAPI);

  publicAPI.createDefaultRepresentation = () => {
    if (!model.widgetRep) {
      model.widgetRep = vtkLabelRepresentation.newInstance();
    }
  };

  publicAPI.setEnabled = (enabling) => {
    if (!enabling && model.widgetRep) {
      // Remove label
      model.widgetRep.setContainer(null);
    }

    superClass.setEnabled(enabling);

    if (enabling) {
      const container = model.interactor
        ? model.interactor.getContainer()
        : null;
      model.widgetRep.setContainer(container);
    }
  };

  publicAPI.scaleAction = (callData) => VOID;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkHandleWidget.extend(publicAPI, model, initialValues);

  // Object methods
  vtkLabelWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkLabelWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
