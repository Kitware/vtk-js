import test from 'tape-catch';

import {
  getAssociatedPlaneName,
  getPlaneNameFromLineName,
} from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/helpers';

test('Test getAssociatedPlaneName', (t) => {
  const data = [
    { planeName: 'X', rotatedPlane: 'Z', expected: 'Y' },
    { planeName: 'Y', rotatedPlane: 'Z', expected: 'X' },
    { planeName: 'X', rotatedPlane: 'Y', expected: 'Z' },
    { planeName: 'Z', rotatedPlane: 'Y', expected: 'X' },
    { planeName: 'X', rotatedPlane: 'Z', expected: 'Y' },
    { planeName: 'Y', rotatedPlane: 'Z', expected: 'X' },
    { planeName: 'I', rotatedPlane: 'Z', expected: null },
    { planeName: 'X', rotatedPlane: 'X', expected: null },
    { planeName: 'X', rotatedPlane: 'J', expected: null },
    { planeName: 'J', rotatedPlane: 'J', expected: null },
    { planeName: '', rotatedPlane: '', expected: null },
  ];

  data.forEach((testData) => {
    const associatedPlane = getAssociatedPlaneName(
      testData.planeName,
      testData.rotatedPlane
    );
    t.ok(associatedPlane === testData.expected);
  });

  t.end();
});

test('Test getPlaneNameFromLineName', (t) => {
  const data = [
    { planeName: 'AxisYinX', expected: 'Y' },
    { planeName: 'AxisYinY', expected: 'Y' },
    { planeName: 'AxisZYinY', expected: 'Y' },
    { planeName: 'YinZ', expected: 'Y' },
    { planeName: '', expected: null },
  ];

  data.forEach((testData) => {
    const associatedPlane = getPlaneNameFromLineName(testData.planeName);
    t.ok(associatedPlane === testData.expected);
  });

  t.end();
});
