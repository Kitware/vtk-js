import registerWebworker from 'webworker-promise/lib/register';

const globals = {
  // single-component labelmap
  buffer: null,
  dimensions: [0, 0, 0],
  prevPoint: null,
};

function handlePaint({ point, radius }) {
  const dims = globals.dimensions;
  const [x, y, z] = point;
  const [rx, ry, rz] = radius;

  if (!globals.prevPoint) {
    globals.prevPoint = point;
  }

  const xstart = Math.floor(Math.min(dims[0] - 1, Math.max(0, x - rx)));
  const xend = Math.floor(Math.min(dims[0] - 1, Math.max(0, x + rx)));
  const ystart = Math.floor(Math.min(dims[1] - 1, Math.max(0, y - ry)));
  const yend = Math.floor(Math.min(dims[1] - 1, Math.max(0, y + ry)));
  const zstart = Math.floor(Math.min(dims[2] - 1, Math.max(0, z - rz)));
  const zend = Math.floor(Math.min(dims[2] - 1, Math.max(0, z + rz)));

  const jStride = dims[0];
  const kStride = dims[0] * dims[1];

  // DDA params
  const delta = [
    point[0] - globals.prevPoint[0],
    point[1] - globals.prevPoint[1],
    point[2] - globals.prevPoint[2],
  ];
  const inc = [1, 1, 1];
  for (let i = 0; i < 3; i++) {
    if (delta[i] < 0) {
      delta[i] = -delta[i];
      inc[i] = -1;
    }
    delta[i]++;
  }
  const step = Math.max(...delta);

  // naive algo
  for (let i = xstart; i <= xend; i++) {
    for (let j = ystart; j <= yend; j++) {
      for (let k = zstart; k <= zend; k++) {
        const rel = [i - x, j - y, k - z];
        const ival = rel[0] / rx;
        const jval = rel[1] / ry;
        const kval = rel[2] / rz;
        if (ival * ival + jval * jval + kval * kval <= 1) {
          const pt = [
            rel[0] + globals.prevPoint[0],
            rel[1] + globals.prevPoint[1],
            rel[2] + globals.prevPoint[2],
          ];

          // DDA
          const thresh = [step, step, step];
          for (let s = 0; s <= step; s++) {
            if (
              pt[0] >= 0 &&
              pt[0] < dims[0] &&
              pt[1] >= 0 &&
              pt[1] < dims[1] &&
              pt[2] >= 0 &&
              pt[2] < dims[2]
            ) {
              const index = pt[0] + pt[1] * jStride + pt[2] * kStride;
              globals.buffer[index] = 1;
            }

            for (let ii = 0; ii < 3; ii++) {
              thresh[ii] -= delta[ii];
              if (thresh[ii] < 0) {
                thresh[ii] = step;
                pt[ii] += inc[ii];
              }
            }
          }
        }
      }
    }
  }

  globals.prevPoint = point;
}

registerWebworker()
  .operation('start', ({ bufferType, dimensions }) => {
    const bufferSize = dimensions[0] * dimensions[1] * dimensions[2];
    /* eslint-disable-next-line */
    globals.buffer = new self[bufferType](bufferSize);
    globals.dimensions = dimensions;
    globals.prevPoint = null;
  })
  .operation('paint', handlePaint)
  .operation(
    'end',
    () =>
      new registerWebworker.TransferableResponse(globals.buffer.buffer, [
        globals.buffer.buffer,
      ])
  );
