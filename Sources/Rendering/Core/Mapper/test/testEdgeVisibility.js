import test from 'tape-catch';

import vtkOpenGLRenderWindow from '../../../../Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from '../../../../Rendering/Core/RenderWindow';
import vtkRenderer from '../../../../Rendering/Core/Renderer';
import vtkSphereSource from '../../../../Filters/Sources/SphereSource';
import vtkActor from '../../../../Rendering/Core/Actor';
import vtkMapper from '../../../../Rendering/Core/Mapper';

import baseline from './testEdgeVisibility.png';
import testUtils from '../../../../Testing/testUtils';

test.onlyIfWebGL('Test Edge Visibility', (t) => {
  t.ok('rendering', 'vtkMapper EdgeVisibility');

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
  actor.getProperty().setEdgeVisibility(true);
  actor.getProperty().setEdgeColor(1.0, 0.5, 0.5);
  renderer.addActor(actor);

  const mapper = vtkMapper.newInstance();
  actor.setMapper(mapper);

  const sphereSource = vtkSphereSource.newInstance();
  mapper.setInputConnection(sphereSource.getOutputPort());

  // now create something to view it, in this case webgl
  const glwindow = vtkOpenGLRenderWindow.newInstance();
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  const image = glwindow.captureImage();

  testUtils.compareImages(image, [baseline], 'Rendering/Core/Mapper/', t);
});
