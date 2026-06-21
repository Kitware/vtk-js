function getColorFunctionXValues(cfun) {
  const ret = [];
  const v = [0, 0, 0, 0, 0, 0]; // [x, r, g, b, midpoint, sharpness]
  for (let i = 0; i < cfun.getSize(); i++) {
    if (cfun.getNodeValue(i, v) === 1) {
      ret.push(v[0]);
    }
  }
  return ret;
}

/**
 * Compose a chain of piecewise (value) transform functions and a color
 * transfer function into a single output color transfer function.
 *
 * Collects all x-positions across all transform functions and chains their
 * outputs through to the color function, producing equivalent break points
 * in the composed result. h(g(f(x))): g's x-values live in f's output domain
 * and must be pulled back through f-inverse; h's x-values need g-inverse then
 * f-inverse, and so on.
 *
 * @param {vtkPiecewiseFunction[]} fnList ordered list of value transform functions, e.g. [modalityFn, voiFn, userFn]
 * @param {vtkColorTransferFunction} colorFn final-stage color transfer function
 * @param {vtkColorTransferFunction} outputFn function to populate with the composed result
 */
export function compose(fnList, colorFn, outputFn) {
  const xSet = new Set();

  // Each function's breakpoint x-values live in that function's input domain.
  fnList.forEach((fn, idx) => {
    const data = fn.getDataPointer();
    if (!data) return;
    for (let i = 0; i < data.length; i += 2) {
      let x = data[i];
      for (let j = idx - 1; j >= 0; j--) {
        x = fnList[j].findX(x);
        if (x == null) break;
      }
      if (x != null) xSet.add(x);
    }
  });

  // Also reverse compute from x-values of the final-stage color transfer function,
  // and add those to our xSet so that we don't miss any break points defined
  // within the color transfer function.
  const colorXs = getColorFunctionXValues(colorFn);
  colorXs.forEach((x) => {
    let t = x;
    for (let j = fnList.length - 1; j >= 0; j--) {
      t = fnList[j].findX(t);
      if (t == null) break;
    }
    if (t != null) xSet.add(t);
  });

  // Now use the gathered x values to propogate through the entire set of
  // functions to determine the final color values for each, and add them
  // as nodes to our new color transfer function.
  const xs = Array.from(xSet).sort((a, b) => a - b);
  outputFn.removeAllPoints();
  xs.forEach((x) => {
    const finalScalar = fnList.reduce((val, fn) => fn.getValue(val), x);
    const rgb = [0, 0, 0];
    colorFn.getColor(finalScalar, rgb);
    outputFn.addRGBPoint(x, rgb[0], rgb[1], rgb[2]);
  });
}
