import macro from 'vtk.js/Sources/macro';

// ----------------------------------------------------------------------------

function vtkManipulatorMixin(publicAPI, model) {
  publicAPI.updateManipulator = () => {
    if (model.manipulator) {
      const { origin, normal, direction } = model;
      const {
        setOrigin,
        setCenter,
        setNormal,
        setDirection,
      } = model.manipulator;

      if (origin && setOrigin) {
        setOrigin(origin);
      } else if (origin && setCenter) {
        setCenter(origin);
      }

      if (direction && setDirection) {
        setDirection(direction);
      } else if (direction && !normal && setNormal) {
        setNormal(direction);
      } else if (normal && setDirection) {
        setDirection(normal);
      }
    }
  };
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  manipulator: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.setGet(publicAPI, model, ['manipulator']);
  vtkManipulatorMixin(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend };
