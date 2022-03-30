import test from 'tape-catch';

import vtkArrowSource from 'vtk.js/Sources/Filters/Sources/ArrowSource';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkOBBTree from 'vtk.js/Sources/Filters/General/OBBTree';
import vtkMatrixBuilder from 'vtk.js/Sources/Common/Core/MatrixBuilder';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkTriangleFilter from 'vtk.js/Sources/Filters/General/TriangleFilter';

const epsilon = 0.0001;

test('Test OBB tree constructor', (t) => {
  const source = vtkArrowSource.newInstance();
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
  const computedValues = [corner, max, mid, min, size];
  const expectedValues = [
    { name: 'corner', value: [-0.325, -0.1, -0.0866] },
    { name: 'max', value: [1, 0, 0] },
    { name: 'mid', value: [0, 0, 0.1732] },
    { name: 'min', value: [0, 0.2, 0] },
    { name: 'size', value: [0.0658262, 0.00126738, 0.00126738] },
  ];

  obbTree.computeOBBFromDataset(mesh, corner, max, mid, min, size);

  computedValues.forEach((value, index) => {
    const expected = expectedValues[index];
    t.ok(vtkMath.areEquals(value, expected.value, epsilon), expected.name);
  });

  t.end();
});

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
  const computedValues = [corner, max, mid, min, size];
  obbTree.computeOBBFromDataset(mesh, corner, max, mid, min, size);

  const expectedValues = [
    { name: 'corner', value: [-0.5, -0.5, -0.5] },
    { name: 'max', value: [0, 0, 1] },
    { name: 'mid', value: [1, 0, 0] },
    { name: 'min', value: [0, 1, 0] },
    { name: 'size', value: [0.13888, 0.13888, 0.13888] },
  ];
  computedValues.forEach((value, index) => {
    const expected = expectedValues[index];
    t.ok(vtkMath.areEquals(value, expected.value, epsilon), expected.name);
  });

  const translation = [10, 0, 0];
  const transform = vtkMatrixBuilder
    .buildFromRadian()
    .translate(...translation);
  obbTree.transform(transform);
  const tree = obbTree.getTree();
  const translatedComputedValues = [
    tree.getCorner(),
    tree.getAxes()[0],
    tree.getAxes()[1],
    tree.getAxes()[2],
  ];
  expectedValues.pop();
  vtkMath.add(expectedValues[0].value, translation, expectedValues[0].value);

  translatedComputedValues.forEach((value, index) => {
    const expected = expectedValues[index];
    t.ok(vtkMath.areEquals(value, expected.value, epsilon), expected.name);
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
