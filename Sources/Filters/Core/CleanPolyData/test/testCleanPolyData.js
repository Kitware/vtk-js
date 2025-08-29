import test from 'tape';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkCleanPolyData from 'vtk.js/Sources/Filters/Core/CleanPolyData';

function constructLines() {
  const pts = vtkPoints.newInstance();
  pts.insertNextTuple([0, 0, 0]);
  pts.insertNextTuple([1, 0, 0]);
  pts.insertNextTuple([1, 1, 0]);
  pts.insertNextTuple([0, 0, 0]); // repeated

  const lines = vtkCellArray.newInstance();
  lines.insertNextCell([0, 1]); // valid line
  lines.insertNextCell([0, 0]); // degenerate → vertex
  lines.insertNextCell([0, 3]); // repeated pts → vertex if merging
  lines.insertNextCell([0, 1, 2]); // polyline
  lines.insertNextCell([0, 1, 1]); // degenerate → line
  lines.insertNextCell([0, 3, 0]); // cycling → vertex if merging

  const pd = vtkPolyData.newInstance();
  pd.setPoints(pts);
  pd.setLines(lines);

  return pd;
}

function constructPolys() {
  const pts = vtkPoints.newInstance();
  pts.insertNextTuple([0, 0, 0]);
  pts.insertNextTuple([1, 0, 0]);
  pts.insertNextTuple([1, 1, 0]);
  pts.insertNextTuple([1, 1, 1]); // unused
  pts.insertNextTuple([0, 0, 0]); // repeated
  pts.insertNextTuple([1, 0, 0]); // repeated

  const polys = vtkCellArray.newInstance();
  polys.insertNextCell([0, 1, 2]); // normal tri
  polys.insertNextCell([0, 0, 0]); // degenerate → vertex
  polys.insertNextCell([0, 1, 1]); // degenerate → line
  polys.insertNextCell([0, 1, 5]); // repeated id → line if merging
  polys.insertNextCell([0, 4, 0]); // vertex if merging
  polys.insertNextCell([1, 1, 1, 1]); // quad→vertex
  polys.insertNextCell([0, 1, 1, 0]); // quad→line

  const pd = vtkPolyData.newInstance();
  pd.setPoints(pts);
  pd.setPolys(polys);
  return pd;
}

function constructStrips() {
  const pts = vtkPoints.newInstance();
  pts.insertNextTuple([0, 0, 0]);
  pts.insertNextTuple([1, 0, 0]);
  pts.insertNextTuple([1, 1, 0]);
  pts.insertNextTuple([0, 1, 0]);
  pts.insertNextTuple([1, 1, 1]); // unused
  pts.insertNextTuple([0, 0, 0]); // repeated
  pts.insertNextTuple([1, 0, 0]); // repeated
  pts.insertNextTuple([1, 1, 0]); // repeated

  const strips = vtkCellArray.newInstance();
  strips.insertNextCell([0, 1, 2, 3]); // normal strip
  strips.insertNextCell([0, 1, 2, 2]); // tri if no merging
  strips.insertNextCell([0, 1, 2, 7]); // repeated→tri if merging
  strips.insertNextCell([0, 1, 1, 1]); // line
  strips.insertNextCell([0, 0, 6, 5]); // line or tri
  strips.insertNextCell([2, 2, 2, 2]); // vertex
  strips.insertNextCell([0, 0, 0, 5]); // vertex or line

  const pd = vtkPolyData.newInstance();
  pd.setPoints(pts);
  pd.setStrips(strips);
  return pd;
}

function runTest(clean, inputPD, expected, t) {
  clean.setInputData(inputPD);
  // clean.update();
  const out = clean.getOutputData();

  t.equal(
    out.getNumberOfPoints(),
    expected.points,
    `expected ${expected.points} points but got ${out.getNumberOfPoints()}`
  );
  t.equal(
    out.getNumberOfVerts(),
    expected.verts,
    `expected ${expected.verts} verts but got ${out.getNumberOfVerts()}`
  );
  t.equal(
    out.getNumberOfLines(),
    expected.lines,
    `expected ${expected.lines} lines but got ${out.getNumberOfLines()}`
  );
  t.equal(
    out.getNumberOfPolys(),
    expected.polys,
    `expected ${expected.polys} polys but got ${out.getNumberOfPolys()}`
  );
  t.equal(
    out.getNumberOfStrips(),
    expected.strips,
    `expected ${expected.strips} strips but got ${out.getNumberOfStrips()}`
  );
}

test('vtkCleanPolyData: degenerate conversions without merging', (t) => {
  const clean = vtkCleanPolyData.newInstance({
    pointMerging: false,
    convertLinesToPoints: true,
    convertPolysToLines: true,
    convertStripsToPolys: true,
  });

  runTest(
    clean,
    constructLines(),
    { points: 4, verts: 1, lines: 5, polys: 0, strips: 0 },
    t
  );
  runTest(
    clean,
    constructPolys(),
    { points: 5, verts: 2, lines: 3, polys: 2, strips: 0 },
    t
  );
  runTest(
    clean,
    constructStrips(),
    { points: 7, verts: 1, lines: 2, polys: 2, strips: 2 },
    t
  );

  t.end();
});

test('vtkCleanPolyData: degenerate elimination without merging', (t) => {
  const clean = vtkCleanPolyData.newInstance({
    pointMerging: false,
    convertLinesToPoints: false,
    convertPolysToLines: false,
    convertStripsToPolys: false,
  });

  runTest(
    clean,
    constructLines(),
    { points: 4, verts: 0, lines: 5, polys: 0, strips: 0 },
    t
  );
  runTest(
    clean,
    constructPolys(),
    { points: 5, verts: 0, lines: 0, polys: 2, strips: 0 },
    t
  );
  runTest(
    clean,
    constructStrips(),
    { points: 7, verts: 0, lines: 0, polys: 0, strips: 2 },
    t
  );

  t.end();
});

test('vtkCleanPolyData: degenerate conversions with merging', (t) => {
  const clean = vtkCleanPolyData.newInstance({
    pointMerging: true,
    convertLinesToPoints: true,
    convertPolysToLines: true,
    convertStripsToPolys: true,
  });

  runTest(
    clean,
    constructLines(),
    { points: 3, verts: 3, lines: 3, polys: 0, strips: 0 },
    t
  );
  runTest(
    clean,
    constructPolys(),
    { points: 3, verts: 3, lines: 3, polys: 1, strips: 0 },
    t
  );
  runTest(
    clean,
    constructStrips(),
    { points: 4, verts: 2, lines: 2, polys: 2, strips: 1 },
    t
  );

  t.end();
});

test('vtkCleanPolyData: degenerate elimination with merging', (t) => {
  const clean = vtkCleanPolyData.newInstance({
    pointMerging: true,
    convertLinesToPoints: false,
    convertPolysToLines: false,
    convertStripsToPolys: false,
  });

  runTest(
    clean,
    constructLines(),
    { points: 3, verts: 0, lines: 3, polys: 0, strips: 0 },
    t
  );
  runTest(
    clean,
    constructPolys(),
    { points: 3, verts: 0, lines: 0, polys: 1, strips: 0 },
    t
  );
  runTest(
    clean,
    constructStrips(),
    { points: 4, verts: 0, lines: 0, polys: 0, strips: 1 },
    t
  );

  t.end();
});
