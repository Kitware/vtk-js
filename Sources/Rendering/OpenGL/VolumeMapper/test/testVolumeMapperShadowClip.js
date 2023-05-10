import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';

import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkLight from 'vtk.js/Sources/Rendering/Core/Light';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkPlane from 'vtk.js/Sources/Common/DataModel/Plane';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';

import baseline from './testVolumeMapperShadowClip.png';

// Test the volume mapper with clipping combined with volumetric scattering
// This tests that the rays cast for volumetric shadow calculation ignore clipped voxels.
test.onlyIfWebGL('Test Volume Mapper Shadow Clip', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkVolumeMapper Shadow Clip');

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
  // renderer.setBackground(0.32, 0.34, 0.43);

  const actor = gc.registerResource(vtkVolume.newInstance());

  const mapper = gc.registerResource(vtkVolumeMapper.newInstance());
  mapper.setSampleDistance(0.5);
  actor.setMapper(mapper);

  const imDims = [200, 200, 200];
  const im = gc.registerResource(vtkImageData.newInstance());
  im.setOrigin(0, 0, 0);
  im.setSpacing(1, 1, 1);
  im.setDimensions(imDims);
  const fptr = new Float32Array(1 * imDims[0] * imDims[1] * imDims[2]);
  fptr.fill(0.0);
  for (let k = 0; k < imDims[2]; ++k) {
    for (let j = 0; j < imDims[1]; ++j) {
      for (let i = 0; i < imDims[0]; ++i) {
        let val = 0.0;
        if (i < 50) {
          val = 255;
        } else if (i > 150 && j > 50 && j < 150 && k > 100 && k < 180) {
          val = 100;
        }
        fptr[k * (imDims[1] * imDims[0]) + j * imDims[0] + i] = val;
      }
    }
  }
  const farray = vtkDataArray.newInstance({
    numberOfComponents: 1,
    values: fptr,
  });
  im.getPointData().setScalars(farray);

  mapper.setInputData(im);
  mapper.setComputeNormalFromOpacity(true);
  mapper.setVolumetricScatteringBlending(1.0);
  mapper.setGlobalIlluminationReach(1.0);

  const clipPlane = vtkPlane.newInstance();
  clipPlane.setNormal(-0.5, -0.5, 1);
  clipPlane.setOrigin([150, 150, 150]);
  mapper.addClippingPlane(clipPlane);

  // create color and opacity transfer functions
  const ctfun = gc.registerResource(vtkColorTransferFunction.newInstance());
  ctfun.addRGBPoint(0, 1, 1, 1);
  ctfun.addRGBPoint(255, 1, 1, 1);
  const ofun = gc.registerResource(vtkPiecewiseFunction.newInstance());
  ofun.addPoint(0, 0);
  ofun.addPoint(255, 1);
  actor.getProperty().setRGBTransferFunction(0, ctfun);
  actor.getProperty().setScalarOpacity(0, ofun);
  actor.getProperty().setAmbient(0.5);
  actor.getProperty().setShade(1);

  // now create something to view it
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  // Interactor
  const interactor = gc.registerResource(
    vtkRenderWindowInteractor.newInstance()
  );
  interactor.setStillUpdateRate(0.01);
  interactor.setView(glwindow);
  interactor.initialize();
  interactor.bindEvents(renderWindowContainer);

  renderer.addVolume(actor);
  actor.getProperty().setInterpolationTypeToLinear();

  renderer.removeAllLights();
  const light = vtkLight.newInstance();
  const lightPos = [400, 100, 150];
  light.setPositional(true);
  light.setLightType('SceneLight');
  light.setPosition(lightPos);
  light.setFocalPoint(100, 100, 100);
  light.setColor(1, 1, 1);
  light.setIntensity(1.0);
  light.setConeAngle(50.0);
  renderer.addLight(light);

  renderer.resetCamera();
  const cam = renderer.getActiveCamera();
  cam.roll(45);
  cam.elevation(90);
  cam.roll(45);
  renderer.resetCameraClippingRange();

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline],
      'Rendering/Core/VolumeMapper/testVolumeMapperClip',
      t,
      1.5,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
