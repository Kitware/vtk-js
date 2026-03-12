import { it, expect } from 'vitest';
import vtkCubeSource from 'vtk.js/Sources/Filters/Sources/CubeSource';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkPolyDataNormals from 'vtk.js/Sources/Filters/Core/PolyDataNormals';
import vtkTriangle from 'vtk.js/Sources/Common/DataModel/Triangle';

const PRECISION = 4;

it('Test vtkPolyDataNormals passData', () => {
  const cube = vtkCubeSource.newInstance();
  const input = cube.getOutputData();
  input.getPointData().setNormals(null);

  const normals = vtkPolyDataNormals.newInstance();
  normals.setInputData(input);
  normals.update();
  const output = normals.getOutputData();

  expect(input.getPointData().getNormals()).toBe(null);
  expect(input.getPointData().getTCoords() != null).toBeTruthy();

  expect(output.getPointData().getNormals() != null).toBeTruthy();
  expect(output.getPointData().getTCoords()).toBe(
    input.getPointData().getTCoords()
  );
});

it('Test vtkPolyDataNormals normals', () => {
  const cube = vtkCubeSource.newInstance();
  const input = cube.getOutputData();
  const pointNormalsData = input.getPointData().getNormals().getData();
  // const cellNormalsData = input.getCellData().getNormals().getData();
  input.getPointData().setNormals(null);
  input.getCellData().setNormals(null);

  const normals = vtkPolyDataNormals.newInstance();
  normals.setInputData(input);
  normals.setComputeCellNormals(true);
  normals.update();
  const output = normals.getOutputData();

  expect(
    vtkMath.roundVector(pointNormalsData, [], PRECISION),
    'Same point normals'
  ).toEqual(
    vtkMath.roundVector(
      output.getPointData().getNormals().getData(),
      [],
      PRECISION
    )
  );

  const pointsData = output.getPoints().getData();
  const polysData = output.getPolys().getData();
  const polysDataLength = polysData.length;
  const cellPointIds = [0, 0, 0];
  let numberOfPoints = 0;
  let polysId = 0;
  for (let c = 0; c < polysDataLength; c += numberOfPoints + 1) {
    numberOfPoints = polysData[c];

    for (let i = 1; i <= 3; ++i) {
      cellPointIds[i - 1] = 3 * polysData[c + i];
    }

    const cellNormal = [];

    vtkTriangle.computeNormal(
      pointsData.slice(cellPointIds[0], cellPointIds[0] + 3),
      pointsData.slice(cellPointIds[1], cellPointIds[1] + 3),
      pointsData.slice(cellPointIds[2], cellPointIds[2] + 3),
      cellNormal
    );

    expect(
      vtkMath.roundVector(cellNormal, [], PRECISION),
      `Same cell normal #${polysId}`
    ).toEqual(
      vtkMath.roundVector(
        output
          .getCellData()
          .getNormals()
          .getData()
          .slice(3 * polysId, 3 * polysId + 3),
        [],
        PRECISION
      )
    );
    ++polysId;
  }
});
