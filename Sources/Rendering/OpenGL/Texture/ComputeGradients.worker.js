import registerWebworker from 'webworker-promise/lib/register';

// ============================================================================
// Inline functions to prevent bringing big dependency into the worker script
// ============================================================================

function arrayMin(arr) {
  let minValue = Infinity;
  for (let i = 0, len = arr.length; i < len; ++i) {
    if (arr[i] < minValue) {
      minValue = arr[i];
    }
  }
  return minValue;
}

// ============================================================================

function arrayMax(arr) {
  let maxValue = -Infinity;
  for (let i = 0, len = arr.length; i < len; ++i) {
    if (maxValue < arr[i]) {
      maxValue = arr[i];
    }
  }
  return maxValue;
}

// ============================================================================

function length(a) {
  const x = a[0];
  const y = a[1];
  const z = a[2];
  return Math.sqrt(x * x + y * y + z * z);
}

// ============================================================================

function normalize(out, a) {
  const x = a[0];
  const y = a[1];
  const z = a[2];
  let len = x * x + y * y + z * z;
  if (len > 0) {
    len = 1 / Math.sqrt(len);
    out[0] = a[0] * len;
    out[1] = a[1] * len;
    out[2] = a[2] * len;
  }
  return out;
}

// ============================================================================

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
    var grad = new Float64Array(3);
    grad[0] = (data[inPtr + 1] - data[inPtr]) / spacing[0];
    grad[1] = (data[inPtr + width] - data[inPtr]) / spacing[1];
    grad[2] = (data[inPtr + sliceSize] - data[inPtr]) / spacing[2];
    var minMag = length(grad);
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
          grad[0] = (data[edge + 1] - data[edge]) / spacing[0];
          grad[1] = (data[edge + width] - data[edge]) / spacing[1];
          grad[2] = (data[edge + sliceSize] - data[edge]) / spacing[2];

          var mag = length(grad);
          normalize(grad, grad);
          // Compact normal encoding (from [-1.0, 1.0] to [0, 255])
          gradients[outPtr++] = 127.5 + 127.5 * grad[0];
          gradients[outPtr++] = 127.5 + 127.5 * grad[1];
          gradients[outPtr++] = 127.5 + 127.5 * grad[2];
          gradientMagnitudes[inPtr++] = mag;
        }
      }
    }
    var arrayMinMag = arrayMin(gradientMagnitudes);
    var arrayMaxMag = arrayMax(gradientMagnitudes);
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
