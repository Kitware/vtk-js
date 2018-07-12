import macro from 'vtk.js/Sources/macro';
import vtkDistanceRepresentation from 'vtk.js/Sources/Interaction/Widgets/DistanceRepresentation';
import vtkLabelWidget from 'vtk.js/Sources/Interaction/Widgets/LabelWidget';
import vtkLineWidget from 'vtk.js/Sources/Interaction/Widgets/LineWidget';

// ----------------------------------------------------------------------------
// vtkDistanceWidget methods
// ----------------------------------------------------------------------------

function vtkDistanceWidget(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkDistanceWidget');

  const superClass = Object.assign({}, publicAPI);

  publicAPI.setInteractor = (i) => {
    superClass.setInteractor(i);

    model.labelWidget.setInteractor(model.interactor);

    publicAPI.modified();
  };

  publicAPI.setEnabled = (enabling) => {
    superClass.setEnabled(enabling);

    model.labelWidget.setEnabled(publicAPI.computeLabelWidgetVisibility());
  };

  publicAPI.createDefaultRepresentation = () => {
    if (!model.widgetRep) {
      publicAPI.setWidgetRep(vtkDistanceRepresentation.newInstance());
    }
  };

  publicAPI.setWidgetRep = (rep) => {
    superClass.setWidgetRep(rep);

    if (model.widgetRep) {
      model.labelWidget.setWidgetRep(model.widgetRep.getLabelRepresentation());
    }
  };

  publicAPI.computeLabelWidgetVisibility = () =>
    model.currentHandle !== 0 && model.enabled;

  publicAPI.setCurrentHandle = (value) => {
    superClass.setCurrentHandle(value);

    model.labelWidget.setEnabled(publicAPI.computeLabelWidgetVisibility());
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkLineWidget.extend(publicAPI, model, initialValues);

  model.labelWidget = vtkLabelWidget.newInstance();
  model.labelWidget.setProcessEvents(false);

  // Object methods
  vtkDistanceWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkDistanceWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
