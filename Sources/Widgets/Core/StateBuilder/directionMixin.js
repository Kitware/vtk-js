import macro from 'vtk.js/Sources/macro';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';

// ----------------------------------------------------------------------------

function vtkDirectionMixin(publicAPI, model) {
  const transform =
    model.angleUnit === 'degree'
      ? vtkMatrixBuilder.buildFromDegree()
      : vtkMatrixBuilder.buildFromRadian();

  publicAPI.rotateFromDirections = (originDirection, targetDirection) => {
    transform
      .identity()
      .rotateFromDirections(originDirection, targetDirection)
      .apply(model.direction);
    publicAPI.modified();
  };

  publicAPI.rotate = (angle, axis) => {
    transform
      .identity()
      .rotate(angle, axis)
      .apply(model.direction);
  };

  publicAPI.rotateX = (angle) => {
    transform
      .identity()
      .rotateX(angle)
      .apply(model.direction);
  };

  publicAPI.rotateY = (angle) => {
    transform
      .identity()
      .rotateY(angle)
      .apply(model.direction);
  };

  publicAPI.rotateZ = (angle) => {
    transform
      .identity()
      .rotateZ(angle)
      .apply(model.direction);
  };
}

// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  direction: [1, 0, 0],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);
  macro.setGetArray(publicAPI, model, ['direction'], 3);
  vtkDirectionMixin(publicAPI, model);
}

// ----------------------------------------------------------------------------

export default { extend };
