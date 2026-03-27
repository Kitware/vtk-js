import { it, expect } from 'vitest';
import { substitute } from '../index';

it('substitute', () => {
  expect(
    substitute('this is source source', 'source', 'target'),
    'works with string as search argument'
  ).toEqual({
    replace: true,
    result: 'this is target target',
  });

  expect(
    substitute('this is source source', /source/, 'target'),
    'works with regexp as search argument'
  ).toEqual({
    replace: true,
    result: 'this is target target',
  });

  expect(
    substitute('this is source source', 'source', ['target', 'target2']),
    'works with array as replace argument'
  ).toEqual({
    replace: true,
    result: 'this is target\ntarget2 target\ntarget2',
  });

  expect(
    substitute('this is source source', 'source', 'target', false),
    'works with string as search argument and global replacement set to false'
  ).toEqual({ replace: true, result: 'this is target source' });

  expect(
    substitute('this is source source', /source/, 'target', false),
    'works with regexp as search argument and global replacement set to false'
  ).toEqual({ replace: true, result: 'this is target source' });

  expect(
    substitute('this is source source', 'source', ['target', 'target2'], false),
    'works with array as replace argument and global replacement set to false'
  ).toEqual({ replace: true, result: 'this is target\ntarget2 source' });
});
