import macro from 'vtk.js/Sources/macro';
import vtkWidgetState from 'vtk.js/Sources/Interaction/Widgets2/WidgetState';
import vtkPositionMixin from 'vtk.js/Sources/Interaction/Widgets2/States/PositionMixin';
import vtkColorMixin from 'vtk.js/Sources/Interaction/Widgets2/States/ColorMixin';

// ----------------------------------------------------------------------------

function vtkSphereState(publicAPI, model) {
  model.classHierarchy.push('vtkSphereState');
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  radius: 1,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkWidgetState.extend(publicAPI, model);
  vtkPositionMixin.extend(publicAPI, model);
  vtkColorMixin.extend(publicAPI, model);

  macro.setGet(publicAPI, model, ['radius']);

  vtkSphereState(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkSphereState');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
