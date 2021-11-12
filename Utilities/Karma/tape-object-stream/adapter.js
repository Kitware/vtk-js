function createStartFn(tc) {
  return function() {
    var currentTest = {};
    var results = [];

    function readTapeObject(obj) {
      if (obj.type === 'test') {
        currentTest = obj;
        console.info(`Test Suite: ${obj.name}`);
      } else if (obj.type === 'assert') {
        const status = obj.skip ? 'SKIP' : obj.ok ? 'PASS' : 'FAIL';
        console.info(`\t[${status}] ${obj.name}`);

        results.push({
          id: `${currentTest.id || ''}.${obj.id}`,
          description: obj.name,
          suite: [currentTest.name || '(untitled suite)'],
          log: [],
          success: obj.ok,
          // cast to bool just to be explicit.
          // skip is not always on obj.
          skipped: !!obj.skip,
          details: obj,
        });
      }
    }

    function complete() {
      tc.info({ total: results.length });
      while (results.length) {
        tc.result(results.shift());
      }
      tc.complete({
        coverage: window.__coverage__,
      });
    }

    var tapeEnv = window.__TapeEnv__;
    tapeEnv.pipe.setReader({
      onData: readTapeObject,
      onClose: complete,
    });
  };
}

window.__karma__.start = createStartFn(window.__karma__);
