import test from 'tape-catch';

import vtkOpenGLRenderWindow from '../../../../Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from '../../../../Rendering/Core/RenderWindow';
import vtkRenderer from '../../../../Rendering/Core/Renderer';
import vtkConeSource from '../../../../Filters/Sources/ConeSource';
import vtkActor from '../../../../Rendering/Core/Actor';
import vtkMapper from '../../../../Rendering/Core/Mapper';

import resemble from 'resemblejs';
import baseline from './baseline.png';

/* global document */

test('Test vtkConeSource Rendering', (t) => {
  t.ok('rendering', 'vtkConeSource Rendering');

  // Create some control UI
  const container = document.querySelector('body');
  const renderWindowContainer = document.createElement('div');
  container.appendChild(renderWindowContainer);

  // create what we will view
  const renderWindow = vtkRenderWindow.newInstance();
  const renderer = vtkRenderer.newInstance();
  renderWindow.addRenderer(renderer);
  renderer.setBackground(0.32, 0.34, 0.43);

  const actor = vtkActor.newInstance();
  renderer.addActor(actor);

  const mapper = vtkMapper.newInstance();
  actor.setMapper(mapper);

  const coneSource = vtkConeSource.newInstance({ height: 1.0 });
  mapper.setInputConnection(coneSource.getOutputPort());

  // now create something to view it, in this case webgl
  const glwindow = vtkOpenGLRenderWindow.newInstance();
  glwindow.setSize(400, 400);
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);

  const images = renderWindow.captureImages();
  t.equal(images.length, 1, 'Should only have 1 captured image');

  resemble(baseline).compareTo(images[0]).onComplete(data => {
    console.log(data);
    t.ok(data.misMatchPercentage < 1, `Matching image - delta ${data.misMatchPercentage}%`);
    t.ok(data.isSameDimensions, 'Image match resolution');
    t.end();
  });
});
