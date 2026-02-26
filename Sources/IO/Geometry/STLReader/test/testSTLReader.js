import test from 'tape';
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

test('STLReader: parses ASCII STL', (t) => {
  const reader = vtkSTLReader.newInstance();
  reader.parseAsText(asciiStl);

  const output = reader.getOutputData();
  t.ok(output, 'reader produces an output dataset');
  t.equal(output.getNumberOfPoints(), 9, 'parsed points are present');
  t.equal(output.getNumberOfPolys(), 3, 'parsed triangles are present');
  t.end();
});

test('STLReader: keeps raw duplicated vertices when merge is disabled', (t) => {
  const reader = vtkSTLReader.newInstance();
  reader.setRemoveDuplicateVertices(-1);
  reader.parseAsText(asciiStl);

  const output = reader.getOutputData();
  t.equal(output.getNumberOfPoints(), 9, 'raw STL has 9 point entries');
  t.equal(output.getNumberOfPolys(), 3, 'raw STL has 3 triangles');
  t.equal(
    output.getCellData().getNormals().getNumberOfTuples(),
    3,
    'raw normals are defined per triangle'
  );
  t.end();
});

test('STLReader: merges with vtkMergePoints and removes degenerate triangles', (t) => {
  const reader = vtkSTLReader.newInstance();
  reader.setLocator(vtkMergePoints.newInstance());
  reader.setRemoveDuplicateVertices(6);
  reader.parseAsText(asciiStl);

  const output = reader.getOutputData();
  t.equal(output.getNumberOfPoints(), 4, 'merged output has 4 unique points');
  t.equal(
    output.getNumberOfPolys(),
    2,
    'degenerate triangle removed after merge'
  );
  t.equal(
    output.getCellData().getNormals().getNumberOfTuples(),
    2,
    'normals are remapped to kept triangles'
  );
  t.end();
});

test('STLReader: does not merge points when merging option is false', (t) => {
  const reader = vtkSTLReader.newInstance();
  reader.setLocator(vtkMergePoints.newInstance());
  reader.setMerging(false);
  reader.setRemoveDuplicateVertices(6);
  reader.parseAsText(asciiStl);

  const output = reader.getOutputData();
  t.equal(
    output.getNumberOfPoints(),
    9,
    'points are not merged when merging is disabled'
  );
  t.equal(
    output.getNumberOfPolys(),
    3,
    'triangles are kept when merging is disabled'
  );
  t.end();
});
