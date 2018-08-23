import macro from 'vtk.js/Sources/macro';
import vtkWidgetState from 'vtk.js/Sources/Interaction/Widgets2/WidgetState';
import vtkPositionMixin from 'vtk.js/Sources/Interaction/Widgets2/States/PositionMixin';
import vtkColorMixin from 'vtk.js/Sources/Interaction/Widgets2/States/ColorMixin';

// ----------------------------------------------------------------------------

function vtkSphereState(publicAPI, model) {
  model.classHierarchy.push('vtkSphereState');

  // --------------------------------------------------------------------------

  // return the scale of the bounding box of the sphere, which is a box
  // with side length equal to the sphere diameter
  publicAPI.getScale1 = () => 2 * model.radius;

  // --------------------------------------------------------------------------

  publicAPI.getScale3 = () => Array(3).fill(2 * model.radius);
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  radius: 1,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkWidgetState.extend(publicAPI, model, initialValues);
  vtkPositionMixin.extend(publicAPI, model, initialValues);
  vtkColorMixin.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['radius']);

  vtkSphereState(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkSphereState');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
