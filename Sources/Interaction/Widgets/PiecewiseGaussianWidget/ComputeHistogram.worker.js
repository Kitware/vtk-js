import registerWebworker from 'webworker-promise/lib/register';

/* eslint-disable */
// prettier-ignore
registerWebworker(function (message, emit) {
  var array = message.array;
  var min = message.min;
  var max = message.max;

  var offset = message.component || 0;
  var step = message.numberOfComponents || 1;

  var numberOfBins = message.numberOfBins;
  var delta = max - min;
  var histogram = new Float32Array(numberOfBins);
  histogram.fill(0);
  var len = array.length;
  for (var i = offset; i < len; i += step) {
    var idx = Math.floor(
      (numberOfBins - 1) * (Number(array[i]) - min) / delta
    );
    histogram[idx] += 1;
  }

  return Promise.resolve(
    new registerWebworker.TransferableResponse(histogram, [histogram.buffer])
  );
});
