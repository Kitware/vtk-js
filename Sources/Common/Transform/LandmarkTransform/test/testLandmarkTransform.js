import test from 'tape-catch';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import Constants from 'vtk.js/Sources/Common/Transform/LandmarkTransform/Constants';
import LandmarkTransform from 'vtk.js/Sources/Common/Transform/LandmarkTransform';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';

const { Mode } = Constants;

test('Test update in LandmarkTransform', (t) => {
  const transform = LandmarkTransform.newInstance();
  transform.setMode(Mode.SIMILARITY);
  const source = vtkPoints.newInstance();
  const target = vtkPoints.newInstance();
  source.setNumberOfPoints(1);
  target.setNumberOfPoints(1);
  source.setPoint(0, 1, 2, 3);
  target.setPoint(0, 4, 5, 6);
  transform.setSourceLandmark(source);
  transform.setTargetLandmark(target);
  transform.update();
  let transformMatrix = transform.getMatrix();
  t.ok(
    vtkMath.areEquals(
      transformMatrix,
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 3, 3, 3, 1]
    ),
    'Test for one point'
  );
  source.setNumberOfPoints(3);
  target.setNumberOfPoints(3);
  source.setPoint(0, 1, 2, 3);
  target.setPoint(0, 4, 5, 6);
  source.setPoint(1, 2, 1, 3);
  target.setPoint(1, 5, 4, 6);
  source.setPoint(2, 1, 3, 2);
  target.setPoint(2, 4, 6, 5);
  transform.setSourceLandmark(source);
  transform.setTargetLandmark(target);
  transform.update();
  transformMatrix = transform.getMatrix();
  t.ok(
    vtkMath.areEquals(
      transformMatrix,
      [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 3, 3, 3, 1]
    ),
    'Test for one known transform matrix'
  );
  t.end();
});
