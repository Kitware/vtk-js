import test from 'tape-catch';

import { substitute } from '../index';

test('substitute', (t) => {
  t.deepEqual(
    substitute('this is source source', 'source', 'target'),
    { replace: true, result: 'this is target target' },
    'works with string as search argument'
  );

  t.deepEqual(
    substitute('this is source source', /source/, 'target'),
    { replace: true, result: 'this is target target' },
    'works with regexp as search argument'
  );

  t.deepEqual(
    substitute('this is source source', 'source', ['target', 'target2']),
    { replace: true, result: 'this is target\ntarget2 target\ntarget2' },
    'works with array as replace argument'
  );

  t.deepEqual(
    substitute('this is source source', 'source', 'target', false),
    { replace: true, result: 'this is target source' },
    'works with string as search argument and global replacement set to false'
  );

  t.deepEqual(
    substitute('this is source source', /source/, 'target', false),
    { replace: true, result: 'this is target source' },
    'works with regexp as search argument and global replacement set to false'
  );

  t.deepEqual(
    substitute('this is source source', 'source', ['target', 'target2'], false),
    { replace: true, result: 'this is target\ntarget2 source' },
    'works with array as replace argument and global replacement set to false'
  );

  t.end();
});
