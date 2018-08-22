import macro from 'vtk.js/Sources/macro';
import vtkWidgetState from 'vtk.js/Sources/Interaction/Widgets2/WidgetState';

// ----------------------------------------------------------------------------

function vtkCubeState(publicAPI, model) {
  model.classHierarchy.push('vtkCubeState');

  // --------------------------------------------------------------------------

  publicAPI.translate = (dx, dy, dz) => {
    const [x, y, z] = publicAPI.getPositionByReference();
    publicAPI.setPosition(x + dx, y + dy, z + dz);
  };
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  position: [0, 0, 0],
  xLength: 1,
  yLength: 1,
  zLength: 1,
  color: 0.5,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkWidgetState.extend(publicAPI, model);
  macro.setGet(publicAPI, model, [
    'radius',
    'color',
    'xLength',
    'yLength',
    'zLength',
  ]);
  macro.setGetArray(publicAPI, model, ['position'], 3);

  vtkCubeState(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkCubeState');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
