import test from 'tape-catch';
import vtkIncrementalOctreePointLocator from 'vtk.js/Sources/Common/DataModel/IncrementalOctreePointLocator';

test('Test vtkIncrementalOctreePointLocator instance', (t) => {
  t.ok(
    vtkIncrementalOctreePointLocator,
    'Make sure the class definition exists'
  );
  const instance = vtkIncrementalOctreePointLocator.newInstance();
  t.ok(instance);
  t.end();
});
