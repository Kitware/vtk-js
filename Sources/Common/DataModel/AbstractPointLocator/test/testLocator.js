import { it, expect } from 'vitest';
import vtkAbstractPointLocator from 'vtk.js/Sources/Common/DataModel/AbstractPointLocator';

it('Test vtkAbstractPointLocator instance', () => {
  expect(
    vtkAbstractPointLocator,
    'Make sure the class definition exists'
  ).toBeTruthy();
  expect(
    vtkAbstractPointLocator.newInstance === undefined,
    'Make sure class is abstract'
  ).toBeTruthy();
});
