import { it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';

const SIZE = 300;
const BACKGROUND = [0.32, 0.34, 0.43];

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

// Two overlapping translucent spheres: every pixel inside the overlap is the
// result of the weighted-blended OIT compositing, and the sphere silhouettes
// give the multisample resolve something to anti-alias.

function buildTranslucentScene(gc) {
  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);

  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const renderer = gc.registerResource(vtkRenderer.newInstance());
  renderWindow.addRenderer(renderer);
  renderer.setBackground(...BACKGROUND);

  const addSphere = (center, color) => {
    const source = gc.registerResource(
      vtkSphereSource.newInstance({
        center,
        radius: 0.5,
        thetaResolution: 60,
        phiResolution: 60,
      })
    );
    const mapper = gc.registerResource(vtkMapper.newInstance());
    mapper.setInputConnection(source.getOutputPort());
    const actor = gc.registerResource(vtkActor.newInstance());
    actor.setMapper(mapper);
    actor.getProperty().setOpacity(0.5);
    actor.getProperty().setColor(...color);
    renderer.addActor(actor);
  };

  addSphere([-0.25, 0.0, 0.0], [0.9, 0.2, 0.2]);
  addSphere([0.25, 0.0, 0.3], [0.2, 0.6, 0.9]);

  const apiView = gc.registerResource(
    renderWindow.newAPISpecificView('WebGPU')
  );
  apiView.setContainer(renderWindowContainer);
  renderWindow.addView(apiView);
  apiView.setSize(SIZE, SIZE);

  // Fixed camera so the two renders below are directly comparable.
  renderer.resetCamera();

  return { apiView, renderWindow, renderer };
}

function getTranslucentPass(apiView) {
  return apiView.getRenderPasses()[0].getTranslucentPass();
}

function renderAndCapture(apiView, renderWindow) {
  const promise = apiView.captureNextImage();
  renderWindow.render();
  return promise;
}

function pixelAt(imageData, x, y) {
  const offset = (y * imageData.width + x) * 4;
  return Array.from(imageData.data.slice(offset, offset + 4));
}

function channelDistance(a, b) {
  return Math.max(
    Math.abs(a[0] - b[0]),
    Math.abs(a[1] - b[1]),
    Math.abs(a[2] - b[2])
  );
}

// Fraction of pixels that differ between two renders of the same scene.
function mismatchFraction(a, b, threshold = 8) {
  let differing = 0;
  for (let i = 0; i < a.data.length; i += 4) {
    const pa = [a.data[i], a.data[i + 1], a.data[i + 2]];
    const pb = [b.data[i], b.data[i + 1], b.data[i + 2]];
    if (channelDistance(pa, pb) > threshold) {
      differing++;
    }
  }
  return differing / (a.width * a.height);
}

// ----------------------------------------------------------------------------
// Test: the OIT pass composites from the resolved (single sample) textures
// ----------------------------------------------------------------------------

it.skipIf(!__VTK_TEST_WEBGPU__)(
  'Test WebGPU OIT composites from resolved textures when MSAA is enabled',
  async () => {
    const gc = testUtils.createGarbageCollector();
    const { apiView, renderWindow } = buildTranslucentScene(gc);

    try {
      expect(apiView.setMultiSample(4), 'multiSample 4 accepted').not.toBe(
        false
      );

      const image = await renderAndCapture(apiView, renderWindow);
      const translucentPass = getTranslucentPass(apiView);

      expect(
        translucentPass,
        'translucent pass ran for translucent actors'
      ).toBeTruthy();

      const resolveColor = translucentPass.getTranslucentResolveColorTexture();
      const resolveAccum =
        translucentPass.getTranslucentResolveAccumulateTexture();

      expect(resolveColor, 'color resolve target allocated').toBeTruthy();
      expect(resolveAccum, 'accumulate resolve target allocated').toBeTruthy();

      // The compositing quad samples the OIT buffers with textureLoad, which
      // is only legal on a single sampled texture. Reading the multisampled
      // attachments directly would be a WebGPU validation error.
      expect(
        resolveColor.getSampleCount(),
        'color resolve is single sample'
      ).toBe(1);
      expect(
        resolveAccum.getSampleCount(),
        'accumulate resolve is single sample'
      ).toBe(1);

      const quadViews = translucentPass.getFullScreenQuad().getTextureViews();
      expect(
        quadViews.map((view) => view.getTexture()),
        'full screen quad reads the resolve targets'
      ).toEqual([resolveColor, resolveAccum]);

      // A mismatch between the pipelines and the multisampled attachments
      // invalidates the whole command buffer, so nothing reaches the canvas
      // and the capture comes back fully transparent.
      const imageData = await testUtils.getImageDataFromURI(image);
      const center = pixelAt(imageData, SIZE / 2, SIZE / 2);
      expect(center[3], `the frame was rendered (got ${center})`).toBe(255);

      // A broken resolve would leave the compositing quad sampling empty
      // textures, which shows up as an untouched background.
      const background = BACKGROUND.map((c) => Math.round(c * 255));
      expect(
        channelDistance(center, background),
        `translucent geometry composited over the background (got ${center})`
      ).toBeGreaterThan(20);
    } finally {
      gc.releaseResources();
    }
  }
);

// ----------------------------------------------------------------------------
// Test: MSAA anti-aliases the silhouettes without changing the OIT result
// ----------------------------------------------------------------------------

it.skipIf(!__VTK_TEST_WEBGPU__)(
  'Test WebGPU OIT with MSAA preserves the blended result',
  async () => {
    const gc = testUtils.createGarbageCollector();
    const { apiView, renderWindow } = buildTranslucentScene(gc);

    try {
      apiView.setMultiSample(1);
      const plainImage = await renderAndCapture(apiView, renderWindow);

      apiView.setMultiSample(4);
      const msaaImage = await renderAndCapture(apiView, renderWindow);

      const plain = await testUtils.getImageDataFromURI(plainImage);
      const msaa = await testUtils.getImageDataFromURI(msaaImage);

      // Interior pixels are fully covered in both renders, so the resolved
      // OIT result there must match the non-MSAA one.
      const samples = [
        [SIZE / 2, SIZE / 2],
        [SIZE / 2, SIZE / 3],
        [SIZE / 3, SIZE / 2],
      ];
      samples.forEach(([x, y]) => {
        const distance = channelDistance(
          pixelAt(plain, x, y),
          pixelAt(msaa, x, y)
        );
        expect(
          distance,
          `interior pixel (${x}, ${y}) matches the non-MSAA render`
        ).toBeLessThan(12);
      });

      // ... but the silhouettes are smoothed, so the images are not identical
      // and differ only on a small band of edge pixels.
      const fraction = mismatchFraction(plain, msaa);
      expect(fraction, 'MSAA changed the silhouette pixels').toBeGreaterThan(0);
      expect(
        fraction,
        'MSAA only changed edge pixels, not the whole image'
      ).toBeLessThan(0.15);
    } finally {
      gc.releaseResources();
    }
  }
);

// ----------------------------------------------------------------------------
// Test: turning MSAA off rebuilds the pass without resolve targets
// ----------------------------------------------------------------------------

it.skipIf(!__VTK_TEST_WEBGPU__)(
  'Test WebGPU OIT releases resolve textures when MSAA is disabled',
  async () => {
    const gc = testUtils.createGarbageCollector();
    const { apiView, renderWindow } = buildTranslucentScene(gc);

    try {
      apiView.setMultiSample(4);
      await renderAndCapture(apiView, renderWindow);
      expect(
        getTranslucentPass(apiView).getTranslucentResolveColorTexture(),
        'resolve target allocated while MSAA is on'
      ).toBeTruthy();

      apiView.setMultiSample(1);
      await renderAndCapture(apiView, renderWindow);

      const translucentPass = getTranslucentPass(apiView);
      expect(
        translucentPass.getTranslucentResolveColorTexture(),
        'color resolve target released'
      ).toBe(null);
      expect(
        translucentPass.getTranslucentResolveAccumulateTexture(),
        'accumulate resolve target released'
      ).toBe(null);

      // Back on the single sample path the quad reads the attachments directly.
      const quadViews = translucentPass.getFullScreenQuad().getTextureViews();
      expect(quadViews.length, 'quad still bound to two OIT buffers').toBe(2);
      expect(
        quadViews.every((view) => view.getTexture().getSampleCount() === 1),
        'quad reads single sample attachments'
      ).toBe(true);
    } finally {
      gc.releaseResources();
    }
  }
);
