import test from 'tape-catch';

import vtk from 'vtk.js/Sources/vtk';
import vtkClosedPolyLineToSurfaceFilter from 'vtk.js/Sources/Filters/General/ClosedPolyLineToSurfaceFilter';

import polyLineState from './polyLine.json';
import cellArrayState from './cellArray.json';

test('Test vtkClosedPolyLineToSurfaceFilter instance', (t) => {
  t.ok(
    vtkClosedPolyLineToSurfaceFilter,
    'Make sure the class defination exists'
  );
  const instance = vtkClosedPolyLineToSurfaceFilter.newInstance();
  t.ok(instance, 'Make sure an instance can be created.');
  t.end();
});

test('Test vtkClosedPolyLineToSurfaceFilter execution', (t) => {
  const polyLine = vtk(polyLineState);
  const cellArray = vtk(cellArrayState);
  const filter = vtkClosedPolyLineToSurfaceFilter.newInstance();
  filter.setInputData(polyLine);
  const resultPolyData = filter.getOutputData();
  const actualPoly = resultPolyData.getPolys().getData();
  const expectedPoly = cellArray.getData();
  t.deepEqual(
    actualPoly,
    expectedPoly,
    'Polys should have a single segment with 96 point indices'
  );
  t.end();
});
