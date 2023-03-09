import test from 'tape-catch';

import vtkMouseRangeManipulator from 'vtk.js/Sources/Interaction/Manipulators/MouseRangeManipulator';

test('Test MouseRangeManipulator addition/removal', (t) => {
  const manip = vtkMouseRangeManipulator.newInstance();

  manip.setHorizontalListener(
    0,
    10,
    1,
    () => 5,
    () => {}
  );
  t.ok(
    manip.get('horizontalListener').horizontalListener,
    'Has horizontal listener after setting'
  );

  manip.setVerticalListener(
    0,
    10,
    1,
    () => 5,
    () => {}
  );
  t.ok(
    manip.get('verticalListener').verticalListener,
    'Has vertical listener after setting'
  );

  manip.removeHorizontalListener();
  t.notOk(
    manip.get('horizontalListener').horizontalListener,
    'Horizontal listener removed'
  );

  manip.removeVerticalListener();
  t.notOk(
    manip.get('verticalListener').verticalListener,
    'Vertical listener removed'
  );

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
  t.isEqual(sliceValue, 5, 'Scrolling to larger value, attempt-1.');

  manip.onScroll(null, null, 1);
  t.isEqual(sliceValue, 6, 'Scrolling to larger value, attempt-2.');

  manip.onScroll(null, null, -1);
  t.isEqual(sliceValue, 6, 'Scrolling to smaller value, attempt-1.');

  manip.onScroll(null, null, -1);
  t.isEqual(sliceValue, 5, 'Scrolling to smaller value, attempt-2.');

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
  t.isEqual(sliceValue, 2, 'Scrolling to larger value with step=2.');

  manip.onScroll(null, null, -1);
  t.isEqual(
    sliceValue,
    0,
    'Scrolling to smaller value with step=2, attempt-1.'
  );

  manip.onScroll(null, null, -1);
  t.isEqual(
    sliceValue,
    -2,
    'Scrolling to smaller value with step=2, attempt-2.'
  );

  t.end();
});
