export function computeCoordShiftAndScale(points) {
  // Find out if shift scale should be used
  // Compute squares of diagonal size and distance from the origin
  let diagSq = 0.0;
  let distSq = 0.0;
  for (let i = 0; i < 3; ++i) {
    const range = points.getRange(i);

    const delta = range[1] - range[0];
    diagSq += delta * delta;

    const distShift = 0.5 * (range[1] + range[0]);
    distSq += distShift * distShift;
  }

  const useShiftAndScale =
    diagSq > 0 &&
    (Math.abs(distSq) / diagSq > 1.0e6 || // If data is far from the origin relative to its size
      Math.abs(Math.log10(diagSq)) > 3.0 || // If the size is huge when not far from the origin
      (diagSq === 0 && distSq > 1.0e6)); // If data is a point, but far from the origin

  if (useShiftAndScale) {
    // Compute shift and scale vectors
    const coordShift = new Float64Array(3);
    const coordScale = new Float64Array(3);
    for (let i = 0; i < 3; ++i) {
      const range = points.getRange(i);
      const delta = range[1] - range[0];

      coordShift[i] = 0.5 * (range[1] + range[0]);
      coordScale[i] = delta > 0 ? 1.0 / delta : 1.0;
    }

    return { useShiftAndScale, coordShift, coordScale };
  }

  return {
    useShiftAndScale,
    coordShift: new Float32Array([0, 0, 0]),
    coordScale: new Float32Array([1, 1, 1]),
  };
}

export default { computeCoordShiftAndScale };
