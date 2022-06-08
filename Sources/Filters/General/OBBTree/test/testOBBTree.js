import test from 'tape-catch';

import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkOBBTree from 'vtk.js/Sources/Filters/General/OBBTree';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkTriangleFilter from 'vtk.js/Sources/Filters/General/TriangleFilter';

const epsilon = 0.0001;

function getAllCorners(startCorner, min, mid, max) {
  const start2min = vtkMath.add(startCorner, min, []);
  const start2mid = vtkMath.add(startCorner, mid, []);
  const start2max = vtkMath.add(startCorner, max, []);
  const start2min2mid = vtkMath.add(start2min, mid, []);
  const start2mid2max = vtkMath.add(start2mid, max, []);
  const start2max2min = vtkMath.add(start2max, min, []);
  const oppositeCorner = vtkMath.add(start2min2mid, max, []);
  return [
    [...startCorner],
    start2min,
    start2mid,
    start2max,
    start2min2mid,
    start2mid2max,
    start2max2min,
    oppositeCorner,
  ];
}

// does point exist in points, with tolerance
function hasMatchingPoint(point, points, eps) {
  return !!points.find((pt) => vtkMath.areEquals(point, pt, eps));
}

test('Test OBB tree transform', (t) => {
  const source = vtkCubeSource.newInstance();
  source.update();
  const mesh = source.getOutputData();

  const obbTree = vtkOBBTree.newInstance();
  obbTree.setDataset(mesh);
  obbTree.setMaxLevel(2);
  obbTree.buildLocator();

  const corner = [0, 0, 0];
  const max = [0, 0, 0];
  const mid = [0, 0, 0];
  const min = [0, 0, 0];
  const size = [0, 0, 0];

  const expectedSize = [0.13888, 0.13888, 0.13888];
  const expectedCorners = [
    [-0.5, -0.5, -0.5],
    [-0.5, -0.5, 0.5],
    [-0.5, 0.5, -0.5],
    [-0.5, 0.5, 0.5],
    [0.5, -0.5, -0.5],
    [0.5, -0.5, 0.5],
    [0.5, 0.5, -0.5],
    [0.5, 0.5, 0.5],
  ];

  obbTree.computeOBBFromDataset(mesh, corner, max, mid, min, size);
  const allCorners = getAllCorners(corner, min, mid, max);

  allCorners.forEach((actual, index) => {
    t.ok(hasMatchingPoint(actual, expectedCorners, epsilon), `Corner ${index}`);
  });
  t.ok(vtkMath.areEquals(size, expectedSize, epsilon), 'size');

  const translation = [10, 0, 0];
  const transform = vtkMatrixBuilder
    .buildFromRadian()
    .translate(...translation);
  obbTree.transform(transform);
  const tree = obbTree.getTree();

  const translatedCorners = getAllCorners(tree.getCorner(), ...tree.getAxes());
  const expectedTranslatedCorners = expectedCorners.map((point) =>
    vtkMath.add(point, translation, [])
  );

  translatedCorners.forEach((actual, index) => {
    t.ok(
      hasMatchingPoint(actual, expectedTranslatedCorners, epsilon),
      `Corner ${index}`
    );
  });
  t.end();
});

test('Test OBB tree deep copy', (t) => {
  const source = vtkCubeSource.newInstance();
  source.update();
  const mesh = source.getOutputData();

  const obbTreeSource = vtkOBBTree.newInstance();
  obbTreeSource.setDataset(mesh);
  obbTreeSource.setMaxLevel(2);
  obbTreeSource.setAutomatic(false);
  obbTreeSource.buildLocator();

  const corner = [0, 0, 0];
  const max = [0, 0, 0];
  const mid = [0, 0, 0];
  const min = [0, 0, 0];
  const size = [0, 0, 0];
  obbTreeSource.computeOBBFromDataset(mesh, corner, max, mid, min, size);
  const sourceNode = obbTreeSource.getTree();

  const obbTreeTarget = vtkOBBTree.newInstance();
  obbTreeTarget.deepCopy(obbTreeSource);
  const copiedTree = obbTreeTarget.getTree();

  t.deepEqual(copiedTree.getCorner(), sourceNode.getCorner(), 'Corner');
  t.deepEqual(copiedTree.getAxes(), sourceNode.getAxes(), 'Axes');
  t.deepEqual(copiedTree.getKids(), sourceNode.getKids(), 'Kids');
  t.deepEqual(copiedTree.getParent(), sourceNode.getParent(), 'Parent');
  t.deepEqual(obbTreeTarget.getLevel(), obbTreeSource.getLevel(), 'Level');
  t.deepEqual(
    obbTreeTarget.getDataset(),
    obbTreeSource.getDataset(),
    'Dataset'
  );
  t.deepEqual(
    obbTreeTarget.getAutomatic(),
    obbTreeSource.getAutomatic(),
    'Automatic'
  );
  t.deepEqual(
    obbTreeTarget.getNumberOfCellsPerNode(),
    obbTreeSource.getNumberOfCellsPerNode(),
    'Cells per node'
  );

  t.end();
});

test('Test OBB tree collision', (t) => {
  const source1 = vtkCubeSource.newInstance();
  source1.setCenter(0.8, 0, 0);
  const triangleFilter1 = vtkTriangleFilter.newInstance();
  triangleFilter1.setInputConnection(source1.getOutputPort());
  triangleFilter1.update();

  const obbTree1 = vtkOBBTree.newInstance();
  obbTree1.setDataset(triangleFilter1.getOutputData());
  obbTree1.buildLocator();

  const source2 = vtkCubeSource.newInstance();
  source2.setCenter(1.0, 0, 0);
  source2.update();
  const triangleFilter2 = vtkTriangleFilter.newInstance();
  triangleFilter2.setInputConnection(source2.getOutputPort());
  triangleFilter2.update();

  const obbTree2 = vtkOBBTree.newInstance();
  obbTree2.setDataset(triangleFilter2.getOutputData());
  obbTree2.buildLocator();

  const intersection = {
    obbTree1: obbTree2,
    intersectionLines: vtkPolyData.newInstance(),
  };
  const intersect = obbTree1.intersectWithOBBTree(
    obbTree2,
    null,
    obbTree1.findTriangleIntersections.bind(null, intersection)
  );
  t.equal(intersect, 40);
  t.equal(intersection.intersectionLines.getLines().getNumberOfCells(), 40);
  t.end();
});
