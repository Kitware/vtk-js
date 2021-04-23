import test from 'tape-catch';

test.onlyIfWebGL('onlyIfWebGL', (t) => {
  t.ok(1, 'onlyIfWebGL enabled');
  t.end();
});

test.onlyIfWebGPU('onlyIfWebGPU', (t) => {
  t.ok(1, 'onlyIfWebGPU enabled');
  t.end();
});
