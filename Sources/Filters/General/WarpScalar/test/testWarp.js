import test from 'tape';
import vtkWarpScalar from '..';

test('Instantiate WarpScalar', (t) => {
  t.exist(vtkWarpScalar, 'Make sure the class definition exist');
  const instance = vtkWarpScalar.newInstance();
  t.exist(instance, 'Make sure the instance exist');
  t.end();
});
