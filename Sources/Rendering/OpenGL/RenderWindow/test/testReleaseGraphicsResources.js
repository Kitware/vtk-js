import { it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';
import {
  createConeActor,
  createTrackedRenderView,
} from 'vtk.js/Sources/Testing/renderTestUtils';

import vtkForwardPass from 'vtk.js/Sources/Rendering/OpenGL/ForwardPass';

it.skipIf(__VTK_TEST_NO_WEBGL__)(
  'deletes the view when a render pass was deleted first',
  () => {
    const gc = testUtils.createGarbageCollector();
    const { renderer, renderWindow, view } = createTrackedRenderView(gc);

    const pass = vtkForwardPass.newInstance();
    view.setRenderPasses([pass]);
    renderer.addActor(createConeActor(gc, { opacity: 0.5 }));
    renderer.resetCamera();
    renderWindow.render();

    // An application that owns its passes may tear them down before the view.
    pass.delete();

    expect(() => gc.releaseResources()).not.toThrow();
  }
);

// A child render window has no context of its own: it draws through the
