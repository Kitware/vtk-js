import { it, expect } from 'vitest';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkTextureMapToPlane from 'vtk.js/Sources/Filters/Texture/TextureMapToPlane';

it('Test vtkTextureMapToPlane instance', () => {
  expect(
    vtkTextureMapToPlane,
    'Make sure the class definition exists'
  ).toBeTruthy();
  const instance = vtkTextureMapToPlane.newInstance();
  expect(instance).toBeTruthy();
});

it('Test vtkTextureMapToPlane TCoords generation', () => {
  const cubeSource = vtkCubeSource.newInstance();
  const cube = cubeSource.getOutputData();
  cube.getPointData().setTCoords(null);
  const planeTextureFilter = vtkTextureMapToPlane.newInstance();
  planeTextureFilter.setInputData(cube);
  planeTextureFilter.setPoint1(0.5, 0, 0);
  planeTextureFilter.setPoint2(0, 0.5, 0);
  planeTextureFilter.setAutomaticPlaneGeneration(0);
  planeTextureFilter.update();

  const generatedTCoords = planeTextureFilter
    .getOutputData()
    .getPointData()
    .getTCoords()
    .getData();

  const expectedData = [
    -1, -1, -1, -1, -1, 1, -1, 1, 1, -1, 1, -1, 1, 1, 1, 1, -1, -1, -1, -1, 1,
    -1, 1, -1, -1, 1, -1, 1, 1, 1, 1, 1, -1, -1, 1, -1, -1, 1, 1, 1, -1, -1, 1,
    -1, -1, 1, 1, 1,
  ];

  for (let i = 0; i < generatedTCoords.length; i++) {
    expect(generatedTCoords[i]).toBe(expectedData[i]);
  }
});

it('Test vtkTextureMapToPlane TCoords generation automatic', () => {
  const cubeSource = vtkCubeSource.newInstance();
  const cube = cubeSource.getOutputData();
  cube.getPointData().setTCoords(null);
  const planeTextureFilter = vtkTextureMapToPlane.newInstance();
  planeTextureFilter.setInputData(cube);
  planeTextureFilter.setAutomaticPlaneGeneration(1);
  planeTextureFilter.update();

  const generatedTCoords = planeTextureFilter
    .getOutputData()
    .getPointData()
    .getTCoords()
    .getData();

  const expectedData = [
    0, 0, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0,
    1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1,
  ];

  for (let i = 0; i < generatedTCoords.length; i++) {
    expect(generatedTCoords[i]).toBe(expectedData[i]);
  }
});
