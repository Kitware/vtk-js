import { mat4, vec3 } from 'gl-matrix';

import macro from 'vtk.js/Sources/macro';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

// ----------------------------------------------------------------------------
// vtkPixelSpaceCallbackMapper methods
// ----------------------------------------------------------------------------

function vtkPixelSpaceCallbackMapper(publicAPI, model) {
  model.classHierarchy.push('vtkPixelSpaceCallbackMapper');

  if (!model.callback) {
    model.callback = () => {};
  }

  publicAPI.invokeCallback = (
    dataset,
    camera,
    aspect,
    windowSize,
    depthValues
  ) => {
    if (!model.callback) {
      return;
    }

    const matrix = camera.getCompositeProjectionMatrix(aspect, -1, 1);
    mat4.transpose(matrix, matrix);

    const dataPoints = dataset.getPoints();
    const result = vec3.fromValues(0, 0, 0);
    const width = windowSize.usize;
    const height = windowSize.vsize;
    const hw = width / 2;
    const hh = height / 2;
    const coords = [];

    for (let pidx = 0; pidx < dataPoints.getNumberOfPoints(); pidx += 1) {
      const point = dataPoints.getPoint(pidx);
      result[0] = point[0];
      result[1] = point[1];
      result[2] = point[2];
      vec3.transformMat4(result, result, matrix);
      const coord = [result[0] * hw + hw, result[1] * hh + hh, result[2], 0];

      if (depthValues) {
        const linIdx = Math.floor(coord[1]) * width + Math.floor(coord[0]);
        const idx = linIdx * 4;
        const r = depthValues[idx] / 255;
        const g = depthValues[idx + 1] / 255;
        const z = (r * 256 + g) / 257;
        coord[3] = z * 2 - 1;
      }

      coords.push(coord);
    }

    model.callback(coords, camera, aspect, depthValues);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  callback: null,
  useZValues: false,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkMapper.extend(publicAPI, model, initialValues);

  macro.setGet(publicAPI, model, ['callback', 'useZValues']);

  // Object methods
  vtkPixelSpaceCallbackMapper(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(
  extend,
  'vtkPixelSpaceCallbackMapper'
);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
