import macro from 'vtk.js/Sources/macros';

const { vtkWarningMacro } = macro;

// Default cap on recursive subdivision in compose(): 2^-24 of a segment
// is beyond float32 texture precision.
const DEFAULT_MAX_SUBDIVISION_DEPTH = 24;

function getColorFunctionXValues(cfun) {
  const size = cfun.getSize();
  const xValues = new Array(size);
  cfun.getDataPointer().forEach((n, index) => {
    xValues[index] = n.x;
  });
  return xValues;
}

function isPiecewiseLinear(fn) {
  const v = [0, 0, 0, 0]; // [x, y, midpoint, sharpness]
  // The last node's midpoint and sharpness shape the transition to a
  // following node that does not exist, so it is exempt.
  for (let i = 0; i < fn.getSize() - 1; i++) {
    fn.getNodeValue(i, v);
    if (v[2] !== 0.5 || v[3] !== 0) {
      return false;
    }
  }
  return true;
}

// Compose a chain of piecewise value-transform functions and a final-stage
// color transfer function into a single output color transfer function.
// See helpers.d.ts for the full contract.
export function compose(
  fnList,
  colorFn,
  outputFn,
  errorThreshold = null,
  maxSubdivisionDepth = DEFAULT_MAX_SUBDIVISION_DEPTH
) {
  const variedIdx = fnList.findIndex((fn) => fn.getType() === 'Varied');
  if (variedIdx !== -1) {
    vtkWarningMacro(
      `compose: transform function at index ${variedIdx} is not ` +
        'monotonic; aborting composition.'
    );
    return null;
  }

  if (errorThreshold == null) {
    const nonlinearIdx = fnList.findIndex((fn) => !isPiecewiseLinear(fn));
    if (nonlinearIdx !== -1) {
      vtkWarningMacro(
        `compose: transform function at index ${nonlinearIdx} is not ` +
          'piecewise linear (midpoint 0.5, sharpness 0) and no ' +
          'errorThreshold is given to capture its shape through ' +
          'subdivision; aborting composition.'
      );
      return null;
    }
  }

  const xSet = new Set();

  // Pull a breakpoint back through fnList[idx - 1] .. fnList[0] into the
  // original data domain. Returns null when the breakpoint cannot be
  // inverted (findX returns null for values unattainable by the stage).
  function pullBack(startIdx, value) {
    let x = value;
    for (let j = startIdx; j >= 0; j--) {
      x = fnList[j].findX(x);
      if (x == null) {
        return null;
      }
    }
    return x;
  }

  // Each function's breakpoint x-values live in that function's input domain.
  fnList.forEach((fn, idx) => {
    const data = fn.getDataPointer();
    if (!data) return;
    for (let i = 0; i < data.length; i += 2) {
      const x = pullBack(idx - 1, data[i]);
      if (x != null) xSet.add(x);
    }
  });

  // Also reverse compute from x-values of the final-stage color transfer function,
  // and add those to our xSet so that we don't miss any break points defined
  // within the color transfer function.
  const colorXs = getColorFunctionXValues(colorFn);
  colorXs.forEach((x) => {
    const t = pullBack(fnList.length - 1, x);
    if (t != null) xSet.add(t);
  });

  // Now use the gathered x values to propagate through the entire set of
  // functions to determine the final color values for each, and add them
  // as nodes to our new color transfer function.
  const xs = Array.from(xSet).sort((a, b) => a - b);

  function composedColor(x) {
    const finalScalar = fnList.reduce((val, fn) => fn.getValue(val), x);
    const rgb = [0, 0, 0];
    colorFn.getColor(finalScalar, rgb);
    return rgb;
  }

  // Recursively split [x0, x1] at its midpoint until linear interpolation
  // of the endpoint colors matches the true composed color on every
  // channel to within errorThreshold, and return the maximum midpoint
  // deviation left in the emitted segments. The depth cap guarantees
  // termination around discontinuities (colorFn sharpness ~1), where the
  // midpoint test can never pass; a residual above errorThreshold means
  // the cap stopped refinement.
  function subdivide(x0, c0, x1, c1, depth) {
    const xm = 0.5 * (x0 + x1);
    if (xm <= x0 || xm >= x1) {
      // Float precision exhausted; nothing left to measure or refine.
      return 0;
    }
    const cm = composedColor(xm);
    const deviation = cm.reduce(
      (max, c, i) => Math.max(max, Math.abs(c - 0.5 * (c0[i] + c1[i]))),
      0
    );
    if (depth <= 0 || (errorThreshold != null && deviation <= errorThreshold)) {
      return deviation;
    }
    // The midpoint becomes a node (exact there), so the residual is
    // whatever the two halves leave behind.
    const leftError = subdivide(x0, c0, xm, cm, depth - 1);
    outputFn.addRGBPoint(xm, cm[0], cm[1], cm[2]);
    const rightError = subdivide(xm, cm, x1, c1, depth - 1);
    return Math.max(leftError, rightError);
  }

  const colors = xs.map(composedColor);
  // Without a threshold, depth 0 measures each segment's midpoint
  // deviation without subdividing, so the returned error is meaningful
  // in both modes.
  const depth = errorThreshold != null ? maxSubdivisionDepth : 0;
  let maxError = 0;
  outputFn.removeAllPoints();
  xs.forEach((x, i) => {
    const rgb = colors[i];
    outputFn.addRGBPoint(x, rgb[0], rgb[1], rgb[2]);
    if (i + 1 < xs.length) {
      maxError = Math.max(
        maxError,
        subdivide(x, rgb, xs[i + 1], colors[i + 1], depth)
      );
    }
  });

  return maxError;
}
