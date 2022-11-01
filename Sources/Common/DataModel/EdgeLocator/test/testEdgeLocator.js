import test from 'tape-catch';

import vtkEdgeLocator from 'vtk.js/Sources/Common/DataModel/EdgeLocator';

test('Test unique edge', (t) => {
  const edgeLocator = vtkEdgeLocator.newInstance();
  const edge = edgeLocator.insertUniqueEdge(10, 13);
  t.ok(edge != null, 'First edge');
  t.equal(edge.edgeId, 0, 'Edge id');

  const sameEdge = edgeLocator.insertUniqueEdge(10, 13);
  t.ok(sameEdge === edge, 'Same edge');
  const oppositeEdge = edgeLocator.insertUniqueEdge(13, 10);
  t.ok(oppositeEdge === edge, 'Opposite edge');
  t.equal(oppositeEdge.edgeId, 0, 'Opposite edge id');

  const otherEdge = edgeLocator.insertUniqueEdge(11, 13);
  t.ok(otherEdge != null);
  t.ok(otherEdge !== edge);
  t.equal(otherEdge.edgeId, 1);

  const edgeWithValue = edgeLocator.insertUniqueEdge(12, 13, 42);
  t.equal(edgeWithValue.value, 42, 'edge with value 42');

  edgeWithValue.value = 54;
  const sameEdgeWithValue = edgeLocator.insertUniqueEdge(12, 13);
  t.equal(sameEdgeWithValue.value, 54, 'same edge with value 54');

  t.end();
});

test('Test oriented edge', (t) => {
  const edgeLocator = vtkEdgeLocator.newInstance({ oriented: true });
  const edge = edgeLocator.insertUniqueEdge(10, 13);
  t.ok(edge != null, 'First oriented edge');
  t.equal(edge.edgeId, 0, 'Oriented edge Id');
  const sameEdge = edgeLocator.insertUniqueEdge(10, 13);
  t.ok(sameEdge === edge, 'Same oriented edge');
  const oppositeEdge = edgeLocator.insertUniqueEdge(13, 10);
  t.ok(oppositeEdge !== edge, 'Opposite edge');
  t.equal(oppositeEdge.edgeId, 1, 'Opposite edge id');

  t.end();
});
