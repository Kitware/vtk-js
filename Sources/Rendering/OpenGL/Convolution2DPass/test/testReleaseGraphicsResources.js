import { it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';
import {
  createConeActor,
  createTrackedRenderView,
  expectPassResourcesFreedOnDelete,
  expectSameImageAfterPassRelease,
  usePostProcessingPass,
} from 'vtk.js/Sources/Testing/renderTestUtils';

import vtkConvolution2DPass from 'vtk.js/Sources/Rendering/OpenGL/Convolution2DPass';

const createPass = (gc) =>
  gc.registerResource(vtkConvolution2DPass.newInstance());

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'frees the convolution pass GPU objects when the view is deleted',
  () => expectPassResourcesFreedOnDelete(createPass)
);

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'draws the same image after the view releases its render pass resources',
  () => expectSameImageAfterPassRelease(createPass)
);

// A kernel of the given dimension that leaves the image untouched.
function identityKernel(dimension) {
  const kernel = new Float32Array(dimension * dimension);
  kernel[Math.floor(kernel.length / 2)] = 1;
  return kernel;
}

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'frees the vertex array it rebuilds for a new kernel dimension',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { tracker, renderer, renderWindow, view } =
      createTrackedRenderView(gc);

    const pass = usePostProcessingPass(gc, view, createPass);
    renderer.addActor(createConeActor(gc));
    renderer.resetCamera();
    renderWindow.render();
    const objectsInUse = tracker.count();

    // A new dimension recompiles the shader, and the vertex array that feeds
    // it has to be rebuilt against the new program rather than replaced.
    pass.setKernelDimension(5);
    pass.setKernel(identityKernel(5));
    renderWindow.render();

    expect(tracker.count()).toBe(objectsInUse);

    gc.releaseResources();
  }
);
