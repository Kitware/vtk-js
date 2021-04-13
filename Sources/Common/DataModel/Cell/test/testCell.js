import test from 'tape-catch';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkCell from 'vtk.js/Sources/Common/DataModel/Cell';

test('Test vtkCell instance', (t) => {
  t.ok(vtkCell, 'Make sure the class definition exists');
  const instance = vtkCell.newInstance();
  t.ok(instance);
  t.end();
});

test('Test vtkCell initialize without pointsIds', (t) => {
  const points = vtkPoints.newInstance();
  points.setData([0, 0, 0, 2, 0, 0, 2, 2, 0]);

  const cell = vtkCell.newInstance();
  cell.initialize(points);

  t.equal(cell.getPointsIds()[0], 0);
  t.equal(cell.getPointsIds()[1], 1);
  t.equal(cell.getPointsIds()[2], 2);
  t.equal(cell.getPoints().getNumberOfPoints(), 3);
  t.equal(cell.getPoints(), points);

  t.end();
});

test('Test vtkCell initialize with pointsIds', (t) => {
  const points = vtkPoints.newInstance();
  points.setData(Float64Array.from([0, 0, 0, 2, 0, 0, 2, 2, 0]));

  const cell = vtkCell.newInstance();

  cell.initialize(points, [0, 1, 2]);
  t.equal(cell.getPointsIds().length, 3);
  t.equal(cell.getPointsIds()[0], 0);
  t.equal(cell.getPointsIds()[1], 1);
  t.equal(cell.getPointsIds()[2], 2);
  t.notEqual(cell.getPoints(), points);
  t.equal(cell.getPoints().getNumberOfPoints(), 3);
  t.deepEqual(cell.getPoints().getPoint(0), points.getPoint(0));
  t.deepEqual(cell.getPoints().getPoint(1), points.getPoint(1));
  t.deepEqual(cell.getPoints().getPoint(2), points.getPoint(2));

  t.end();
});

test('Test vtkCell deepCopy', (t) => {
  const points = vtkPoints.newInstance();
  points.setData([0, 0, 0, 2, 0, 0, 2, 2, 0]);

  const cell = vtkCell.newInstance();
  cell.initialize(points);

  const cell2 = vtkCell.newInstance();
  cell2.deepCopy(cell);
  t.notEqual(cell2.getPoints(), points);
  t.deepEqual(cell2.getPoints().getData(), points.getData());

  t.end();
});
