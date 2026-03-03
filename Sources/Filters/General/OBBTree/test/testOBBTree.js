import { it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

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

it('Test OBB tree transform', () => {
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
    expect(hasMatchingPoint(actual, expectedCorners, epsilon)).toBeTruthy();
  });
  expect(vtkMath.areEquals(size, expectedSize, epsilon)).toBeTruthy();

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
    expect(
      hasMatchingPoint(actual, expectedTranslatedCorners, epsilon)
    ).toBeTruthy();
  });
});

it('Test OBB tree deep copy', () => {
  const gc = testUtils.createGarbageCollector();
  const source = gc.registerResource(vtkCubeSource.newInstance());
  source.update();
  const mesh = gc.registerResource(source.getOutputData());

  const obbTreeSource = gc.registerResource(vtkOBBTree.newInstance());
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

  const obbTreeTarget = gc.registerResource(vtkOBBTree.newInstance());
  obbTreeTarget.deepCopy(obbTreeSource);
  const copiedTree = obbTreeTarget.getTree();

  expect(copiedTree.getCorner()).toEqual(sourceNode.getCorner());
  expect(copiedTree.getAxes()).toEqual(sourceNode.getAxes());
  expect(copiedTree.getKids()).toEqual(sourceNode.getKids());
  expect(copiedTree.getParent()).toEqual(sourceNode.getParent());
  expect(obbTreeTarget.getLevel()).toEqual(obbTreeSource.getLevel());
  expect(obbTreeTarget.getDataset()).toEqual(obbTreeSource.getDataset());
  expect(obbTreeTarget.getAutomatic()).toEqual(obbTreeSource.getAutomatic());
  expect(obbTreeTarget.getNumberOfCellsPerNode()).toEqual(
    obbTreeSource.getNumberOfCellsPerNode()
  );

  gc.releaseResources();
});

it('Test OBB tree collision', () => {
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
  expect(intersect).toBe(40);
  expect(intersection.intersectionLines.getLines().getNumberOfCells()).toBe(40);
});
