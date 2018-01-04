import test from 'tape-catch';

import vtkWarpScalar from 'vtk.js/Sources/Filters/General/WarpScalar';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';

test('Test vtkWarpScalar instance', (t) => {
  t.ok(vtkWarpScalar, 'Make sure the class definition exist');
  const instance = vtkWarpScalar.newInstance();
  t.ok(instance, 'Make sure the instance exist');

  t.equal(instance.getScaleFactor(), 1, 'Default ScaleFactor should be 1');
  t.equal(instance.getUseNormal(), false, 'Default UseNormal should be false');
  t.equal(instance.getXyPlane(), false, 'Default xyPlane should be false');
  t.deepEqual(
    instance.getNormal(),
    [0, 0, 1],
    'Default normal should be [0, 0, 1]'
  );

  instance.setScaleFactor(2.5);
  t.equal(
    instance.getScaleFactor(),
    2.5,
    'Updated value of ScaleFactor should be 2.5'
  );

  t.end();
});

test('Test vtkWarpScalar execution', (t) => {
  const source = vtkSphereSource.newInstance();
  const filter = vtkWarpScalar.newInstance();
  filter.setInputConnection(source.getOutputPort());
  source.update();
  filter.update();
  const input = source.getOutputData();
  const output = filter.getOutputData();

  t.ok(output, 'Output dataset exist');
  t.equal(
    output.isA('vtkPolyData'),
    true,
    'The output dataset should be a vtkPolydata'
  );
  t.equal(
    input.getPoints().getNumberOfPoints(),
    output.getPoints().getNumberOfPoints(),
    `The number of points do not change between input ${input
      .getPoints()
      .getNumberOfPoints()} and output ${output
      .getPoints()
      .getNumberOfPoints()}`
  );

  t.end();
});
