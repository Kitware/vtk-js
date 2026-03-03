import { it, expect } from 'vitest';
import vtkMergePoints from 'vtk.js/Sources/Common/DataModel/MergePoints';
import vtkSTLReader from 'vtk.js/Sources/IO/Geometry/STLReader';

const asciiStl = `solid stlreader_test
facet normal 0 0 1
  outer loop
    vertex 0 0 0
    vertex 1 0 0
    vertex 0 1 0
  endloop
endfacet
facet normal 0 0 1
  outer loop
    vertex 1 0 0
    vertex 1 1 0
    vertex 0 1 0
  endloop
endfacet
facet normal 0 0 1
  outer loop
    vertex 0 0 0
    vertex 0 0 0
    vertex 0 1 0
  endloop
endfacet
endsolid stlreader_test`;

it('STLReader: parses ASCII STL', () => {
  const reader = vtkSTLReader.newInstance();
  reader.parseAsText(asciiStl);

  const output = reader.getOutputData();
  expect(output).toBeTruthy();
  expect(output.getNumberOfPoints()).toBe(9);
  expect(output.getNumberOfPolys()).toBe(3);
});

it('STLReader: keeps raw duplicated vertices when merge is disabled', () => {
  const reader = vtkSTLReader.newInstance();
  reader.setRemoveDuplicateVertices(-1);
  reader.parseAsText(asciiStl);

  const output = reader.getOutputData();
  expect(output.getNumberOfPoints()).toBe(9);
  expect(output.getNumberOfPolys()).toBe(3);
  expect(output.getCellData().getNormals().getNumberOfTuples()).toBe(3);
});

it('STLReader: merges with vtkMergePoints and removes degenerate triangles', () => {
  const reader = vtkSTLReader.newInstance();
  reader.setLocator(vtkMergePoints.newInstance());
  reader.setRemoveDuplicateVertices(6);
  reader.parseAsText(asciiStl);

  const output = reader.getOutputData();
  expect(output.getNumberOfPoints()).toBe(4);
  expect(output.getNumberOfPolys()).toBe(2);
  expect(output.getCellData().getNormals().getNumberOfTuples()).toBe(2);
});

it('STLReader: does not merge points when merging option is false', () => {
  const reader = vtkSTLReader.newInstance();
  reader.setLocator(vtkMergePoints.newInstance());
  reader.setMerging(false);
  reader.setRemoveDuplicateVertices(6);
  reader.parseAsText(asciiStl);

  const output = reader.getOutputData();
  expect(output.getNumberOfPoints()).toBe(9);
  expect(output.getNumberOfPolys()).toBe(3);
});
