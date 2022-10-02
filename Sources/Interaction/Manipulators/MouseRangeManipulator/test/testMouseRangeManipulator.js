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

  t.end();
});
