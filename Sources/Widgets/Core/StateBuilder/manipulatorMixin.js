import macro from 'vtk.js/Sources/macros';

// ----------------------------------------------------------------------------

function vtkManipulatorMixin(publicAPI, model) {
  publicAPI.updateManipulator = () => {
    if (model.manipulator) {
      const { origin, normal, direction } = model;
      const {
        setHandleOrigin,
        setHandleCenter,
        setHandleNormal,
        setHandleDirection,
      } = model.manipulator;

      if (origin && setHandleOrigin) {
        setHandleOrigin(origin);
      } else if (origin && setHandleCenter) {
        setHandleCenter(origin);
      }

      if (direction && setHandleDirection) {
        setHandleDirection(direction);
      } else if (direction && !normal && setHandleNormal) {
        setHandleNormal(direction);
      } else if (normal && setHandleDirection) {
        setHandleDirection(normal);
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
