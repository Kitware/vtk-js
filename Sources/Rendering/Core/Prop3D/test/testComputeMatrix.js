import { it, expect } from 'vitest';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';

// The actor matrix only depends on the transform state (position, origin,
// scale, orientation, userMatrix). Recomputing it on any other modification
// (e.g. setVisibility) is wasted work.
it('Test computeMatrix only runs on transform change', () => {
  const actor = vtkActor.newInstance();
  const getMatrixMTime = () =>
    actor.getReferenceByName('matrixMTime').getMTime();

  // Build the matrix once so it is up to date
  actor.getMatrix();
  let mtime = getMatrixMTime();

  // Modifications unrelated to the transform must not trigger a matrix
  // recomputation, neither eagerly through onModified nor lazily through
  // getMatrix()/computeMatrix().
  actor.setVisibility(false);
  actor.setPickable(false);
  actor.getProperty().setOpacity(0.5);
  actor.getMatrix();
  actor.computeMatrix();
  expect(getMatrixMTime()).toBe(mtime);

  // Transform changes must still recompute the matrix
  actor.setPosition(1, 2, 3);
  expect(getMatrixMTime()).toBeGreaterThan(mtime);
  expect(actor.getIsIdentity()).toBe(false);
  const matrix = actor.getMatrix();
  expect(matrix[3]).toBe(1);
  expect(matrix[7]).toBe(2);
  expect(matrix[11]).toBe(3);

  mtime = getMatrixMTime();
  actor.setOrigin(1, 0, 0);
  expect(getMatrixMTime()).toBeGreaterThan(mtime);

  mtime = getMatrixMTime();
  actor.setScale(2, 2, 2);
  expect(getMatrixMTime()).toBeGreaterThan(mtime);

  mtime = getMatrixMTime();
  actor.rotateZ(45);
  expect(getMatrixMTime()).toBeGreaterThan(mtime);
  expect(actor.getIsIdentity()).toBe(false);

  // Resetting the orientation to zero must reset the rotation even though
  // rotateX/Y/Z early-return on a null angle.
  actor.setPosition(0, 0, 0);
  actor.setOrigin(0, 0, 0);
  actor.setScale(1, 1, 1);
  actor.setOrientation(30, 0, 0);
  expect(actor.getIsIdentity()).toBe(false);
  mtime = getMatrixMTime();
  actor.setOrientation(0, 0, 0);
  expect(getMatrixMTime()).toBeGreaterThan(mtime);
  expect(actor.getIsIdentity()).toBe(true);

  // In-place edits of the user matrix need an explicit transformsModified()
  actor.getUserMatrix()[12] = 5;
  actor.transformsModified();
  expect(actor.getMatrix()[3]).toBe(5);
});
