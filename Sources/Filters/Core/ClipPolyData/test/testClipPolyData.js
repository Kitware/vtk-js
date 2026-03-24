import test from 'tape';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkClipPolyData from 'vtk.js/Sources/Filters/Core/ClipPolyData';

function createSquareAsTriangles() {
  const points = vtkPoints.newInstance();
  points.insertNextPoint(-1, 0, 0);
  points.insertNextPoint(1, 0, 0);
  points.insertNextPoint(1, 1, 0);
  points.insertNextPoint(-1, 1, 0);

  const polys = vtkCellArray.newInstance();
  polys.insertNextCell([0, 1, 2]);
  polys.insertNextCell([0, 2, 3]);

  const polydata = vtkPolyData.newInstance();
  polydata.setPoints(points);
  polydata.setPolys(polys);
  polydata.getPointData().setScalars(
    vtkDataArray.newInstance({
      name: 'inputScalars',
      values: new Float32Array([-1, 1, 1, -1]),
      numberOfComponents: 1,
    })
  );

  return polydata;
}

test('vtkClipPolyData clips a triangle mesh and produces clipped output', (t) => {
  const plane = vtkPlane.newInstance({
    origin: [0, 0, 0],
    normal: [1, 0, 0],
  });

  const clipper = vtkClipPolyData.newInstance({
    clipFunction: plane,
    generateClipScalars: true,
    generateClippedOutput: true,
  });

  clipper.setInputData(createSquareAsTriangles());

  const kept = clipper.getOutputData();
  const clipped = clipper.getOutputData(1);

  t.equal(kept.getNumberOfPolys(), 3, 'kept side is triangulated into 3 polys');
  t.equal(
    clipped.getNumberOfPolys(),
    3,
    'clipped side is triangulated into 3 polys'
  );
  t.equal(
    kept.getNumberOfPoints(),
    7,
    'shared point set contains originals and intersections'
  );
  t.equal(clipped.getNumberOfPoints(), 7, 'clipped output shares point set');

  const keptScalars = kept.getPointData().getScalars().getData();
  t.equal(keptScalars.length, 7, 'generated clip scalars were attached');
  t.ok(
    Array.from(keptScalars).includes(0),
    'intersection points carry the clip value'
  );

  t.end();
});
