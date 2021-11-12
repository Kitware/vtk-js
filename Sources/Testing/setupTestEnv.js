import test from 'tape-catch';

/**
 * Buffers written objects until a reader attaches,
 * after which all writes go to the reader.
 *
 * Only supports a single reader.
 *
 */
function BufferedObjectPipe() {
  const buffer = [];
  let closed = false;
  let reader = null;
  let flushTimeout = null;

  const scheduleFlush = () => {
    if (reader && flushTimeout === null) {
      flushTimeout = setTimeout(() => {
        flushTimeout = null;
        while (buffer.length) {
          reader.onData(buffer.shift());
        }
        if (closed) {
          reader.onClose();
        }
      }, 0);
    }
  };

  const write = (data) => {
    if (!closed) {
      buffer.push(data);
      scheduleFlush();
    }
  };

  const end = () => {
    closed = true;
    scheduleFlush();
  };

  const setReader = (r) => {
    reader = r;
  };

  return {
    write,
    end,
    setReader,
  };
}

// pipe tape objects to karma adapter in tap-object-stream
const pipe = BufferedObjectPipe();
test.createStream({ objectMode: true }).on('data', (row) => {
  pipe.write(row);
});
test.onFinish(() => pipe.end());

window.__TapeEnv__ = {
  pipe,
};
