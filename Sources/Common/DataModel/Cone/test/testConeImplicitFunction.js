import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkCone from 'vtk.js/Sources/Common/DataModel/Cone';
import vtkSampleFunction from 'vtk.js/Sources/Imaging/Hybrid/SampleFunction';
import vtkImageMarchingCubes from 'vtk.js/Sources/Filters/General/ImageMarchingCubes';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';

import baseline from './testConeImplicitFunction.png';

test.onlyIfWebGL('Test Cone Implicit Function', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'Cone Implicit Function');

  // Create some control UI
  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);

  // Rendering stuff
  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const renderer = gc.registerResource(vtkRenderer.newInstance());
  renderWindow.addRenderer(renderer);
  renderer.setBackground(0.32, 0.34, 0.43);

  // Pipeline
  const cone = gc.registerResource(vtkCone.newInstance({ angle: 12.0 }));
  const sample = gc.registerResource(
    vtkSampleFunction.newInstance({
      implicitFunction: cone,
      sampleDimensions: [50, 50, 50],
      modelBounds: [-1, 1, -1, 1, -1, 1],
    })
  );
  const mCubes = gc.registerResource(
    vtkImageMarchingCubes.newInstance({ contourValue: 0.0 })
  );
  mCubes.setInputConnection(sample.getOutputPort());

  const mapper = gc.registerResource(vtkMapper.newInstance());
  mapper.setInputConnection(mCubes.getOutputPort());

  const actor = gc.registerResource(vtkActor.newInstance());
  actor.setMapper(mapper);

  renderer.addActor(actor);

  // now create something to view it, in this case webgl
  const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  renderWindow.render();

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline],
      'Common/DataModel/Cone/testConeImplicitFunction',
      t,
      1.0,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
