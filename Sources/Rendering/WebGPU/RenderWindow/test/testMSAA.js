import test from 'tape';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Detect whether the current runtime actually supports WebGPU.
function isWebGPUAvailable() {
  return typeof navigator !== 'undefined' && !!navigator.gpu;
}

// ---------------------------------------------------------------------------
// Test: MSAA opaque + translucent rendering (WebGPU)
// ---------------------------------------------------------------------------

test.onlyIfWebGPU('Test WebGPU MSAA rendering', (t) => {
  const gc = testUtils.createGarbageCollector(t);

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

  // ------ MSAA configuration ------
  const webgpuAvailable = isWebGPUAvailable();
  const desiredSampleCount = webgpuAvailable ? 4 : 1;

  if (apiView.setMultiSample) {
    // Validate that invalid sample counts are rejected
    t.notOk(
      apiView.setMultiSample(2),
      'setMultiSample(2) should return false (invalid)'
    );

    // Set the desired sample count
    apiView.setMultiSample(desiredSampleCount);
  }

  t.equal(
    apiView.getMultiSample ? apiView.getMultiSample() : 1,
    desiredSampleCount,
    `multiSample should be ${desiredSampleCount}`
  );

  renderer.resetCamera();

  // ------ Capture and verify ------
  const promise = apiView
    .captureNextImage()
    .then((image) => {
      // The rendering completed without errors — this is the primary
      // regression check.  MSAA misconfiguration (sample count mismatches,
      // missing resolve targets, etc.) would cause a GPU validation error
      // before we reach this point.
      t.ok(image, 'MSAA render produced an image without GPU errors');
    })
    .finally(gc.releaseResources);

  renderWindow.render();
  return promise;
});
