import { describe, it, expect, beforeEach } from 'vitest';
import { mat4, vec3, vec4 } from 'gl-matrix';
import { areEquals } from 'vtk.js/Sources/Common/Core/Math';
import vtkCamera from 'vtk.js/Sources/Rendering/Core/Camera';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkWebGPUCamera from 'vtk.js/Sources/Rendering/WebGPU/Camera';

// Pure JS until a render is requested, so this can be tested directly
// without a WebGPU adapter (contrast testImageMapperCameraProjection.js).

const ASPECT = 1.3;

// The matrix library defaults to Float32Array; use Float64Array here to match
// production precision and avoid error during conversion in both directions.
const vec3f64 = () => new Float64Array(3);
const vec4f64 = () => new Float64Array(4);

function makeWebGPUCamera(coreCamera) {
  const webgpuCamera = vtkWebGPUCamera.newInstance();
  webgpuCamera.setRenderable(coreCamera);
  return webgpuCamera;
}

// Simulates this backend's projection (native or delegated) without a real GPU.
function projectWithWebGPU(coreCamera, webgpuCamera, worldPoint) {
  const view = coreCamera.getViewMatrix();
  mat4.transpose(view, view); // Core's getViewMatrix is transposed once already
  const viewSpace = vec3.transformMat4(vec3f64(), worldPoint, view);

  const outMat = new Float64Array(16);
  webgpuCamera.getProjectionMatrix(
    outMat,
    ASPECT,
    coreCamera.getClippingRangeByReference(),
    coreCamera.getWindowCenterByReference()
  );
  const clip = vec4.transformMat4(
    vec4f64(),
    [viewSpace[0], viewSpace[1], viewSpace[2], 1],
    outMat
  );
  return {
    hardwareDepth: clip[2] / clip[3],
    ndcX: clip[0] / clip[3],
    ndcY: clip[1] / clip[3],
  };
}

// Backend independent half of picking, once handed standard 0=near,1=far
// depth; z*2-1 below mirrors Viewport.normalizedViewportToProjection.
function unproject(renderer, ndcX, ndcY, standardDepth) {
  const glZ = standardDepth * 2.0 - 1.0;
  const viewPos = renderer.projectionToView(ndcX, ndcY, glZ, ASPECT);
  return renderer.viewToWorld(viewPos[0], viewPos[1], viewPos[2]);
}

// Mirrors WebGPU/HardwareSelector: project, read depth, convertToOpenGLDepth, unproject.
function pickWorldPosition(renderer, webgpuCamera, worldPoint) {
  const coreCamera = renderer.getActiveCamera();
  const { hardwareDepth, ndcX, ndcY } = projectWithWebGPU(
    coreCamera,
    webgpuCamera,
    worldPoint
  );
  const standardDepth = webgpuCamera.convertToOpenGLDepth(hardwareDepth);
  return unproject(renderer, ndcX, ndcY, standardDepth);
}

describe('WebGPU Camera explicit projection matrix', () => {
  let renderer;
  let camera;
  let webgpuCamera;

  beforeEach(() => {
    renderer = vtkRenderer.newInstance();
    camera = vtkCamera.newInstance();
    renderer.setActiveCamera(camera);
    webgpuCamera = makeWebGPUCamera(camera);
  });

  describe.each([
    ['perspective', false],
    ['parallel', true],
  ])('%s projection', (_label, parallelProjection) => {
    beforeEach(() => {
      camera.setPosition(0, 0, 10);
      camera.setFocalPoint(0, 0, 0);
      camera.setViewUp(0, 1, 0);
      camera.setParallelProjection(parallelProjection);
      camera.setParallelScale(3);
      camera.setViewAngle(45);
      camera.setClippingRange(1, 100);
    });

    it('maps the near clipping plane to reversed Z hardware depth 1, decreasing towards far', () => {
      const [near, far] = camera.getClippingRangeByReference();
      const nearWorld = [0, 0, 10 - near];
      const farWorld = [0, 0, 10 - far];

      const { hardwareDepth: nearDepth } = projectWithWebGPU(
        camera,
        webgpuCamera,
        nearWorld
      );
      const { hardwareDepth: farDepth } = projectWithWebGPU(
        camera,
        webgpuCamera,
        farWorld
      );

      // Reversed Z: near is always 1. Parallel far is 0; perspective's
      // 1/depth parametrization only approaches 0 -- at far it's near/far.
      expect(nearDepth).toBeCloseTo(1, 9);
      const expectedFarDepth = parallelProjection ? 0 : near / far;
      expect(farDepth).toBeCloseTo(expectedFarDepth, 9);
      expect(farDepth).toBeLessThan(nearDepth);

      // Both convertToOpenGLDepth branches must convert in both directions at the
      // clipping planes.
      expect(webgpuCamera.convertToOpenGLDepth(nearDepth)).toBeCloseTo(0, 9);
      expect(webgpuCamera.convertToOpenGLDepth(farDepth)).toBeCloseTo(1, 9);
    });

    it('picks the same world position via the standard path and an equivalent explicit matrix override', () => {
      const worldPoint = [0.6, -0.4, 2.5];

      // Standard (native, untouched) path.
      const standardWorld = pickWorldPosition(
        renderer,
        webgpuCamera,
        worldPoint
      );
      expect(areEquals(standardWorld, worldPoint, 1e-6)).toBe(true);

      // Explicit matrix equal to the standard path's own output: Core
      // transposes first, so transposing again recovers the raw GL style matrix.
      const raw = camera.getProjectionMatrix(ASPECT, -1, 1);
      mat4.transpose(raw, raw);
      camera.setExplicitProjectionMatrix(raw);

      const explicitWorld = pickWorldPosition(
        renderer,
        webgpuCamera,
        worldPoint
      );
      expect(areEquals(explicitWorld, worldPoint, 1e-6)).toBe(true);
      expect(areEquals(explicitWorld, standardWorld, 1e-6)).toBe(true);
    });
  });

  it('scales the explicit matrix projection by 1/physicalScale, matching Core', () => {
    camera.setClippingRange(1, 100);
    const raw = mat4.perspective(mat4.create(), Math.PI / 4, ASPECT, 1, 100);
    camera.setExplicitProjectionMatrix(raw);
    camera.setPhysicalScale(4);

    const outMat = new Float64Array(16);
    webgpuCamera.getProjectionMatrix(
      outMat,
      ASPECT,
      camera.getClippingRangeByReference(),
      camera.getWindowCenterByReference()
    );

    const expected = camera.getProjectionMatrix(ASPECT, -1, 1);
    mat4.transpose(expected, expected);
    const Z_REMAP = mat4.create();
    Z_REMAP[10] = -0.5;
    Z_REMAP[14] = 0.5;
    mat4.multiply(expected, Z_REMAP, expected);

    expect(areEquals(outMat, expected)).toBe(true);
  });
});
