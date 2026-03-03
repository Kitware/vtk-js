import { it, expect } from 'vitest';
import vtkIncrementalOctreeNode from 'vtk.js/Sources/Common/DataModel/IncrementalOctreeNode';

it('Test vtkIncrementalOctreeNode instance', () => {
  expect(vtkIncrementalOctreeNode).toBeTruthy();
  const instance = vtkIncrementalOctreeNode.newInstance();
  expect(instance).toBeTruthy();
});
