import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkImageGridSource from 'vtk.js/Sources/Filters/Sources/ImageGridSource';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';

import vtkOrientationMarkerWidget from 'vtk.js/Sources/Interaction/Widgets/OrientationMarkerWidget';
import vtkAnnotatedCubeActor from 'vtk.js/Sources/Rendering/Core/AnnotatedCubeActor';

import baseline1 from './testIntermixedImage.png';
// import baseline2 from './testIntermixedImage_1.png';

test('Test Composite Volume Rendering: intermixed image', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkVolumeMapper IntermixedImage');
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
  renderer.setBackground(0.32, 0.3, 0.43);

  const volume = gc.registerResource(vtkVolume.newInstance());

  const vmapper = gc.registerResource(vtkVolumeMapper.newInstance());
  vmapper.setSampleDistance(0.7);
  volume.setMapper(vmapper);

  const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
  // create color and opacity transfer functions
  const ctfun = vtkColorTransferFunction.newInstance();
  ctfun.addRGBPoint(0, 85 / 255.0, 0, 0);
  ctfun.addRGBPoint(95, 1.0, 1.0, 1.0);
  ctfun.addRGBPoint(225, 0.66, 0.66, 0.5);
  ctfun.addRGBPoint(255, 0.3, 1.0, 0.5);
  const ofun = vtkPiecewiseFunction.newInstance();
  ofun.addPoint(0.0, 0.0);
  ofun.addPoint(255.0, 1.0);
  volume.getProperty().setRGBTransferFunction(0, ctfun);
  volume.getProperty().setScalarOpacity(0, ofun);
  volume.getProperty().setScalarOpacityUnitDistance(0, 3.0);
  volume.getProperty().setInterpolationTypeToFastLinear();

  vmapper.setInputConnection(reader.getOutputPort());

  // now create something to view it
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  const gridSource = gc.registerResource(vtkImageGridSource.newInstance());
  gridSource.setDataExtent(0, 200, 0, 200, 0, 0);
  gridSource.setGridSpacing(16, 16, 0);
  gridSource.setGridOrigin(8, 8, 0);
  gridSource.setDataDirection(0.866, 0.5, 0, -0.5, 0.866, 0, 0, 0, 1);

  const imapper = gc.registerResource(vtkImageMapper.newInstance());
  imapper.setInputConnection(gridSource.getOutputPort());

  const iactor = gc.registerResource(vtkImageSlice.newInstance());
  iactor.getProperty().setColorWindow(255);
  iactor.getProperty().setColorLevel(127);
  // iactor.getProperty().setOpacity(0.5); // not supported
  iactor.setMapper(imapper);
  iactor.setPosition(200, 100, 100);
  iactor.rotateX(45);
  renderer.addActor(iactor);

  // Interactor
  const interactor = gc.registerResource(
    vtkRenderWindowInteractor.newInstance()
  );
  interactor.setStillUpdateRate(0.01);
  interactor.setView(glwindow);
  interactor.initialize();
  interactor.bindEvents(renderWindowContainer);
  interactor.setInteractorStyle(
    vtkInteractorStyleTrackballCamera.newInstance()
  );

  // create axes
  const axes = gc.registerResource(vtkAnnotatedCubeActor.newInstance());
  axes.setDefaultStyle({
    text: '+X',
    fontStyle: 'bold',
    fontFamily: 'Arial',
    fontColor: 'black',
    fontSizeScale: (res) => res / 2,
    faceColor: '#0000ff',
    faceRotation: 0,
    edgeThickness: 0.1,
    edgeColor: 'black',
    resolution: 400,
  });
  // axes.setXPlusFaceProperty({ text: '+X' });
  axes.setXMinusFaceProperty({
    text: '-X',
    faceColor: '#ffff00',
    faceRotation: 90,
    fontStyle: 'italic',
  });
  axes.setYPlusFaceProperty({
    text: '+Y',
    faceColor: '#00ff00',
    fontSizeScale: (res) => res / 4,
  });
  axes.setYMinusFaceProperty({
    text: '-Y',
    faceColor: '#00ffff',
    fontColor: 'white',
  });
  axes.setZPlusFaceProperty({
    text: '+Z',
    edgeColor: 'yellow',
  });
  axes.setZMinusFaceProperty({
    text: '-Z',
    faceRotation: 45,
    edgeThickness: 0,
  });

  // create orientation widget
  const orientationWidget = gc.registerResource(
    vtkOrientationMarkerWidget.newInstance({
      actor: axes,
      interactor: renderWindow.getInteractor(),
    })
  );
  orientationWidget.setEnabled(true);
  orientationWidget.setViewportCorner(
    vtkOrientationMarkerWidget.Corners.BOTTOM_RIGHT
  );
  orientationWidget.setViewportSize(0.15);
  orientationWidget.setMinPixelSize(100);
  orientationWidget.setMaxPixelSize(300);

  reader.setUrl(`${__BASE_PATH__}/Data/volume/LIDC2.vti`).then(() => {
    reader.loadData().then(() => {
      renderer.addVolume(volume);
      renderer.resetCamera();
      renderer.getActiveCamera().zoom(1.5);
      renderer.getActiveCamera().elevation(70);
      renderer.getActiveCamera().orthogonalizeViewUp();
      renderer.getActiveCamera().azimuth(-20);
      renderer.resetCameraClippingRange();
      renderWindow.render();

      glwindow.captureNextImage().then((image) => {
        testUtils.compareImages(
          image,
          [baseline1],
          'Rendering/Core/VolumeMapper/testIntermixedImage',
          t,
          5.0,
          gc.releaseResources
        );
      });
      renderWindow.render();
    });
  });
});
