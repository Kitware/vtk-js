import { it, expect } from 'vitest';
import vtkMouseRangeManipulator from 'vtk.js/Sources/Interaction/Manipulators/MouseRangeManipulator';

it('Test MouseRangeManipulator addition/removal', () => {
  const manip = vtkMouseRangeManipulator.newInstance();

  manip.setHorizontalListener(
    0,
    10,
    1,
    () => 5,
    () => {}
  );
  expect(manip.get('horizontalListener').horizontalListener).toBeTruthy();

  manip.setVerticalListener(
    0,
    10,
    1,
    () => 5,
    () => {}
  );
  expect(manip.get('verticalListener').verticalListener).toBeTruthy();

  manip.removeHorizontalListener();
  expect(manip.get('horizontalListener').horizontalListener).toBeFalsy();

  manip.removeVerticalListener();
  expect(manip.get('verticalListener').verticalListener).toBeFalsy();

  let sliceValue = 5;
  manip.setScrollListener(
    0,
    10,
    1,
    () => sliceValue,
    (x) => {
      sliceValue = x;
    },
    0.5
  );

  manip.onScroll(null, null, 1);
  expect(sliceValue).toBe(5);

  manip.onScroll(null, null, 1);
  expect(sliceValue).toBe(6);

  manip.onScroll(null, null, -1);
  expect(sliceValue).toBe(6);

  manip.onScroll(null, null, -1);
  expect(sliceValue).toBe(5);

  manip.removeScrollListener();
  sliceValue = 0;
  manip.setScrollListener(
    -5,
    7,
    2,
    () => sliceValue,
    (x) => {
      sliceValue = x;
    },
    1.0
  );

  manip.onScroll(null, null, 1);
  expect(sliceValue).toBe(2);

  manip.onScroll(null, null, -1);
  expect(sliceValue).toBe(0);

  manip.onScroll(null, null, -1);
  expect(sliceValue).toBe(-2);
});
