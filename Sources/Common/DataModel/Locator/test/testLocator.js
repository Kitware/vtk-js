import { it, expect } from 'vitest';
import vtkLocator from 'vtk.js/Sources/Common/DataModel/Locator';

it('Test vtkLocator instance', () => {
  expect(vtkLocator).toBeTruthy();
  expect(vtkLocator.newInstance === undefined).toBeTruthy();
});
