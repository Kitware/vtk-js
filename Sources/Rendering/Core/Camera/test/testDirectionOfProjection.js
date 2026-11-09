import { describe, it, expect } from 'vitest';
import vtkCamera from 'vtk.js/Sources/Rendering/Core/Camera';

describe('Camera setDirectionOfProjection', () => {
  it('calculates the distance of a new camera', () => {
    const camera = vtkCamera.newInstance();
    expect(camera.getDistance()).toBe(1);
  });

  it('calculates the distance from the initial values', () => {
    const camera = vtkCamera.newInstance({
      position: [0, 0, 10],
      focalPoint: [0, 0, 4],
    });
    expect(camera.getDistance()).toBe(6);
  });

  it('calculates a zero distance when the position is the focal point', () => {
    const camera = vtkCamera.newInstance({
      position: [1, 2, 3],
      focalPoint: [1, 2, 3],
    });
    expect(camera.getDistance()).toBe(0);
  });

  it('calculates the distance from typed array initial values', () => {
    const camera = vtkCamera.newInstance({
      position: new Float64Array([0, 0, 10]),
      focalPoint: new Float64Array([0, 0, 4]),
    });
    expect(camera.getDistance()).toBe(6);
  });

  it.each([
    ['a null position', { position: null }],
    ['an undefined position', { position: undefined }],
    ['a null focal point', { focalPoint: null }],
    ['an undefined focal point', { focalPoint: undefined }],
    ['a null component', { position: [null, 0, 1] }],
    ['an undefined component', { position: [undefined, 0, 1] }],
    ['a NaN component', { focalPoint: [0, NaN, 0] }],
    ['an infinite component', { position: [0, 0, Infinity] }],
  ])('does not calculate the distance from %s', (_, initialValues) => {
    const camera = vtkCamera.newInstance(initialValues);
    expect(camera.getDistance()).toBeUndefined();
  });

  it('keeps the direction of projection from the initial values', () => {
    const camera = vtkCamera.newInstance({
      directionOfProjection: [1, 0, 0],
      viewPlaneNormal: [-1, 0, 0],
    });
    expect(camera.getDirectionOfProjection()).toEqual([1, 0, 0]);
    expect(camera.getViewPlaneNormal()).toEqual([-1, 0, 0]);
  });

  it('keeps a valid focal point on a new camera', () => {
    const camera = vtkCamera.newInstance();
    camera.setDirectionOfProjection(0, 0, 1);
    expect(camera.getFocalPoint()).toEqual([0, 0, 2]);
  });

  it('marks the camera as modified when the direction changes', () => {
    const camera = vtkCamera.newInstance();
    camera.setPosition(0, 0, 5);
    const mtime = camera.getMTime();

    expect(camera.setDirectionOfProjection(1, 0, 0)).toBe(true);
    expect(camera.getFocalPoint()).toEqual([5, 0, 5]);
    expect(camera.getMTime()).toBeGreaterThan(mtime);
  });

  it('does not mark the camera as modified when the direction is the same', () => {
    const camera = vtkCamera.newInstance();
    const mtime = camera.getMTime();

    expect(camera.setDirectionOfProjection(0, 0, -1)).toBe(false);
    expect(camera.getMTime()).toBe(mtime);
  });
});
