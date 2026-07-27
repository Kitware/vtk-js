import { describe, it, expect, beforeEach } from 'vitest';
import { mat4, vec3 } from 'gl-matrix';
import { areEquals } from 'vtk.js/Sources/Common/Core/Math';
import vtkCamera from 'vtk.js/Sources/Rendering/Core/Camera';
import vtkTransform from 'vtk.js/Sources/Common/Transform/Transform';

let camera;

// getViewMatrix returns vtk's row-major order; transpose to get a matrix that
// can be applied to points with gl-matrix.
function asPointTransform(rowMajor) {
  return mat4.transpose(mat4.create(), rowMajor);
}

// Where does world point p land in eye coordinates?
function toEye(cam, p) {
  return vec3.transformMat4(
    vec3.create(),
    p,
    asPointTransform(cam.getViewMatrix())
  );
}

describe('Camera Model Transform Matrix', () => {
  beforeEach(() => {
    camera = vtkCamera.newInstance();
  });

  describe('getViewMatrix composition', () => {
    it('applies the model transform to world coordinates before the camera transform', () => {
      camera.setPosition(0, 0, 10);
      camera.setFocalPoint(0, 0, 0);
      camera.setViewUp(0, 1, 0);

      // A translation is neither symmetric nor commuting with the view
      // transform, so it distinguishes both the multiplication order and the
      // row-major/column-major convention. A pure scale would not.
      const transform = vtkTransform.newInstance();
      transform.translate(1, 0, 0);
      const modelTransform = transform.getMatrix();

      camera.setModelTransformMatrix(modelTransform);

      // The world origin is moved to (1, 0, 0) by the model transform, so it
      // must land one unit off the view axis rather than on it.
      const eye = toEye(camera, [0, 0, 0]);
      expect(eye[0]).toBeCloseTo(1, 10);
      expect(eye[1]).toBeCloseTo(0, 10);
      expect(eye[2]).toBeCloseTo(-10, 10);

      transform.delete();
    });

    it('matches view * modelTransform for a non-symmetric transform', () => {
      camera.setPosition(5, 5, 5);
      camera.setFocalPoint(0, 0, 0);
      camera.setViewUp(0, 1, 0);

      const transform = vtkTransform.newInstance();
      transform.translate(1, 2, 3);
      transform.rotateWXYZ(30, 0, 1, 0);
      const modelTransform = transform.getMatrix();

      camera.setModelTransformMatrix(null);
      const view = asPointTransform(camera.getViewMatrix());

      camera.setModelTransformMatrix(modelTransform);
      const composed = asPointTransform(camera.getViewMatrix());

      const expected = mat4.multiply(mat4.create(), view, modelTransform);
      expect(areEquals(composed, expected)).toBe(true);

      transform.delete();
    });

    it('keeps a vertical exaggeration world-space across camera orientations', () => {
      // 2x exaggeration along world Z.
      const transform = vtkTransform.newInstance();
      transform.scale(1, 1, 2);
      const modelTransform = transform.getMatrix();

      camera.setPosition(0, 0, 10);
      camera.setFocalPoint(0, 0, 0);
      camera.setViewUp(0, 1, 0);

      [() => {}, () => camera.azimuth(37), () => camera.elevation(50)].forEach(
        (rotate) => {
          rotate();

          camera.setModelTransformMatrix(null);
          const view = asPointTransform(camera.getViewMatrix());

          camera.setModelTransformMatrix(modelTransform);
          const composed = asPointTransform(camera.getViewMatrix());

          const expected = mat4.multiply(mat4.create(), view, modelTransform);
          expect(areEquals(composed, expected)).toBe(true);
        }
      );

      transform.delete();
    });
  });

  describe('getViewMatrix buffer isolation', () => {
    it('getCompositeProjectionMatrix does not let getProjectionMatrix clobber the view matrix', () => {
      camera.setPosition(3, 4, 5);
      camera.setFocalPoint(0, 0, 0);
      camera.setViewUp(0, 1, 0);
      camera.setClippingRange(0.1, 100);

      const aspect = 1.5;

      // Capture the two factors independently. Both APIs return matrices the
      // caller can keep while later camera calls reuse internal scratch buffers.
      const view = camera.getViewMatrix();
      const projection = camera.getProjectionMatrix(aspect, -1, 1);
      const expected = mat4.multiply(mat4.create(), view, projection);

      const composite = camera.getCompositeProjectionMatrix(aspect, -1, 1);

      expect(areEquals(composite, expected)).toBe(true);
    });

    it('returns a reusable copy when an explicit view matrix is set', () => {
      camera.setViewMatrix(mat4.create());

      const view = camera.getViewMatrix();
      view[0] = 2;

      expect(camera.getViewMatrix()[0]).toBe(1);
    });

    it('writes the view matrix into a caller-provided output buffer', () => {
      const out = new Float64Array(16);

      const view = camera.getViewMatrix(out);

      expect(view).toBe(out);
      expect(areEquals(view, camera.getViewMatrix())).toBe(true);
    });
  });
});
