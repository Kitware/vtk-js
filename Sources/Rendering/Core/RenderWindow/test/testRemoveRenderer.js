import test from 'tape-catch';

import vtkOpenGLRenderWindow from '../../../../Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from '../../../../Rendering/Core/RenderWindow';
import vtkRenderer from '../../../../Rendering/Core/Renderer';
import vtkConeSource from '../../../../Filters/Sources/ConeSource';
import vtkActor from '../../../../Rendering/Core/Actor';
import vtkMapper from '../../../../Rendering/Core/Mapper';

import beforeBaseline from './testBeforeRendererRemoved.png';
import afterBaseline from './testAfterRendererRemoved.png';
import testUtils from '../../../../Testing/testUtils';

test.onlyIfWebGL('Test RenderWindow removeRenderer', (t) => {
  const gc = testUtils.createGarbageCollector(t);

  // Create some control UI
  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(document.createElement('div'));
  container.appendChild(renderWindowContainer);

  // create what we will view
  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const renderer = gc.registerResource(vtkRenderer.newInstance());
  renderWindow.addRenderer(renderer);
  renderer.setBackground(0.32, 0.34, 0.43);
  const actor = gc.registerResource(vtkActor.newInstance());
  renderer.addActor(actor);
  const mapper = gc.registerResource(vtkMapper.newInstance());
  actor.setMapper(mapper);
  const coneSource = gc.registerResource(vtkConeSource.newInstance({ height: 1.0 }));
  mapper.setInputConnection(coneSource.getOutputPort());

  // now create something to view it, in this case webgl
  const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);
  const beforeImage = glwindow.captureImage();

  function removeRenderer() {
    renderWindow.removeRenderer(renderer);
    renderWindow.render();
    const afterImage = glwindow.captureImage();
    testUtils.compareImages(afterImage, [afterBaseline], 'Rendering/Core/RenderWindow/', t, 5, gc.releaseResources);
  }

  testUtils.compareImages(beforeImage, [beforeBaseline], 'Rendering/Core/RenderWindow/', t, 5, removeRenderer);
});
