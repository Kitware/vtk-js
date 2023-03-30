import test from 'tape-catch';

import {
  getOtherLineName,
  getLinePlaneName,
} from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/helpers';
import generateState from 'vtk.js/Sources/Widgets/Widgets3D/ResliceCursorWidget/state';

test('Test getOtherLineName', (t) => {
  const data = [
    { lineName: 'YinX', expected: 'ZinX' },
    { lineName: 'ZinX', expected: 'YinX' },
    { lineName: 'XinY', expected: 'ZinY' },
    { lineName: 'ZinY', expected: 'XinY' },
    { lineName: 'XinZ', expected: 'YinZ' },
    { lineName: 'YinZ', expected: 'XinZ' },
  ];
  const widgetState = generateState();

  data.forEach((testData) => {
    const associatedPlane = getOtherLineName(widgetState, testData.lineName);
    t.equal(associatedPlane, testData.expected);
  });

  t.end();
});

test('Test getLinePlaneName', (t) => {
  const data = [
    { lineName: 'YinX', expected: 'Y' },
    { lineName: 'ZinX', expected: 'Z' },
    { lineName: 'XinY', expected: 'X' },
    { lineName: 'ZinY', expected: 'Z' },
    { lineName: 'XinZ', expected: 'X' },
    { lineName: 'YinY', expected: 'Y' },
  ];

  data.forEach((testData) => {
    const planeName = getLinePlaneName(testData.lineName);
    t.equal(planeName, testData.expected);
  });

  t.end();
});
