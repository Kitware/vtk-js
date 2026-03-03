import { it, expect } from 'vitest';
import vtkIncrementalOctreePointLocator from 'vtk.js/Sources/Common/DataModel/IncrementalOctreePointLocator';

it('Test vtkIncrementalOctreePointLocator instance', () => {
  expect(vtkIncrementalOctreePointLocator).toBeTruthy();
  const instance = vtkIncrementalOctreePointLocator.newInstance();
  expect(instance).toBeTruthy();
});
