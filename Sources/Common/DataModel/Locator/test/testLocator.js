import { it, expect } from 'vitest';
import vtkLocator from 'vtk.js/Sources/Common/DataModel/Locator';

it('Test vtkLocator instance', () => {
  expect(vtkLocator, 'Make sure the class definition exists').toBeTruthy();
  expect(
    vtkLocator.newInstance === undefined,
    'Make sure class is abstract'
  ).toBeTruthy();
});
