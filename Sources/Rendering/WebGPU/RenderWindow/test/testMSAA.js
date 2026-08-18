import { it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';

// ---------------------------------------------------------------------------
// Test: multiSample validation
// ---------------------------------------------------------------------------

it.skipIf(!__VTK_TEST_WEBGPU__)(
  'Test WebGPU multiSample only accepts 1 and 4',
  () => {
    const gc = testUtils.createGarbageCollector();
    const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
    const apiView = gc.registerResource(
      renderWindow.newAPISpecificView('WebGPU')
    );

    try {
      expect(apiView.getMultiSample(), 'MSAA is off by default').toBe(1);
      expect(apiView.setMultiSample(2), 'multiSample 2 rejected').toBe(false);
      expect(apiView.setMultiSample(3), 'multiSample 3 rejected').toBe(false);
      expect(apiView.getMultiSample(), 'rejected values are ignored').toBe(1);
      expect(apiView.setMultiSample(4), 'multiSample 4 accepted').not.toBe(
        false
      );
      expect(apiView.getMultiSample(), 'multiSample updated to 4').toBe(4);
    } finally {
      gc.releaseResources();
    }
  }
);

// ---------------------------------------------------------------------------
// Test: MSAA opaque + translucent rendering
// ---------------------------------------------------------------------------

it.skipIf(!__VTK_TEST_WEBGPU__)('Test WebGPU MSAA rendering', async () => {
  const gc = testUtils.createGarbageCollector();

  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);

  // ------ Scene setup ------
  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const renderer = gc.registerResource(vtkRenderer.newInstance());
  renderWindow.addRenderer(renderer);
  renderer.setBackground(0.32, 0.34, 0.43);

  // Opaque cone
  const coneSource = gc.registerResource(
    vtkConeSource.newInstance({ height: 1.0, resolution: 60 })
  );
  const coneMapper = gc.registerResource(vtkMapper.newInstance());
  coneMapper.setInputConnection(coneSource.getOutputPort());
  const coneActor = gc.registerResource(vtkActor.newInstance());
  coneActor.setMapper(coneMapper);
  renderer.addActor(coneActor);

  // Translucent sphere (exercises OrderIndependentTranslucentPass MSAA path)
  const sphereSource = gc.registerResource(
    vtkSphereSource.newInstance({ radius: 0.35, center: [0.3, 0.3, 0.0] })
  );
  const sphereMapper = gc.registerResource(vtkMapper.newInstance());
  sphereMapper.setInputConnection(sphereSource.getOutputPort());
  const sphereActor = gc.registerResource(vtkActor.newInstance());
  sphereActor.setMapper(sphereMapper);
  sphereActor.getProperty().setOpacity(0.5);
  sphereActor.getProperty().setColor(0.2, 0.6, 0.9);
  renderer.addActor(sphereActor);

  // ------ Render window view ------
  const apiView = gc.registerResource(
    renderWindow.newAPISpecificView('WebGPU')
  );
  apiView.setContainer(renderWindowContainer);
  renderWindow.addView(apiView);
  apiView.setSize(400, 400);
  apiView.setMultiSample(4);

  renderer.resetCamera();

  try {
    const promise = apiView.captureNextImage();
    renderWindow.render();
    const image = await promise;

    // The rendering completed without errors — this is the primary regression
    // check. MSAA misconfiguration (sample count mismatches, missing resolve
    // targets, etc.) would cause a GPU validation error before we get here.
    expect(
      image,
      'MSAA render produced an image without GPU errors'
    ).toBeTruthy();
  } finally {
    gc.releaseResources();
  }
});
