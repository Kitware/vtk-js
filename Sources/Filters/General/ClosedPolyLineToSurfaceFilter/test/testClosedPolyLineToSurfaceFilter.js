import { it, expect } from 'vitest';
import vtk from 'vtk.js/Sources/vtk';
import vtkClosedPolyLineToSurfaceFilter from 'vtk.js/Sources/Filters/General/ClosedPolyLineToSurfaceFilter';

import polyLineState from './polyLine.json';
import cellArrayState from './cellArray.json';

it('Test vtkClosedPolyLineToSurfaceFilter instance', () => {
  expect(
    vtkClosedPolyLineToSurfaceFilter,
    'Make sure the class defination exists'
  ).toBeTruthy();
  const instance = vtkClosedPolyLineToSurfaceFilter.newInstance();
  expect(instance, 'Make sure an instance can be created.').toBeTruthy();
});

it('Test vtkClosedPolyLineToSurfaceFilter execution', () => {
  const polyLine = vtk(polyLineState);
  const cellArray = vtk(cellArrayState);
  const filter = vtkClosedPolyLineToSurfaceFilter.newInstance();
  filter.setInputData(polyLine);
  const resultPolyData = filter.getOutputData();
  const actualPoly = resultPolyData.getPolys().getData();
  const expectedPoly = cellArray.getData();
  expect(
    actualPoly,
    'Polys should have a single segment with 96 point indices'
  ).toEqual(expectedPoly);
});
