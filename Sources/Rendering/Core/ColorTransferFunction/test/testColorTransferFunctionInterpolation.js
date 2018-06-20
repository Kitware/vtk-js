import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';

import colorMaps from '../ColorMaps.json';

import createScalarMap from './createScalarMap';
import baseline from './testColorTransferFunctionInterpolation.png';

test.onlyIfWebGL('Test Interpolate Scalars Before Colors', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkOpenGLPolyDataMapper ColorTransferFunction Presets');

  // testUtils.keepDOM();

  // Create some control UI
  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);

  // create what we will view
  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const renderer = gc.registerResource(vtkRenderer.newInstance());
  renderWindow.addRenderer(renderer);
  renderer.setBackground(0.0, 0.0, 0.0);

  // ---- magic flag underneath
  const preset = colorMaps.find((p) => p.Name === 'Cool to Warm');
  const actor = createScalarMap(0, 0, preset, gc, 0, 10000);
  actor.getMapper().setScalarRange(0, 10000);
  // console.log('preset', JSON.stringify(preset, null, 2));
  // ---- end

  renderer.addActor(actor);
  renderer.addActor(createScalarMap(0.5, 0, preset, gc));

  // now create something to view it, in this case webgl
  const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 500);

  renderer.resetCamera();
  renderWindow.render();

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline],
      'Rendering/Core/ColorTransferFunction/testColorTransferFunctionInterpolation',
      t,
      5,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
