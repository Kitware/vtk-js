import registerWebworker from 'webworker-promise/lib/register';

registerWebworker(async ({ array, min, max, numberOfBins }, emit) => {
  const delta = max - min;
  const histogram = new Float32Array(numberOfBins);
  histogram.fill(0);
  for (let i = 0, len = array.length; i < len; i++) {
    const idx = Math.floor(
      (numberOfBins - 1) * (Number(array[i]) - min) / delta
    );
    histogram[idx] += 1;
  }

  return new registerWebworker.TransferableResponse(histogram, [
    histogram.buffer,
  ]);
});
