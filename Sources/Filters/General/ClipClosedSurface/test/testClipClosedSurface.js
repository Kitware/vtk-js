import { it, expect } from 'vitest';
import vtkClipClosedSurface from 'vtk.js/Sources/Filters/General/ClipClosedSurface';
import { ScalarMode } from 'vtk.js/Sources/Filters/General/ClipClosedSurface/Constants';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkPoints from 'vtk.js/Sources/Common/Core/Points';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkLineSource from 'vtk.js/Sources/Filters/Sources/LineSource';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkMath from 'vtk.js/Sources/Common/Core/Math';

it('Test vtkClipClosedSurface instance', () => {
  expect(
    vtkClipClosedSurface,
    'Make sure the class definition exists'
  ).toBeTruthy();
  const instance = vtkClipClosedSurface.newInstance();
  expect(instance).toBeTruthy();
});

it('Test clip a vtkLineSource', () => {
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

  expect(
    outputData.getNumberOfLines(),
    'Number of lines is half the resolution'
  ).toBe(resolution / 2);

  expect(
    vtkMath.areEquals(
      outputData.getPoints().getData(),
      halfLine.getOutputData().getPoints().getData()
    ),
    'Compare points with halfLine'
  ).toBeTruthy();
});

it('Test clipping strips with an empty polygon array', () => {
  const points = vtkPoints.newInstance({
    values: new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]),
    numberOfComponents: 3,
  });
  const strips = vtkCellArray.newInstance();
  strips.insertNextCell([0, 1, 2]);

  const input = vtkPolyData.newInstance();
  input.setPoints(points);
  input.setStrips(strips);

  const clipper = vtkClipClosedSurface.newInstance({
    clippingPlanes: [],
    scalarMode: ScalarMode.COLORS,
  });
  clipper.setInputData(input);

  expect(() => clipper.update()).not.toThrow();
});
