import macro from 'vtk.js/Sources/macro';
import vtkWidgetState from 'vtk.js/Sources/Interaction/Widgets2/WidgetState';

// ----------------------------------------------------------------------------

function vtkSphereState(publicAPI, model) {
  model.classHierarchy.push('vtkSphereState');

  // --------------------------------------------------------------------------

  publicAPI.translate = (dx, dy, dz) => {
    const [x, y, z] = publicAPI.getPositionByReference();
    publicAPI.setPosition(x + dx, y + dy, z + dz);
  };
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  position: [0, 0, 0],
  radius: 1,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  vtkWidgetState.extend(publicAPI, model);
  macro.setGet(publicAPI, model, ['radius']);
  macro.setGetArray(publicAPI, model, ['position'], 3);

  vtkSphereState(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkSphereState');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
