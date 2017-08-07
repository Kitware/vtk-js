import { mat4, vec3 } from 'gl-matrix';

import macro     from 'vtk.js/Sources/macro';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

// ----------------------------------------------------------------------------
// vtkPixelSpaceCallbackMapper methods
// ----------------------------------------------------------------------------

function vtkPixelSpaceCallbackMapper(publicAPI, model) {
  model.classHierarchy.push('vtkPixelSpaceCallbackMapper');

  if (!model.callback) {
    model.callback = () => {};
  }

  publicAPI.invokeCallback = (dataset, camera, aspect, windowSize) => {
    if (!model.callback) {
      return;
    }

    const matrix = camera.getCompositeProjectionTransformMatrix(aspect, -1, 1);
    mat4.transpose(matrix, matrix);

    const dataPoints = dataset.getPoints();
    const hw = windowSize.usize / 2;
    const hh = windowSize.vsize / 2;
    const coords2d = [];
    for (let pidx = 0; pidx < dataPoints.getNumberOfPoints(); pidx += 1) {
      const point = dataPoints.getPoint(pidx);
      const result = vec3.fromValues(point[0], point[1], point[2]);
      vec3.transformMat4(result, result, matrix);
      coords2d.push([(result[0] * hw) + hw, (result[1] * hh) + hh]);
    }

    model.callback(coords2d);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  callback: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkMapper.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, [
    'callback',
  ]);

  // Object methods
  vtkPixelSpaceCallbackMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkPixelSpaceCallbackMapper');

// ----------------------------------------------------------------------------

export default { newInstance, extend };

