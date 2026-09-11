import { describe, it, expect, beforeEach } from 'vitest';
import { mat4 } from 'gl-matrix';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkCamera from 'vtk.js/Sources/Rendering/Core/Camera';

// Bounds of a "geology-like" scene: kilometers in X/Y, meters in Z.
const BOUNDS = [-1000, 1000, -1000, 1000, -10, 10];

// 10x vertical exaggeration. The camera stores modelTransformMatrix row-major,
// but a diagonal scale is symmetric so the two conventions coincide here.
function zScale(factor) {
  const m = new Float64Array(16);
  mat4.identity(m);
  m[10] = factor;
  return m;
}

let renderer;
let camera;

describe('Renderer resetCamera with camera model transform', () => {
  beforeEach(() => {
    renderer = vtkRenderer.newInstance();
    camera = vtkCamera.newInstance();
    renderer.setActiveCamera(camera);
    camera.setViewUp(0, 1, 0);
  });

  it('aims the camera at the transformed center, not the world center', () => {
    // Off-center in Z so the transform actually moves the center.
    const bounds = [-1000, 1000, -1000, 1000, 90, 110];
    camera.setModelTransformMatrix(zScale(10));
    renderer.resetCamera(bounds);

    // World center Z is 100; after a 10x Z scale the scene center sits at 1000.
    expect(camera.getFocalPoint()[2]).toBeCloseTo(1000, 6);
  });

  it('grows the fitted radius with the exaggeration factor', () => {
    camera.setModelTransformMatrix(null);
    renderer.resetCamera(BOUNDS);
    const unscaled = camera.getParallelScale();

    camera.setModelTransformMatrix(zScale(10));
    renderer.resetCamera(BOUNDS);
    const scaled = camera.getParallelScale();

    // Z extent goes from 20 to 200, so the bounding sphere must grow.
    expect(scaled).toBeGreaterThan(unscaled);
  });

  it('resetCameraClippingRange covers the transformed scene along the view axis', () => {
    // Look straight down world -Z, so the exaggerated axis is the depth axis and
    // the clipping range must stretch to match. This is the case that has no
    // application-level call site to fix: interaction paths call
    // resetCameraClippingRange() with no arguments.
    camera.setPosition(0, 0, 5000);
    camera.setFocalPoint(0, 0, 0);
    // The factor has to be large enough that the error exceeds the minGap
    // padding resetCameraClippingRange already applies, or the bug hides.
    camera.setModelTransformMatrix(zScale(100));

    renderer.resetCameraClippingRange(BOUNDS);
    const [near, far] = camera.getClippingRange();

    // Transformed Z extent is [-1000, 1000], so relative to the eye at z=5000
    // the scene spans depths 4000..6000.
    expect(near).toBeLessThanOrEqual(4000);
    expect(far).toBeGreaterThanOrEqual(6000);
  });

  it('is unchanged when no model transform is set', () => {
    camera.setModelTransformMatrix(null);
    renderer.resetCamera(BOUNDS);
    const focalPoint = [...camera.getFocalPoint()];
    const position = [...camera.getPosition()];
    const range = [...camera.getClippingRange()];

    camera.setModelTransformMatrix(zScale(1));
    renderer.resetCamera(BOUNDS);

    expect(camera.getFocalPoint()).toEqual(focalPoint);
    expect(camera.getPosition()).toEqual(position);
    expect(camera.getClippingRange()).toEqual(range);
  });
});
