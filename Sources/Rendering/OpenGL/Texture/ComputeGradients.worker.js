import { vec3 } from 'gl-matrix';
import registerWebworker from 'webworker-promise/lib/register';

import vtkMath from 'vtk.js/Sources/Common/Core/Math';

/* eslint-disable */
// prettier-ignore
registerWebworker(
  function (
    message,
    emit
  ) {
    // have to compute the gradient to get the normal
    // and magnitude
    var width = message.width;
    var height = message.height;
    var depth = message.depth;
    var spacing = message.spacing;
    var data = message.data;
    var haveWebgl2 = message.haveWebgl2;
    var depthStart = message.depthStart;
    var depthEnd = message.depthEnd;

    // only compute gradient for last slice of the web worker
    // if it is the last slice of the volume data
    if (depthEnd !== depth - 1) {
      depthEnd--;
    }
    var depthLength = depthEnd - depthStart + 1;
    var gradients = new Uint8Array(width * height * depthLength * 3);
    var gradientMagnitudes = new Float32Array(width * height * depthLength);

    var sliceSize = width * height;
    var inPtr = 0;
    var outPtr = 0;
    var grad = vec3.create();
    vec3.set(
      grad,
      (data[inPtr + 1] - data[inPtr]) / spacing[0],
      (data[inPtr + width] - data[inPtr]) / spacing[1],
      (data[inPtr + sliceSize] - data[inPtr]) / spacing[2]
    );
    var minMag = vec3.length(grad);
    var maxMag = -1.0;
    for (var z = depthStart; z <= depthEnd; ++z) {
      var zedge = 0;
      if (z === depth - 1) {
        zedge = -sliceSize;
      }
      for (var y = 0; y < height; ++y) {
        var yedge = 0;
        if (y === height - 1) {
          yedge = -width;
        }
        for (var x = 0; x < width; ++x) {
          var edge = inPtr + zedge + yedge;
          if (x === width - 1) {
            edge--;
          }
          vec3.set(
            grad,
            (data[edge + 1] - data[edge]) / spacing[0],
            (data[edge + width] - data[edge]) / spacing[1],
            (data[edge + sliceSize] - data[edge]) / spacing[2]
          );

          var mag = vec3.length(grad);
          vec3.normalize(grad, grad);
          // Compact normal encoding (from [-1.0, 1.0] to [0, 255])
          gradients[outPtr++] = 127.5 + 127.5 * grad[0];
          gradients[outPtr++] = 127.5 + 127.5 * grad[1];
          gradients[outPtr++] = 127.5 + 127.5 * grad[2];
          gradientMagnitudes[inPtr++] = mag;
        }
      }
    }
    var arrayMinMag = vtkMath.arrayMin(gradientMagnitudes);
    var arrayMaxMag = vtkMath.arrayMax(gradientMagnitudes);
    minMag = Math.min(arrayMinMag, minMag);
    maxMag = Math.max(arrayMaxMag, maxMag);

    var result = {
      subGradients: gradients,
      subMagnitudes: gradientMagnitudes,
      subMinMag: minMag,
      subMaxMag: maxMag,
      subDepthStart: depthStart,
      subDepthEnd: depthEnd,
    };
    return Promise.resolve(
      new registerWebworker.TransferableResponse(
        result,
        [result.subGradients.buffer, result.subMagnitudes.buffer]
      )
    );
  }
);
