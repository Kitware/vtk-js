import test from 'tape-catch';
import vtkClipClosedSurface from 'vtk.js/Sources/Filters/General/ClipClosedSurface';
import vtkLineSource from 'vtk.js/Sources/Filters/Sources/LineSource';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';

test('Test vtkClipClosedSurface instance', (t) => {
  t.ok(vtkClipClosedSurface, 'Make sure the class definition exists');
  const instance = vtkClipClosedSurface.newInstance();
  t.ok(instance);
  t.end();
});

test('Test clip a vtkLineSource', (t) => {
  const resolution = 10;
  const point1 = [-1, 0, 0];
  const point2 = [1, 0, 0];
  const origin = [
    (point1[0] + point2[0]) / 2,
    (point1[1] + point2[1]) / 2,
    (point1[2] + point2[2]) / 2,
  ];
  const normal = [];
  vtkMath.subtract(point2, point1, normal);
  vtkMath.normalize(normal);

  const line = vtkLineSource.newInstance({
    point1,
    point2,
    resolution,
  });
  const halfLine = vtkLineSource.newInstance({
    point1: origin,
    point2,
    resolution: resolution / 2,
  });
  const planes = [];
  const plane = vtkPlane.newInstance({
    origin,
    normal,
  });
  planes.push(plane);

  const clipper = vtkClipClosedSurface.newInstance({
    generateOutline: true,
    clippingPlanes: planes,
  });
  clipper.setInputConnection(line.getOutputPort());
  clipper.update();
  const outputData = clipper.getOutputData();

  t.equal(
    outputData.getNumberOfLines(),
    resolution / 2,
    'Number of lines is half the resolution'
  );

  t.ok(
    vtkMath.areEquals(
      outputData.getPoints().getData(),
      halfLine.getOutputData().getPoints().getData()
    ),
    'Compare points with halfLine'
  );
  t.end();
});
