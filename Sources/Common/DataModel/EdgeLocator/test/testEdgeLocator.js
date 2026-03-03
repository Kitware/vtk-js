import { it, expect } from 'vitest';
import vtkEdgeLocator from 'vtk.js/Sources/Common/DataModel/EdgeLocator';

it('Test unique edge', () => {
  const edgeLocator = vtkEdgeLocator.newInstance();
  const edge = edgeLocator.insertUniqueEdge(10, 13);
  expect(edge != null).toBeTruthy();
  expect(edge.edgeId).toBe(0);

  const sameEdge = edgeLocator.insertUniqueEdge(10, 13);
  expect(sameEdge === edge).toBeTruthy();
  const oppositeEdge = edgeLocator.insertUniqueEdge(13, 10);
  expect(oppositeEdge === edge).toBeTruthy();
  expect(oppositeEdge.edgeId).toBe(0);

  const otherEdge = edgeLocator.insertUniqueEdge(11, 13);
  expect(otherEdge != null).toBeTruthy();
  expect(otherEdge !== edge).toBeTruthy();
  expect(otherEdge.edgeId).toBe(1);

  const edgeWithValue = edgeLocator.insertUniqueEdge(12, 13, 42);
  expect(edgeWithValue.value).toBe(42);

  edgeWithValue.value = 54;
  const sameEdgeWithValue = edgeLocator.insertUniqueEdge(12, 13);
  expect(sameEdgeWithValue.value).toBe(54);
});

it('Test oriented edge', () => {
  const edgeLocator = vtkEdgeLocator.newInstance({ oriented: true });
  const edge = edgeLocator.insertUniqueEdge(10, 13);
  expect(edge != null).toBeTruthy();
  expect(edge.edgeId).toBe(0);
  const sameEdge = edgeLocator.insertUniqueEdge(10, 13);
  expect(sameEdge === edge).toBeTruthy();
  const oppositeEdge = edgeLocator.insertUniqueEdge(13, 10);
  expect(oppositeEdge !== edge).toBeTruthy();
  expect(oppositeEdge.edgeId).toBe(1);
});
