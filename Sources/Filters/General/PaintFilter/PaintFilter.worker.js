import registerWebworker from 'webworker-promise/lib/register';

const globals = {
  // single-component labelmap
  buffer: null,
  dimensions: [0, 0, 0],
};

function handlePaint({ point, radius }) {
  const dims = globals.dimensions;
  const [x, y, z] = point;
  const [rx, ry, rz] = radius;

  const xstart = Math.floor(Math.min(dims[0] - 1, Math.max(0, x - rx)));
  const xend = Math.floor(Math.min(dims[0] - 1, Math.max(0, x + rx)));
  const ystart = Math.floor(Math.min(dims[1] - 1, Math.max(0, y - ry)));
  const yend = Math.floor(Math.min(dims[1] - 1, Math.max(0, y + ry)));
  const zstart = Math.floor(Math.min(dims[2] - 1, Math.max(0, z - rz)));
  const zend = Math.floor(Math.min(dims[2] - 1, Math.max(0, z + rz)));

  const jStride = dims[0];
  const kStride = dims[0] * dims[1];

  // naive algo
  for (let i = xstart; i <= xend; i++) {
    for (let j = ystart; j <= yend; j++) {
      for (let k = zstart; k <= zend; k++) {
        const ival = (i - x) / rx;
        const jval = (j - y) / ry;
        const kval = (k - z) / rz;
        if (ival * ival + jval * jval + kval * kval <= 1) {
          const index = i + j * jStride + k * kStride;
          globals.buffer[index] = 1;
        }
      }
    }
  }
}

registerWebworker()
  .operation('start', ({ bufferType, dimensions }) => {
    const bufferSize = dimensions[0] * dimensions[1] * dimensions[2];
    /* eslint-disable-next-line */
    globals.buffer = new self[bufferType](bufferSize);
    globals.dimensions = dimensions;
  })
  .operation('paint', handlePaint)
  .operation(
    'end',
    () =>
      new registerWebworker.TransferableResponse(globals.buffer.buffer, [
        globals.buffer.buffer,
      ])
  );
