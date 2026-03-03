import { it, expect } from 'vitest';
import { substitute } from '../index';

it('substitute', () => {
  expect(substitute('this is source source', 'source', 'target')).toEqual({
    replace: true,
    result: 'this is target target',
  });

  expect(substitute('this is source source', /source/, 'target')).toEqual({
    replace: true,
    result: 'this is target target',
  });

  expect(
    substitute('this is source source', 'source', ['target', 'target2'])
  ).toEqual({
    replace: true,
    result: 'this is target\ntarget2 target\ntarget2',
  });

  expect(
    substitute('this is source source', 'source', 'target', false)
  ).toEqual({ replace: true, result: 'this is target source' });

  expect(
    substitute('this is source source', /source/, 'target', false)
  ).toEqual({ replace: true, result: 'this is target source' });

  expect(
    substitute('this is source source', 'source', ['target', 'target2'], false)
  ).toEqual({ replace: true, result: 'this is target\ntarget2 source' });
});
