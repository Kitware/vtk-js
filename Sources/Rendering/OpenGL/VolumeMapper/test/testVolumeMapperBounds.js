import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';

import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';

import baseline1 from './testVolumeMapperBounds.png';

test.onlyIfWebGL('Test Volume Mapper Bounds', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkVolumeMapper Bounds');
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
  renderer.setBackground(0.32, 0.34, 0.43);

  const actor = gc.registerResource(vtkVolume.newInstance());

  const mapper = gc.registerResource(vtkVolumeMapper.newInstance());
  mapper.setSampleDistance(0.7);
  actor.setMapper(mapper);

  const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
  // create color and opacity transfer functions
  const ctfun = vtkColorTransferFunction.newInstance();
  ctfun.addRGBPoint(0, 0, 0, 0);
  ctfun.addRGBPoint(1, 1, 1, 1);
  // const ofun = vtkPiecewiseFunction.newInstance();
  // ofun.addPoint(0.0, 0.0);
  // ofun.addPoint(255.0, 1.0);
  actor.getProperty().setRGBTransferFunction(0, ctfun);
  // actor.getProperty().setScalarOpacity(0, ofun);

  mapper.setInputConnection(reader.getOutputPort());

  // now create something to view it
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  // Interactor
  const interactor = vtkRenderWindowInteractor.newInstance();
  interactor.setStillUpdateRate(0.01);
  interactor.setView(glwindow);
  interactor.initialize();
  interactor.bindEvents(renderWindowContainer);

  reader
    .setUrl(
      'https://kitware.github.io/vtk-js-datasets/data/vti/syntheticSlicesData.vti/'
    )
    .then(() => {
      reader.loadData().then(() => {
        renderer.addVolume(actor);
        actor.getProperty().setInterpolationTypeToNearest();

        renderer.resetCamera();
        renderer.getActiveCamera().elevation(90);

        glwindow.captureNextImage().then((image) => {
          testUtils.compareImages(
            image,
            [baseline1],
            'Rendering/Core/VolumeMapper/testVolumeMapperBounds',
            t,
            1.5,
            gc.releaseResources
          );
        });
        renderWindow.render();
      });
    });
});
