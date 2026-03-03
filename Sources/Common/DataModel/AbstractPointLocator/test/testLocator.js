import { it, expect } from 'vitest';
import vtkAbstractPointLocator from 'vtk.js/Sources/Common/DataModel/AbstractPointLocator';

it('Test vtkAbstractPointLocator instance', () => {
  expect(vtkAbstractPointLocator).toBeTruthy();
  expect(vtkAbstractPointLocator.newInstance === undefined).toBeTruthy();
});
