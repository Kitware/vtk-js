import { it, expect } from 'vitest';
import vtkContourTriangulator from 'vtk.js/Sources/Filters/General/ContourTriangulator';
import { reverseElements } from '../helper';

it('Test vtkContourTriangulator instance', () => {
  expect(vtkContourTriangulator).toBeTruthy();
  const instance = vtkContourTriangulator.newInstance();
  expect(instance).toBeTruthy();
});

it('Test reverseElements', () => {
  const originalArr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const arr1 = [...originalArr];
  const arr2 = [...originalArr];

  reverseElements(arr1, 2, 7);
  expect(arr1).toEqual([0, 1, 7, 6, 5, 4, 3, 2, 8, 9]);

  reverseElements(arr1, 2, 7);
  expect(arr1).toEqual(originalArr);

  reverseElements(arr1);
  arr2.reverse();

  expect(arr1).toEqual(arr2);
});
