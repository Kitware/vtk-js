import { it, expect } from 'vitest';
import vtkSphere from 'vtk.js/Sources/Common/DataModel/Sphere';

function assertSphereClose(actual, expected, eps = 1e-6) {
  expect(Math.abs(actual[0] - expected[0]) < eps).toBeTruthy();
  expect(Math.abs(actual[1] - expected[1]) < eps).toBeTruthy();
  expect(Math.abs(actual[2] - expected[2]) < eps).toBeTruthy();
  expect(Math.abs(actual[3] - expected[3]) < eps).toBeTruthy();
}

it('Test Sphere computeBoundingSphere', () => {
  const pts = [
    0.0, 0.0, 0.0, 2.0, 0.0, 0.0, 1.0, 1.0, 0.0, 100.0, 100.0, 100.0,
  ];

  const sphere = vtkSphere.computeBoundingSphere(pts, 3);
  assertSphereClose(sphere, [1.0, 0.0, 0.0, 1.0]);

  const sphereWithHints = vtkSphere.computeBoundingSphere(pts, 3, [0, 1]);
  assertSphereClose(sphereWithHints, [1.0, 0.0, 0.0, 1.0]);
});

it('Test Sphere computeBoundingSphereFromSpheres', () => {
  const spheres = [
    [0.0, 0.0, 0.0, 1.0],
    [4.0, 0.0, 0.0, 1.0],
    [2.0, 0.0, 0.0, 0.5],
    [20.0, 0.0, 0.0, 1.0],
  ];

  const sphere = vtkSphere.computeBoundingSphereFromSpheres(spheres, 3);
  assertSphereClose(sphere, [2.0, 0.0, 0.0, 3.0]);

  const sphereWithHints = vtkSphere.computeBoundingSphereFromSpheres(
    spheres,
    2,
    [0, 1]
  );
  assertSphereClose(sphereWithHints, [2.0, 0.0, 0.0, 3.0]);
});
