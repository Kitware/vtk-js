import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import Constants from 'vtk.js/Sources/Rendering/Core/VolumeMapper/Constants';

import baseline from './testMaximumIntensityProjection.png';

test('Test Maximum Intensity Projection Volume Rendering', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkVolumeMapper MIP');
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
  mapper.setBlendMode(Constants.BlendMode.MAXIMUM_INTENSITY_BLEND);

  actor.setMapper(mapper);

  const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });

  // create color and opacity transfer functions
  const ctfun = vtkColorTransferFunction.newInstance();
  ctfun.addRGBPoint(-3024, 0, 0, 0);
  ctfun.addRGBPoint(-637.62, 1, 1, 1);
  ctfun.addRGBPoint(700, 1, 1, 1);
  ctfun.addRGBPoint(3071, 1, 1, 1);
  ctfun.setMappingRange(500, 3000);

  const ofun = vtkPiecewiseFunction.newInstance();
  ofun.addPoint(-3024, 0);
  ofun.addPoint(-637.62, 0);
  ofun.addPoint(700, 0.5);
  ofun.addPoint(3071, 0.9);

  actor.getProperty().setRGBTransferFunction(0, ctfun);
  actor.getProperty().setScalarOpacity(0, ofun);
  actor.getProperty().setScalarOpacityUnitDistance(0, 4.5);
  actor.getProperty().setInterpolationTypeToFastLinear();

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

  reader.setUrl(`${__BASE_PATH__}/Data/volume/headsq.vti`).then(() => {
    reader.loadData().then(() => {
      renderer.addVolume(actor);
      renderer.resetCamera();

      glwindow.captureNextImage().then((image) => {
        testUtils.compareImages(
          image,
          [baseline],
          'Rendering/Core/VolumeMapper/testMaximumIntensityProjection',
          t,
          1.5,
          gc.releaseResources
        );
      });
      renderWindow.render();
    });
  });
});
