import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';

import colorMaps from '../ColorMaps.json';

import createScalarMap from './createScalarMap';
import baseline from './testColorTransferFunctionPresets.png';

const MAX_NUMBER_OF_PRESETS = 200;
const NUMBER_PER_LINE = 20;

test.onlyIfWebGL('Test Interpolate Scalars Before Colors', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkOpenGLPolyDataMapper ColorTransferFunction Presets');

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

  // Add one with default LUT
  // renderer.addActor(createScalarMap(0, 0));

  let count = 0;
  colorMaps.forEach((preset, idx) => {
    if (preset.RGBPoints && count < MAX_NUMBER_OF_PRESETS) {
      const i = count % NUMBER_PER_LINE;
      const j = Math.floor(count / NUMBER_PER_LINE);
      renderer.addActor(createScalarMap(i * 0.5, j * 1.25, preset, gc));
      count += 1;
    }
  });

  // now create something to view it, in this case webgl
  const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(
    50 * NUMBER_PER_LINE,
    150 * Math.floor(count / NUMBER_PER_LINE)
  );

  const camera = renderer.getActiveCamera();
  renderer.resetCamera();
  camera.zoom(1.45);
  renderWindow.render();

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline],
      'Rendering/Core/ColorTransferFunction/testColorTransferFunctionPresets',
      t,
      4.8,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
