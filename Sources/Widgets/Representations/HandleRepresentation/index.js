import macro from 'vtk.js/Sources/macro';
import vtkWidgetRepresentation from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation';
import { Behavior } from 'vtk.js/Sources/Widgets/Representations/WidgetRepresentation/Constants';

// ----------------------------------------------------------------------------
// vtkHandleRepresentation methods
// ----------------------------------------------------------------------------

function vtkHandleRepresentation(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkHandleRepresentation');
  model.behavior = Behavior.HANDLE;
  model.pickable = true;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  activeScaleFactor: 1.2,
  activeColor: 1,
  useActiveColor: true,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  vtkWidgetRepresentation.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, [
    'activeScaleFactor',
    'activeColor',
    'useActiveColor',
  ]);

  vtkHandleRepresentation(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend };
