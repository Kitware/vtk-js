import test from 'tape-catch';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkTextureMapToSphere from 'vtk.js/Sources/Filters/Texture/TextureMapToSphere';

test('Test vtkTextureMapToSphere instance', (t) => {
  t.ok(vtkTextureMapToSphere, 'Make sure the class definition exists');
  const instance = vtkTextureMapToSphere.newInstance();
  t.ok(instance);
  t.end();
});

test('Test vtkTextureMapToSphere TCoords generation', (t) => {
  const cubeSource = vtkCubeSource.newInstance();
  const cube = cubeSource.getOutputData();
  cube.getPointData().setTCoords(null);
  const sphereTextureFilter = vtkTextureMapToSphere.newInstance();
  sphereTextureFilter.setInputData(cube);
  sphereTextureFilter.update();

  const generatedTCoords = sphereTextureFilter
    .getOutputData()
    .getPointData()
    .getTCoords()
    .getData();

  // prettier-ignore
  const expectedData = [
    0.75, 0.695913,
    0.75, 0.304087,
    0.75, 0.695913,
    0.75, 0.304087,
    0.25, 0.695913,
    0.25, 0.304087,
    0.25, 0.695913,
    0.25, 0.304087,
    0.75, 0.695913,
    0.75, 0.304087,
    0.25, 0.695913,
    0.25, 0.304087,
    0.75, 0.695913,
    0.75, 0.304087,
    0.25, 0.695913,
    0.25, 0.304087,
    0.75, 0.695913,
    0.25, 0.695913,
    0.75, 0.695913,
    0.25, 0.695913,
    0.75, 0.304087,
    0.25, 0.304087,
    0.75, 0.304087,
    0.25, 0.304087,
  ];

  for (let i = 0; i < generatedTCoords.length; i++) {
    const val = Math.round(generatedTCoords[i] * 1000000) / 1000000;
    t.equal(val, expectedData[i]);
  }

  t.end();
});
