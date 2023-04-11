import test from 'tape-catch';

import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkPolyDataNormals from 'vtk.js/Sources/Filters/Core/PolyDataNormals';

test('Test vtkPolyDataNormals passData', (t) => {
  const cube = vtkCubeSource.newInstance();
  const input = cube.getOutputData();
  input.getPointData().setNormals(null);

  const normals = vtkPolyDataNormals.newInstance();
  normals.setInputData(input);
  normals.update();
  const output = normals.getOutputData();

  t.equal(input.getPointData().getNormals(), null);
  t.ok(input.getPointData().getTCoords() != null);

  t.ok(output.getPointData().getNormals() != null);
  t.equal(
    output.getPointData().getTCoords(),
    input.getPointData().getTCoords()
  );

  t.end();
});
