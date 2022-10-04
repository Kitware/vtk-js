import test from 'tape-catch';
import vtkIncrementalOctreeNode from 'vtk.js/Sources/Common/DataModel/IncrementalOctreeNode';

test('Test vtkIncrementalOctreeNode instance', (t) => {
  t.ok(vtkIncrementalOctreeNode, 'Make sure the class definition exists');
  const instance = vtkIncrementalOctreeNode.newInstance();
  t.ok(instance);
  t.end();
});
