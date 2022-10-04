import macro from 'vtk.js/Sources/macros';
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
    for (let i = 0; i < numscalars; ++i) {
      value[i] = interpolationInfo.pointer[startId + i];
    }
  };

  publicAPI.interpolateLinear = (interpolationInfo, point, value) => {
    const inExt = interpolationInfo.extent;
    const inInc = interpolationInfo.increments;
    const numscalars = interpolationInfo.numberOfComponents;

    const floorX = vtkInterpolationMathFloor(point[0]);
    const floorY = vtkInterpolationMathFloor(point[1]);
    const floorZ = vtkInterpolationMathFloor(point[2]);

    let inIdX0 = floorX.floored;
    let inIdY0 = floorY.floored;
    let inIdZ0 = floorZ.floored;
    const fx = floorX.error;
    const fy = floorY.error;
    const fz = floorZ.error;
    let inIdX1 = inIdX0 + (fx !== 0);
    let inIdY1 = inIdY0 + (fy !== 0);
    let inIdZ1 = inIdZ0 + (fz !== 0);

    switch (interpolationInfo.borderMode) {
      case ImageBorderMode.REPEAT:
        inIdX0 = vtkInterpolationMathWrap(inIdX0, inExt[0], inExt[1]);
        inIdY0 = vtkInterpolationMathWrap(inIdY0, inExt[2], inExt[3]);
        inIdZ0 = vtkInterpolationMathWrap(inIdZ0, inExt[4], inExt[5]);

        inIdX1 = vtkInterpolationMathWrap(inIdX1, inExt[0], inExt[1]);
        inIdY1 = vtkInterpolationMathWrap(inIdY1, inExt[2], inExt[3]);
        inIdZ1 = vtkInterpolationMathWrap(inIdZ1, inExt[4], inExt[5]);
        break;
      case ImageBorderMode.MIRROR:
        inIdX0 = vtkInterpolationMathMirror(inIdX0, inExt[0], inExt[1]);
        inIdY0 = vtkInterpolationMathMirror(inIdY0, inExt[2], inExt[3]);
        inIdZ0 = vtkInterpolationMathMirror(inIdZ0, inExt[4], inExt[5]);

        inIdX1 = vtkInterpolationMathMirror(inIdX1, inExt[0], inExt[1]);
        inIdY1 = vtkInterpolationMathMirror(inIdY1, inExt[2], inExt[3]);
        inIdZ1 = vtkInterpolationMathMirror(inIdZ1, inExt[4], inExt[5]);
        break;
      default:
        inIdX0 = vtkInterpolationMathClamp(inIdX0, inExt[0], inExt[1]);
        inIdY0 = vtkInterpolationMathClamp(inIdY0, inExt[2], inExt[3]);
        inIdZ0 = vtkInterpolationMathClamp(inIdZ0, inExt[4], inExt[5]);

        inIdX1 = vtkInterpolationMathClamp(inIdX1, inExt[0], inExt[1]);
        inIdY1 = vtkInterpolationMathClamp(inIdY1, inExt[2], inExt[3]);
        inIdZ1 = vtkInterpolationMathClamp(inIdZ1, inExt[4], inExt[5]);
        break;
    }

    const factX0 = inIdX0 * inInc[0];
    const factX1 = inIdX1 * inInc[0];
    const factY0 = inIdY0 * inInc[1];
    const factY1 = inIdY1 * inInc[1];
    const factZ0 = inIdZ0 * inInc[2];
    const factZ1 = inIdZ1 * inInc[2];

    const i00 = factY0 + factZ0;
    const i01 = factY0 + factZ1;
    const i10 = factY1 + factZ0;
    const i11 = factY1 + factZ1;

    const rx = 1 - fx;
    const ry = 1 - fy;
    const rz = 1 - fz;

    const ryrz = ry * rz;
    const fyrz = fy * rz;
    const ryfz = ry * fz;
    const fyfz = fy * fz;

    const inPtr = interpolationInfo.pointer;

    for (let i = 0; i < numscalars; ++i) {
      value[i] =
        rx *
          (ryrz * inPtr[factX0 + i00 + i * 4] +
            ryfz * inPtr[factX0 + i01 + i * 4] +
            fyrz * inPtr[factX0 + i10 + i * 4] +
            fyfz * inPtr[factX0 + i11 + i * 4]) +
        fx *
          (ryrz * inPtr[factX1 + i00 + i * 4] +
            ryfz * inPtr[factX1 + i01 + i * 4] +
            fyrz * inPtr[factX1 + i10 + i * 4] +
            fyfz * inPtr[factX1 + i11 + i * 4]);
    }
  };

  publicAPI.interpolatePoint = (interpolationInfo, point, value) => {
    switch (model.interpolationMode) {
      case InterpolationMode.LINEAR:
        publicAPI.interpolateLinear(interpolationInfo, point, value);
        break;
      case InterpolationMode.CUBIC:
        console.log('CUBIC not implemented');
        break;
      case InterpolationMode.NEAREST:
      default:
        publicAPI.interpolateNearest(interpolationInfo, point, value);
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

  publicAPI.interpolateRowLinear = (weights, idX, idY, idZ, outPtr, n) => {
    const stepX = weights.kernelSize[0];
    const stepY = weights.kernelSize[1];
    const stepZ = weights.kernelSize[2];
    const idXtemp = idX * stepX;
    const idYtemp = idY * stepY;
    const idZtemp = idZ * stepZ;
    const fX = weights.weights[0].subarray(idXtemp);
    const fY = weights.weights[1].subarray(idYtemp);
    const fZ = weights.weights[2].subarray(idZtemp);
    const iX = weights.positions[0].subarray(idXtemp);
    const iY = weights.positions[1].subarray(idYtemp);
    const iZ = weights.positions[2].subarray(idZtemp);
    const inPtr = weights.pointer;

    // get the number of components per pixel
    const numscalars = weights.numberOfComponents;

    // create a 2x2 bilinear kernel in local variables
    const i00 = iY.subarray(iZ[0]);
    let i01 = i00;
    let i10 = i00;
    let i11 = i00;

    let ry = 1;
    let fy = 0;
    let rz = 1;
    let fz = 0;

    if (stepY === 2) {
      i10 = iY[1].subarray(iZ[0]);
      i11 = i10;
      ry = fY[0];
      fy = fY[1];
    }

    if (stepZ === 2) {
      i01 = iY[0].subarray(iZ[1]);
      i11 = i01;
      rz = fZ[0];
      fz = fZ[1];
    }

    if (stepY + stepZ === 4) {
      i11 = iY[1].subarray(iZ[1]);
    }

    const ryrz = ry * rz;
    const ryfz = ry * fz;
    const fyrz = fy * rz;
    const fyfz = fy * fz;

    if (stepX === 1) {
      if (fy === 0 && fz === 0) {
        // no interpolation needed at all
        for (let i = n; i > 0; --i) {
          for (let j = 0; j < numscalars; j++) {
            outPtr[j + n - i] = inPtr[i00 + iX[n - i] + j];
          }
        }
      } else if (fy === 0) {
        // only need linear z interpolation
        for (let i = n; i > 0; --i) {
          for (let j = 0; j < numscalars; j++) {
            outPtr[j + n - i] =
              rz * inPtr[iX[n - i] + i00 + j * 4] +
              fz * inPtr[iX[n - i] + i01 + j * 4];
          }
        }
      } else {
        // interpolate in y and z but not in x
        for (let i = n; i > 0; --i) {
          for (let j = 0; j < numscalars; j++) {
            outPtr[j + n - i] =
              ryrz * inPtr[iX[n - i] + i00 + j * 4] +
              ryfz * inPtr[iX[n - i] + i01 + j * 4] +
              fyrz * inPtr[iX[n - i] + i10 + j * 4] +
              fyfz * inPtr[iX[n - i] + i11 + j * 4];
          }
        }
      }
    } else if (fz === 0) {
      let x = 0;
      // bilinear interpolation in x,y
      for (let i = n; i > 0; --i) {
        const rx = fX[0 + 2 * x];
        const fx = fX[1 + 2 * x];

        const t0 = iX[0 + 2 * x];
        const t1 = iX[1 + 2 * x];

        for (let j = 0; j < numscalars; j++) {
          outPtr[j + n - i] =
            rx * (ry * inPtr[t0 + i00 + j * 4] + fy * inPtr[t0 + i10 + j * 4]) +
            fx * (ry * inPtr[t1 + i00 + j * 4] + fy * inPtr[t1 + i10 + j * 4]);
        }
        x++;
      }
    } else {
      let x = 0;
      // do full trilinear interpolation
      for (let i = n; i > 0; --i) {
        const rx = fX[0 + 2 * x];
        const fx = fX[1 + 2 * x];

        const t0 = iX[0 + 2 * x];
        const t1 = iX[1 + 2 * x];

        for (let j = 0; j < numscalars; j++) {
          outPtr[j] =
            rx *
              (ryrz * inPtr[t0 + i00 + j * 4] +
                ryfz * inPtr[t0 + i01 + j * 4] +
                fyrz * inPtr[t0 + i10 + j * 4] +
                fyfz * inPtr[t0 + i11 + j * 4]) +
            fx *
              (ryrz * inPtr[t1 + i00 + j * 4] +
                ryfz * inPtr[t1 + i01 + j * 4] +
                fyrz * inPtr[t1 + i10 + j * 4] +
                fyfz * inPtr[t1 + i11 + j * 4]);
        }
        x++;
      }
    }
  };

  publicAPI.interpolateRow = (weights, xIdx, yIdx, zIdx, value, n) => {
    switch (model.interpolationMode) {
      case InterpolationMode.LINEAR:
        publicAPI.interpolateRowLinear(weights, xIdx, yIdx, zIdx, value, n);
        break;
      case InterpolationMode.CUBIC:
        console.log('CUBIC not implemented');
        break;
      case InterpolationMode.NEAREST:
      default:
        publicAPI.interpolateRowNearest(weights, xIdx, yIdx, zIdx, value, n);
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
    const weights = {
      ...vtkInterpolationWeights.newInstance(),
      ...model.interpolationInfo,
    };
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
