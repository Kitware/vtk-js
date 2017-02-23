import test      from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow       from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer           from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkSphereSource       from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkActor              from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper             from 'vtk.js/Sources/Rendering/Core/Mapper';

import baseline from './testEdgeVisibility.png';

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

  // Free memory
  // glwindow.delete();
  // renderWindow.delete();
  // renderer.delete();
  // mapper.delete();
  // actor.delete();
  container.removeChild(renderWindowContainer);

  testUtils.compareImages(image, [baseline], 'Rendering/Core/Mapper/testEdgeVisibility.js', t, 5);
});
