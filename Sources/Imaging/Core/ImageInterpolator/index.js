import macro from 'vtk.js/Sources/macro';
import vtkAbstractImageInterpolator from 'vtk.js/Sources/Imaging/Core/AbstractImageInterpolator';
import {
  vtkInterpolationWeights,
  vtkInterpolationMathFloor,
  vtkInterpolationMathRound,
  vtkInterpolationMathClamp,
  vtkInterpolationMathWrap,
  vtkInterpolationMathMirror,
} from 'vtk.js/Sources/Imaging/Core/AbstractImageInterpolator/InterpolationInfo';
import {
  InterpolationMode,
  ImageBorderMode,
} from 'vtk.js/Sources/Imaging/Core/AbstractImageInterpolator/Constants';

// ----------------------------------------------------------------------------
// vtkImageInterpolator methods
// ----------------------------------------------------------------------------

function vtkImageInterpolator(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkImageInterpolator');

  publicAPI.computeSupportSize = (matrix) => {
    let s = 1;
    if (model.interpolationMode === InterpolationMode.LINEAR) {
      s = 2;
    } else if (model.interpolationMode === InterpolationMode.CUBIC) {
      s = 4;
    }
    const size = [s, s, s];
    if (matrix == null) {
      return size;
    }
    // TODO CHECK MATRIX
    if (
      matrix[12] !== 0 ||
      matrix[13] !== 0 ||
      matrix[14] !== 0 ||
      matrix[15] !== 1
    ) {
      return size;
    }
    for (let i = 0; i < 3; ++i) {
      let integerRow = true;
      for (let j = 0; j < 3; ++j) {
        integerRow = integerRow && Number.isInteger(matrix[4 * i + j]);
      }
      if (integerRow) {
        size[i] = 1;
      }
    }
    return size;
  };
  publicAPI.internalUpdate = () => {
    model.interpolationInfo.interpolationMode = model.interpolationMode;
  };

  publicAPI.isSeparable = () => true;

  publicAPI.interpolateNearest = (interpolationInfo, point, value) => {
    const inExt = interpolationInfo.extent;
    const inInc = interpolationInfo.increments;
    const numscalars = interpolationInfo.numberOfComponents;

    let inIdX0 = vtkInterpolationMathRound(point[0]);
    let inIdY0 = vtkInterpolationMathRound(point[1]);
    let inIdZ0 = vtkInterpolationMathRound(point[2]);

    switch (interpolationInfo.borderMode) {
      case ImageBorderMode.REPEAT:
        inIdX0 = vtkInterpolationMathWrap(inIdX0, inExt[0], inExt[1]);
        inIdY0 = vtkInterpolationMathWrap(inIdY0, inExt[2], inExt[3]);
        inIdZ0 = vtkInterpolationMathWrap(inIdZ0, inExt[4], inExt[5]);
        break;
      case ImageBorderMode.MIRROR:
        inIdX0 = vtkInterpolationMathMirror(inIdX0, inExt[0], inExt[1]);
        inIdY0 = vtkInterpolationMathMirror(inIdY0, inExt[2], inExt[3]);
        inIdZ0 = vtkInterpolationMathMirror(inIdZ0, inExt[4], inExt[5]);
        break;
      default:
        inIdX0 = vtkInterpolationMathClamp(inIdX0, inExt[0], inExt[1]);
        inIdY0 = vtkInterpolationMathClamp(inIdY0, inExt[2], inExt[3]);
        inIdZ0 = vtkInterpolationMathClamp(inIdZ0, inExt[4], inExt[5]);
        break;
    }

    const startId = inIdX0 * inInc[0] + inIdY0 * inInc[1] + inIdZ0 * inInc[2];
    const inPtr = interpolationInfo.pointer.subarray(
      startId,
      startId + numscalars
    );
    value.set(inPtr, 0);
  };

  publicAPI.interpolatePoint = (interpolationInfo, point, value) => {
    switch (model.interpolationMode) {
      case InterpolationMode.NEAREST:
      default:
        publicAPI.interpolateNearest(interpolationInfo, point, value);
        break;
      case InterpolationMode.LINEAR:
        console.log('LINEAR not implemented');
        break;
      case InterpolationMode.CUBIC:
        console.log('CUBIC not implemented');
        break;
    }
  };

  publicAPI.interpolateRowNearest = (weights, idX, idY, idZ, outPtr, n) => {
    // TODO check pointers
    const iX = weights.positions[0].subarray(idX);
    const iY = weights.positions[1].subarray(idY);
    const iZ = weights.positions[2].subarray(idZ);
    const inPtr0 = weights.pointer.subarray(iY[0] + iZ[0]);

    // get the number of components per pixel
    const numscalars = weights.numberOfComponents;

    // This is a hot loop.
    for (let i = 0; i < n; ++i) {
      outPtr.set(inPtr0.subarray(iX[i], numscalars), i * numscalars);
    }
  };

  publicAPI.interpolateRow = (weights, xIdx, yIdx, zIdx, value, n) => {
    switch (model.interpolationMode) {
      case InterpolationMode.NEAREST:
      default:
        publicAPI.interpolateRowNearest(weights, xIdx, yIdx, zIdx, value, n);
        break;
      case InterpolationMode.LINEAR:
        console.log('LINEAR not implemented');
        break;
      case InterpolationMode.CUBIC:
        console.log('CUBIC not implemented');
        break;
    }
  };

  publicAPI.vtkTricubicInterpWeights = (f) => {
    const half = 0.5;

    // cubic interpolation
    const fm1 = f - 1;
    const fd2 = f * half;
    const ft3 = f * 3;
    return [
      -fd2 * fm1 * fm1,
      ((ft3 - 2) * fd2 - 1) * fm1,
      -((ft3 - 4) * f - 1) * fd2,
      f * fd2 * fm1,
    ];
  };

  publicAPI.precomputeWeightsForExtent = (matrix, outExt, clipExt) => {
    const weights = Object.assign(
      {},
      vtkInterpolationWeights.newInstance(),
      model.interpolationInfo
    );
    weights.weightType = 'Float32Array';
    const interpMode = weights.interpolationMode;
    let validClip = true;
    for (let j = 0; j < 3; ++j) {
      // set k to the row for which the element in column j is nonzero
      let k;
      for (k = 0; k < 3; ++k) {
        if (matrix[4 * j + k] !== 0) {
          break;
        }
      }

      // get the extents
      clipExt[2 * j] = outExt[2 * j];
      clipExt[2 * j + 1] = outExt[2 * j + 1];
      const minExt = weights.extent[2 * k];
      const maxExt = weights.extent[2 * k + 1];
      const minBounds = model.structuredBounds[2 * k];
      const maxBounds = model.structuredBounds[2 * k + 1];

      // the kernel size should not exceed the input dimension
      let step = 1;
      step = interpMode < InterpolationMode.LINEAR ? step : 2;
      step = interpMode < InterpolationMode.CUBIC ? step : 4;
      const inCount = maxExt - minExt + 1;
      step = step < inCount ? step : inCount;

      // if output pixels lie exactly on top of the input pixels
      if (
        Number.isInteger(matrix[4 * j + k]) &&
        Number.isInteger(matrix[4 * k + k])
      ) {
        step = 1;
      }

      const size = step * (outExt[2 * j + 1] - outExt[2 * j] + 1);
      // TODO: check pointers
      const positions = new Int16Array(size);
      // positions -= step*outExt[2 * j];
      const startPositions = step * outExt[2 * j];
      let constants = null;
      if (interpMode !== InterpolationMode.NEAREST) {
        constants = new Int16Array(size);
        // constants -= step * outExt[2 * j];
      }

      weights.kernelSize[j] = step;
      weights.weightExtent[2 * j] = outExt[2 * j];
      weights.weightExtent[2 * j + 1] = outExt[2 * j + 1];
      weights.positions[j] = positions; // TODO: check pointers
      weights.weights[j] = constants; // TODO: check pointers

      let region = 0;
      for (let i = outExt[2 * j]; i <= outExt[2 * j + 1]; ++i) {
        const point = matrix[4 * 3 + k] + i * matrix[4 * j + k];
        let lcount = step;
        let inId0 = 0;
        let f = 0;
        if (interpMode === InterpolationMode.NEAREST) {
          inId0 = Math.round(point);
        } else {
          const res = vtkInterpolationMathFloor(point);
          inId0 = res.integer;
          f = res.error;
          if (interpMode === InterpolationMode.CUBIC && step !== 1) {
            inId0--;
            lcount = 4;
          }
        }

        const inId = [0, 0, 0, 0];
        let l = 0;
        switch (weights.borderMode) {
          case ImageBorderMode.REPEAT:
            do {
              inId[l] = vtkInterpolationMathWrap(inId0, minExt, maxExt);
              inId0++;
            } while (++l < lcount);
            break;
          case ImageBorderMode.MIRROR:
            do {
              inId[l] = vtkInterpolationMathMirror(inId0, minExt, maxExt);
              inId0++;
            } while (++l < lcount);
            break;
          default:
            do {
              inId[l] = vtkInterpolationMathClamp(inId0, minExt, maxExt);
              inId0++;
            } while (++l < lcount);
            break;
        }

        // compute the weights and offsets
        const inInc = weights.increments[k];
        positions[step * i - startPositions] = inId[0] * inInc;
        if (interpMode !== InterpolationMode.NEAREST) {
          constants[step * i - startPositions] = 1;
        }
        if (step > 1) {
          if (interpMode === InterpolationMode.LINEAR) {
            positions[step * i + 1 - startPositions] = inId[1] * inInc;
            constants[step * i - startPositions] = 1.0 - f;
            constants[step * i + 1 - startPositions] = f;
          } else if (interpMode === InterpolationMode.CUBIC) {
            const g = publicAPI.vtkTricubicInterpWeights(f);
            if (step === 4) {
              for (let ll = 0; ll < 4; ll++) {
                positions[step * i + ll - startPositions] = inId[ll] * inInc;
                constants[step * i + ll - startPositions] = g[ll];
              }
            } else {
              // it gets tricky if there are fewer than 4 slices
              const gg = [0, 0, 0, 0];
              for (let ll = 0; ll < 4; ll++) {
                const rIdx = inId[ll] - minExt;
                gg[rIdx] += g[ll];
              }
              for (let jj = 0; jj < step; jj++) {
                positions[step * i + jj - startPositions] = minExt + jj;
                constants[step * i + jj - startPositions] = gg[jj];
              }
            }
          }
        }
        if (point >= minBounds && point <= maxBounds) {
          if (region === 0) {
            // entering the input extent
            region = 1;
            clipExt[2 * j] = i;
          }
        } else if (region === 1) {
          // leaving the input extent
          region = 2;
          clipExt[2 * j + 1] = i - 1;
        }
      }

      if (region === 0 || clipExt[2 * j] > clipExt[2 * j + 1]) {
        // never entered input extent!
        validClip = false;
      }
    }
    if (!validClip) {
      // output extent doesn't itersect input extent
      for (let j = 0; j < 3; j++) {
        clipExt[2 * j] = outExt[2 * j];
        clipExt[2 * j + 1] = outExt[2 * j] - 1;
      }
    }
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  interpolationMode: InterpolationMode.NEAREST,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Inheritance
  vtkAbstractImageInterpolator.extend(publicAPI, model, initialValues);
  macro.setGet(publicAPI, model, ['interpolationMode']);

  // Object specific methods
  vtkImageInterpolator(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkImageInterpolator');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
