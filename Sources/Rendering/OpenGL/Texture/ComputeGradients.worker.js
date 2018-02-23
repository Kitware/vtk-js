import glMatrix from 'gl-matrix';
import registerWebworker from 'webworker-promise/lib/register';

import vtkMath from 'vtk.js/Sources/Common/Core/Math';

/* eslint-disable */
// prettier-ignore
registerWebworker(
  function (
    message,
    emit
  ) {
    var width = message.width;
    var height = message.height;
    var depth = message.depth;
    var spacing = message.spacing;
    var data = message.data;
    var haveWebgl2 = message.haveWebgl2;
    var depthStart = message.depthStart;
    var depthEnd = message.depthEnd;

    // have to compute the gradient to get the normal
    // and magnitude
    var depthLength = depthEnd - depthStart + 1;
    var gradients = new Float32Array(width * height * depthLength * 4);
    var gradientMagnitudes = new Float32Array(width * height * depthLength);

    var sliceSize = width * height;
    var inPtr = 0;
    var outPtr = 0;
    var grad = glMatrix.vec3.create();
    glMatrix.vec3.set(
      grad,
      (data[inPtr + 1] - data[inPtr]) / spacing[0],
      (data[inPtr + width] - data[inPtr]) / spacing[1],
      (data[inPtr + sliceSize] - data[inPtr]) / spacing[2]
    );
    var minMag = glMatrix.vec3.length(grad);
    var maxMag = -1.0;
    for (var z = depthStart; z < depthEnd + 1; ++z) {
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
          glMatrix.vec3.set(
            grad,
            (data[edge + 1] - data[edge]) / spacing[0],
            (data[edge + width] - data[edge]) / spacing[1],
            (data[edge + sliceSize] - data[edge]) / spacing[2]
          );

          var mag = glMatrix.vec3.length(grad);
          glMatrix.vec3.normalize(grad, grad);
          gradients[outPtr++] = grad[0];
          gradients[outPtr++] = grad[1];
          gradients[outPtr++] = grad[2];
          gradients[outPtr++] = mag;
          gradientMagnitudes[inPtr] = mag;
          inPtr++;
        }
      }
    }
    var arrayMinMag = vtkMath.arrayMin(gradientMagnitudes);
    var arrayMaxMag = vtkMath.arrayMax(gradientMagnitudes);
    minMag = Math.min(arrayMinMag, minMag);
    maxMag = Math.max(arrayMaxMag, maxMag);

    var result = {
      subGradients: gradients,
      subMinMag: minMag,
      subMaxMag: maxMag,
      subDepthStart: depthStart,
    };
    return Promise.resolve(
      new registerWebworker.TransferableResponse(
        result,
        [result.subGradients.buffer]
      )
    );
  }
);
