export function computeColorShiftScale({
  colorWindow,
  colorLevel,
  useLookupTableScalarRange,
  colorRange,
  volumeScale = 1.0,
  volumeOffset = 0.0,
}) {
  let cw = colorWindow;
  let cl = colorLevel;
  if (useLookupTableScalarRange && colorRange) {
    cw = colorRange[1] - colorRange[0];
    cl = 0.5 * (colorRange[1] + colorRange[0]);
  }
  return {
    colorScale: volumeScale / cw,
    colorShift: (volumeOffset - cl) / cw + 0.5,
  };
}

export function computeOpacityShiftScale({
  pwfRange,
  volumeScale = 1.0,
  volumeOffset = 0.0,
}) {
  if (!pwfRange) {
    return { opacityScale: 1.0, opacityShift: 0.0 };
  }
  const length = pwfRange[1] - pwfRange[0];
  const mid = 0.5 * (pwfRange[0] + pwfRange[1]);
  return {
    opacityScale: volumeScale / length,
    opacityShift: (volumeOffset - mid) / length + 0.5,
  };
}

export function getTransferFunctionHash({
  currentValidInputs,
  independentComponents,
  numberOfRows,
  kind,
  getInputProperty,
}) {
  if (!currentValidInputs.length) {
    return '0';
  }
  const fnName =
    kind === 'color' ? 'getRGBTransferFunction' : 'getPiecewiseFunction';
  const rows = [];
  for (let i = 0; i < numberOfRows; i++) {
    const property = independentComponents
      ? getInputProperty(currentValidInputs[i].inputIndex)
      : getInputProperty(currentValidInputs[0].inputIndex);
    const fn = property?.[fnName]?.(independentComponents ? 0 : i);
    rows.push(`${property?.getMTime?.() ?? 0}:${fn?.getMTime?.() ?? 0}`);
  }
  return rows.join('|');
}
