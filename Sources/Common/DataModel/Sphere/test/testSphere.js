import test from 'tape';
import vtkSphere from 'vtk.js/Sources/Common/DataModel/Sphere';

function assertSphereClose(t, actual, expected, eps = 1e-6) {
  t.ok(
    Math.abs(actual[0] - expected[0]) < eps,
    `center x should be ${expected[0]}`
  );
  t.ok(
    Math.abs(actual[1] - expected[1]) < eps,
    `center y should be ${expected[1]}`
  );
  t.ok(
    Math.abs(actual[2] - expected[2]) < eps,
    `center z should be ${expected[2]}`
  );
  t.ok(
    Math.abs(actual[3] - expected[3]) < eps,
    `radius should be ${expected[3]}`
  );
}

test('Test Sphere computeBoundingSphere', (t) => {
  const pts = [
    0.0, 0.0, 0.0, 2.0, 0.0, 0.0, 1.0, 1.0, 0.0, 100.0, 100.0, 100.0,
  ];

  const sphere = vtkSphere.computeBoundingSphere(pts, 3);
  assertSphereClose(t, sphere, [1.0, 0.0, 0.0, 1.0]);

  const sphereWithHints = vtkSphere.computeBoundingSphere(pts, 3, [0, 1]);
  assertSphereClose(t, sphereWithHints, [1.0, 0.0, 0.0, 1.0]);

  t.end();
});

test('Test Sphere computeBoundingSphereFromSpheres', (t) => {
  const spheres = [
    [0.0, 0.0, 0.0, 1.0],
    [4.0, 0.0, 0.0, 1.0],
    [2.0, 0.0, 0.0, 0.5],
    [20.0, 0.0, 0.0, 1.0],
  ];

  const sphere = vtkSphere.computeBoundingSphereFromSpheres(spheres, 3);
  assertSphereClose(t, sphere, [2.0, 0.0, 0.0, 3.0]);

  const sphereWithHints = vtkSphere.computeBoundingSphereFromSpheres(
    spheres,
    2,
    [0, 1]
  );
  assertSphereClose(t, sphereWithHints, [2.0, 0.0, 0.0, 3.0]);

  t.end();
});
