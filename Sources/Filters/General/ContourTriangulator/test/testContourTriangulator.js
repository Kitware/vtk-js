import test from 'tape-catch';
import vtkContourTriangulator from 'vtk.js/Sources/Filters/General/ContourTriangulator';
import { reverseElements } from '../helper';

test('Test vtkContourTriangulator instance', (t) => {
  t.ok(vtkContourTriangulator, 'Make sure the class definition exists');
  const instance = vtkContourTriangulator.newInstance();
  t.ok(instance);
  t.end();
});

test('Test reverseElements', (t) => {
  const originalArr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  const arr1 = [...originalArr];
  const arr2 = [...originalArr];

  reverseElements(arr1, 2, 7);
  t.deepEqual(arr1, [0, 1, 7, 6, 5, 4, 3, 2, 8, 9], 'reverse elements 2 to 7');

  reverseElements(arr1, 2, 7);
  t.deepEqual(arr1, originalArr, 'reversing again gives original array');

  reverseElements(arr1);
  arr2.reverse();

  t.deepEqual(arr1, arr2, 'without arguments does the same as .reverse');
  t.end();
});
