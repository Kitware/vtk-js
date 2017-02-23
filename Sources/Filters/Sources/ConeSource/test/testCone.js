import test      from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkOpenGLRenderWindow  from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow        from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer            from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkConeSource          from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkActor               from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper              from 'vtk.js/Sources/Rendering/Core/Mapper';

import baseline from './testCone.png';

test.onlyIfWebGL('Test vtkConeSource Rendering', (t) => {
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

  testUtils.compareImages(image, [baseline], 'Filters/Sources/ConeSource/testCone', t, 2.5);
});
