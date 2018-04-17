import test from 'tape-catch';

import vtkPiecewiseFunctionProxy from 'vtk.js/Sources/Proxy/Core/PiecewiseFunctionProxy';
import Constants from 'vtk.js/Sources/Proxy/Core/PiecewiseFunctionProxy/Constants';

import testUtils from 'vtk.js/Sources/Testing/testUtils';

const { Mode, Defaults } = Constants;
const { arrayEquals, objEquals } = testUtils;

function listEquals(a, b, equality = 'array') {
  const equals = equality === 'array' ? arrayEquals : objEquals;
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; ++i) {
    if (!equals(a, b)) {
      return false;
    }
  }
  return true;
}

function validatePwf(pwf, expected) {
  for (let i = 0; i < expected.length; ++i) {
    const val = Array(4);
    pwf.getNodeValue(i, val);
    if (!arrayEquals(val, expected[i])) {
      return false;
    }
  }
  return true;
}

function getRange(points) {
  let min = Infinity;
  let max = -Infinity;
  points.forEach(([x, y]) => {
    min = Math.min(x, min);
    max = Math.max(x, max);
  });

  return [min, max];
}

function normalize(points, range) {
  const width = range[1] - range[0];
  return points.map(([x, y]) => [(x - range[0]) / width, y]);
}

test('Test vtkPiecewiseFunctionProxy', (t) => {
  const pwfProxy = vtkPiecewiseFunctionProxy.newInstance();
  const pwf = pwfProxy.getPiecewiseFunction();

  const points = [[-30, 0], [20, 0.3], [50, 0.5], [80, 1.0]];
  // adds midpoint=0.5, sharpness=0
  const expected = points.map((p) => [].concat(p, [0.5, 0]));

  const range = getRange(points);
  pwfProxy.setPoints(normalize(points, range));
  pwfProxy.setDataRange(...range);

  t.ok(
    !validatePwf(pwf, expected),
    'Custom points should not be active in Gaussian mode'
  );

  pwfProxy.setMode(Mode.Points);
  t.ok(
    validatePwf(pwf, expected),
    'Custom points should be active in Points mode'
  );

  pwfProxy.setGaussians(null);
  t.ok(
    listEquals(pwfProxy.getGaussians(), Defaults.Gaussians, 'object'),
    'Default nodes'
  );

  pwfProxy.setPoints(null);
  t.ok(
    listEquals(pwfProxy.getPoints(), Defaults.Points, 'array'),
    'Default points'
  );

  pwfProxy.setNodes(null);
  t.ok(
    listEquals(pwfProxy.getNodes(), Defaults.Nodes, 'object'),
    'Default nodes'
  );

  t.end();
});
