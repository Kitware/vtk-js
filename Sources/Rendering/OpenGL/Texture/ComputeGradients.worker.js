import { vec3 } from 'gl-matrix';
import registerWebworker from 'webworker-promise/lib/register';

import vtkMath from 'vtk.js/Sources/Common/Core/Math';

registerWebworker(
  (
    { width, height, depth, spacing, data, haveWebgl2, depthStart, depthEnd },
    emit
  ) => {
    // have to compute the gradient to get the normal
    // and magnitude
    const depthLength = depthEnd - depthStart + 1;
    const gradients = new Float32Array(width * height * depthLength * 4);
    const gradientMagnitudes = new Float32Array(width * height * depthLength);

    const sliceSize = width * height;
    let inPtr = 0;
    let outPtr = 0;
    const grad = vec3.create();
    vec3.set(
      grad,
      (data[inPtr + 1] - data[inPtr]) / spacing[0],
      (data[inPtr + width] - data[inPtr]) / spacing[1],
      (data[inPtr + sliceSize] - data[inPtr]) / spacing[2]
    );
    let minMag = vec3.length(grad);
    let maxMag = -1.0;
    for (let z = depthStart; z < depthEnd + 1; ++z) {
      let zedge = 0;
      if (z === depth - 1) {
        zedge = -sliceSize;
      }
      for (let y = 0; y < height; ++y) {
        let yedge = 0;
        if (y === height - 1) {
          yedge = -width;
        }
        for (let x = 0; x < width; ++x) {
          let edge = inPtr + zedge + yedge;
          if (x === width - 1) {
            edge--;
          }
          vec3.set(
            grad,
            (data[edge + 1] - data[edge]) / spacing[0],
            (data[edge + width] - data[edge]) / spacing[1],
            (data[edge + sliceSize] - data[edge]) / spacing[2]
          );

          const mag = vec3.length(grad);
          vec3.normalize(grad, grad);
          gradients[outPtr++] = grad[0];
          gradients[outPtr++] = grad[1];
          gradients[outPtr++] = grad[2];
          gradients[outPtr++] = mag;
          gradientMagnitudes[inPtr] = mag;
          inPtr++;
        }
      }
    }
    const arrayMinMag = vtkMath.arrayMin(gradientMagnitudes);
    const arrayMaxMag = vtkMath.arrayMax(gradientMagnitudes);
    minMag = Math.min(arrayMinMag, minMag);
    maxMag = Math.max(arrayMaxMag, maxMag);

    const result = {
      subGradients: gradients,
      subMinMag: minMag,
      subMaxMag: maxMag,
      subDepthStart: depthStart,
    };
    return Promise.resolve(
      new registerWebworker.TransferableResponse(result, [gradients.buffer])
    );
  }
);
