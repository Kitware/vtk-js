import { describe, it, expect, beforeEach } from 'vitest';
import { mat4 } from 'gl-matrix';
import { areEquals } from 'vtk.js/Sources/Common/Core/Math';
import vtkCamera from 'vtk.js/Sources/Rendering/Core/Camera';
import vtkTransform from 'vtk.js/Sources/Common/Transform/Transform';

let camera;

describe('Camera Model Transform Matrix', () => {
  beforeEach(() => {
    camera = vtkCamera.newInstance();
  });

  describe('getViewMatrix composition', () => {
    it('applies the model transform in world space (modelTransform * viewMatrix), not camera space (viewMatrix * modelTransform)', () => {
      camera.setPosition(5, 5, 5);
      camera.setFocalPoint(0, 0, 0);
      camera.setViewUp(0, 1, 0);

      // A translation does not commute with the view rotation/translation, so
      // this genuinely distinguishes the two multiplication orders.
      const transform = vtkTransform.newInstance();
      transform.translate(1, 0, 0);
      const modelTransform = transform.getMatrix();

      camera.setModelTransformMatrix(null);
      const viewMatrix = camera.getViewMatrix();

      camera.setModelTransformMatrix(modelTransform);
      const composed = camera.getViewMatrix();

      const worldSpace = mat4.multiply(
        mat4.create(),
        modelTransform,
        viewMatrix
      );
      const cameraSpace = mat4.multiply(
        mat4.create(),
        viewMatrix,
        modelTransform
      );

      expect(areEquals(composed, worldSpace)).toBe(true);
      expect(areEquals(composed, cameraSpace)).toBe(false);

      transform.delete();
    });

    it('keeps the world-space transform consistent across camera orientations (vertical exaggeration)', () => {
      // 2x vertical exaggeration: a non-uniform world-space Z scale.
      const transform = vtkTransform.newInstance();
      transform.scale(1, 1, 2);
      const modelTransform = transform.getMatrix();

      camera.setPosition(0, 0, 10);
      camera.setFocalPoint(0, 0, 0);
      camera.setViewUp(0, 1, 0);

      // The exaggeration must stay world-space (pre-multiplied), so model
      // transforms must be applied before the view matrix for every orientation.
      [() => {}, () => camera.azimuth(37), () => camera.elevation(50)].forEach(
        (rotate) => {
          rotate();

          camera.setModelTransformMatrix(null);
          const viewMatrix = camera.getViewMatrix();

          camera.setModelTransformMatrix(modelTransform);
          const composed = camera.getViewMatrix();

          const worldSpace = mat4.multiply(
            mat4.create(),
            modelTransform,
            viewMatrix
          );
          expect(areEquals(composed, worldSpace)).toBe(true);
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
  });
});
