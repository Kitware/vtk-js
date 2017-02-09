import test      from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkOpenGLRenderWindow  from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow        from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer            from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkPointSource         from 'vtk.js/Sources/Filters/Sources/PointSource';
import vtkActor               from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper              from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkMath                from 'vtk.js/Sources/Common/Core/Math';

import basepoint from './testPointSource.png';

test.onlyIfWebGL('Test vtkPointSource Rendering', (t) => {
  t.ok('rendering', 'vtkPointSource Rendering');

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
  actor.getProperty().setPointSize(5);
  renderer.addActor(actor);

  const mapper = vtkMapper.newInstance();
  actor.setMapper(mapper);

  const PointSource = vtkPointSource.newInstance({ numberOfPoints: 125, radius: 0.75 });
  vtkMath.randomSeed(141592);
  PointSource.update();
  mapper.setInputConnection(PointSource.getOutputPort());

  // now create something to view it, in this case webgl
  const glwindow = vtkOpenGLRenderWindow.newInstance();
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  const image = glwindow.captureImage();

  testUtils.compareImages(image, [basepoint], 'Filters/Sources/PointSource/', t, 0.02);
});
