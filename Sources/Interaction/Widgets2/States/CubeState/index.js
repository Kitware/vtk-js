import macro from 'vtk.js/Sources/macro';
import vtkWidgetState from 'vtk.js/Sources/Interaction/Widgets2/WidgetState';
import vtkPositionMixin from 'vtk.js/Sources/Interaction/Widgets2/States/PositionMixin';
import vtkColorMixin from 'vtk.js/Sources/Interaction/Widgets2/States/ColorMixin';

// ----------------------------------------------------------------------------

function vtkCubeState(publicAPI, model) {
  model.classHierarchy.push('vtkCubeState');

  // --------------------------------------------------------------------------

  publicAPI.getScale1 = () =>
    Math.min(model.xLength, model.yLength, model.zLength);

  // --------------------------------------------------------------------------

  publicAPI.getScale3 = () => [model.xLength, model.yLength, model.zLength];
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  xLength: 1,
  yLength: 1,
  zLength: 1,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkWidgetState.extend(publicAPI, model, initialValues);
  vtkPositionMixin.extend(publicAPI, model, initialValues);
  vtkColorMixin.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['xLength', 'yLength', 'zLength']);

  vtkCubeState(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCubeState');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
