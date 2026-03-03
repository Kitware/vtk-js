import { it, expect } from 'vitest';
import vtk from 'vtk.js/Sources/vtk';
import vtkClosedPolyLineToSurfaceFilter from 'vtk.js/Sources/Filters/General/ClosedPolyLineToSurfaceFilter';

import polyLineState from './polyLine.json';
import cellArrayState from './cellArray.json';

it('Test vtkClosedPolyLineToSurfaceFilter instance', () => {
  expect(vtkClosedPolyLineToSurfaceFilter).toBeTruthy();
  const instance = vtkClosedPolyLineToSurfaceFilter.newInstance();
  expect(instance).toBeTruthy();
});

it('Test vtkClosedPolyLineToSurfaceFilter execution', () => {
  const polyLine = vtk(polyLineState);
  const cellArray = vtk(cellArrayState);
  const filter = vtkClosedPolyLineToSurfaceFilter.newInstance();
  filter.setInputData(polyLine);
  const resultPolyData = filter.getOutputData();
  const actualPoly = resultPolyData.getPolys().getData();
  const expectedPoly = cellArray.getData();
  expect(actualPoly).toEqual(expectedPoly);
});
