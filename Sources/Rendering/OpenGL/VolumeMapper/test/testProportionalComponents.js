import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import { OpacityMode } from 'vtk.js/Sources/Rendering/Core/VolumeProperty/Constants';

import baseline1 from './testProportionalComponents.png';

test.onlyIfWebGL('Test Volume Rendering with Proportional Component', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkOpenGLVolumeMapper ProportionalComponent');
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

  // create a synthetic volume
  const id = vtkImageData.newInstance();
  id.setExtent(0, 99, 0, 99, 0, 99);

  const arrayData = new Int16Array(100 * 100 * 100 * 2);

  const baseValue = 40.0;
  const xOffset = 3.0;
  const xDiv = 5.0;
  const yDiv = 2.5;
  const zDiv = 1.25;

  const radius = 45;
  const center = [50, 50, 50];

  let i = 0;
  for (let z = 0; z <= 99; z++) {
    for (let y = 0; y <= 99; y++) {
      for (let x = 0; x <= 99; x++) {
        const dist = Math.sqrt(
          (x - center[0]) ** 2 + (y - center[1]) ** 2 + (z - center[2]) ** 2
        );
        if (dist < radius) {
          arrayData[i * 2] =
            baseValue *
            (xOffset +
              Math.cos(x / xDiv) +
              Math.cos(y / yDiv) +
              Math.cos(z / zDiv));
          let labelValue = 0;
          if (x > center[0] && y > center[1]) {
            labelValue = 1;
          } else if (x > center[0] && y < center[1]) {
            labelValue = 2;
          } else if (x < center[0] && y > center[1]) {
            labelValue = 3;
          } else if (x < center[0] && y < center[1]) {
            labelValue = 4;
          }
          arrayData[i * 2 + 1] = labelValue;
        } else {
          arrayData[i * 2] = 0.0;
          arrayData[i * 2 + 1] = 0;
        }
        i += 1;
      }
    }
  }

  const da = vtkDataArray.newInstance({
    numberOfComponents: 2,
    values: arrayData,
  });
  da.setName('scalars');

  const intensityRange = da.getRange(0);
  const labelRange = da.getRange(1);

  const cpd = id.getPointData();
  cpd.setScalars(da);

  mapper.setInputData(id);

  // create color and opacity transfer functions
  const ctfun = vtkColorTransferFunction.newInstance();
  ctfun.addRGBPoint(0, 0.0, 0.0, 0.0);
  ctfun.addRGBPoint(255.0, 1.0, 1.0, 1.0);
  ctfun.setMappingRange(...intensityRange);
  const ofun = vtkPiecewiseFunction.newInstance();
  ofun.addPoint(0.0, 0.0);
  ofun.addPoint(250.0, 0.2);
  actor.getProperty().setRGBTransferFunction(0, ctfun);
  actor.getProperty().setScalarOpacity(0, ofun);
  actor.getProperty().setScalarOpacityUnitDistance(0, 3.0);
  actor.getProperty().setComponentWeight(0, 0.5);
  actor.getProperty().setUseGradientOpacity(0, true);

  const labelMapRgbPoints = [
    [0, 0.0, 0.0, 0.0, 0.5, 1.0],
    [1, 0.0, 0.0, 1.0, 0.5, 1.0],
    [2, 0.0, 1.0, 0.0, 0.5, 1.0],
    [3, 1.0, 0.0, 0.0, 0.5, 1.0],
    [4, 1.0, 0.5, 0.0, 0.5, 1.0],
  ];
  const labelMapCtFun = vtkColorTransferFunction.newInstance();
  labelMapRgbPoints.forEach((rgbPoint) => {
    labelMapCtFun.addRGBPointLong(...rgbPoint);
  });
  labelMapCtFun.setMappingRange(...labelRange);

  const labelMapPwfPoints = [
    [0, 0.0, 0.5, 1.0],
    [1, 0.8, 0.5, 1.0],
    [2, 0.6, 0.5, 1.0],
    [3, 0.0, 0.5, 1.0],
    [4, 1.0, 0.5, 1.0],
  ];
  const labelMapPwf = vtkPiecewiseFunction.newInstance();
  labelMapPwfPoints.forEach((pwfPoint) => {
    labelMapPwf.addPointLong(...pwfPoint);
  });

  actor.getProperty().setRGBTransferFunction(1, labelMapCtFun);
  actor.getProperty().setScalarOpacity(1, labelMapPwf);
  actor.getProperty().setScalarOpacityUnitDistance(1, 3.0);
  actor.getProperty().setComponentWeight(1, 0.8);
  actor.getProperty().setOpacityMode(1, OpacityMode.PROPORTIONAL);

  actor.getProperty().setIndependentComponents(true);

  // now create something to view it, in this case webgl
  const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  // Interactor
  const interactor = vtkRenderWindowInteractor.newInstance();
  interactor.setStillUpdateRate(0.01);
  interactor.setView(glwindow);
  interactor.initialize();
  interactor.bindEvents(renderWindowContainer);

  renderer.addVolume(actor);
  renderer.resetCamera();
  renderer.getActiveCamera().setPosition(45.0, 45.0, 240.0);
  renderer.getActiveCamera().setFocalPoint(center[0], center[1], center[2]);
  renderer.resetCameraClippingRange();

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline1],
      'Rendering/OpenGL/VolumeMapper/testProportionalComponents',
      t,
      1.5,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
