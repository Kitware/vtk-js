import macro from 'vtk.js/Sources/macro';
import vtkDistanceRepresentation from 'vtk.js/Sources/Interaction/Widgets/DistanceRepresentation';
import vtkLineWidget from 'vtk.js/Sources/Interaction/Widgets/LineWidget';

// ----------------------------------------------------------------------------
// vtkDistanceWidget methods
// ----------------------------------------------------------------------------

function vtkDistanceWidget(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkDistanceWidget');

  const superClass = Object.assign({}, publicAPI);

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

  publicAPI.createDefaultRepresentation = () => {
    if (!model.widgetRep) {
      model.widgetRep = vtkDistanceRepresentation.newInstance();
    }
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

  // Object methods
  vtkDistanceWidget(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkDistanceWidget');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
