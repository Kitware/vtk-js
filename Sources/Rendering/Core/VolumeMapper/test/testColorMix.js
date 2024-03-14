import test from 'tape';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';
import vtkLight from 'vtk.js/Sources/Rendering/Core/Light';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkVolume from 'vtk.js/Sources/Rendering/Core/Volume';
import vtkVolumeMapper from 'vtk.js/Sources/Rendering/Core/VolumeMapper';
import { ColorMixPreset } from 'vtk.js/Sources/Rendering/Core/VolumeProperty/Constants';

import baselineCustom from './testColorMixCustom.png';
import baselineAdditive from './testColorMixAdditive.png';
import baselineColorize from './testColorMixColorize.png';

test('Test Volume Rendering: custom shader code', async (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkVolumeMapper Custom shader code');

  // Create some control UI
  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);

  // Create what we will view
  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const renderer = gc.registerResource(vtkRenderer.newInstance());
  renderWindow.addRenderer(renderer);
  renderer.setBackground(0.32, 0.3, 0.43);

  const volume = gc.registerResource(vtkVolume.newInstance());

  const vmapper = gc.registerResource(vtkVolumeMapper.newInstance());
  vmapper.setSampleDistance(0.7);
  volume.setMapper(vmapper);

  const reader = gc.registerResource(
    vtkHttpDataSetReader.newInstance({ fetchGzip: true })
  );
  // create color and opacity transfer functions
  const ctfun = gc.registerResource(vtkColorTransferFunction.newInstance());
  ctfun.addRGBPoint(0, 0, 0, 0);
  ctfun.addRGBPoint(95, 1.0, 1.0, 1.0);
  ctfun.addRGBPoint(225, 0.66, 0.66, 0.5);
  ctfun.addRGBPoint(255, 0.3, 0.3, 0.5);
  const ofun = gc.registerResource(vtkPiecewiseFunction.newInstance());
  ofun.addPoint(0.0, 0.0);
  ofun.addPoint(255.0, 1.0);
  volume.getProperty().setRGBTransferFunction(0, ctfun);
  volume.getProperty().setScalarOpacity(0, ofun);
  volume.getProperty().setInterpolationTypeToFastLinear();

  // Create something to view it
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

  await reader.setUrl(`${__BASE_PATH__}/Data/volume/LIDC2.vti`);
  await reader.loadData();
  const imageData = reader.getOutputData(0);

  const array = imageData.getPointData().getArray(0);
  const nComp = 2;
  array.setNumberOfComponents(nComp);
  const oldData = array.getData();
  const newData = new Float32Array(nComp * oldData.length);
  const dims = imageData.getDimensions();
  for (let z = 0; z < dims[2]; ++z) {
    for (let y = 0; y < dims[1]; ++y) {
      for (let x = 0; x < dims[0]; ++x) {
        const iTuple = x + dims[0] * (y + dims[1] * z);
        newData[iTuple * nComp + 0] = oldData[iTuple];
        const isInMask =
          x >= 0.3 * dims[0] &&
          x <= 0.7 * dims[0] &&
          y >= 0.3 * dims[1] &&
          y <= 0.7 * dims[1] &&
          z >= 0.3 * dims[2] &&
          z <= 0.7 * dims[2];
        newData[iTuple * nComp + 1] = isInMask ? 1 : 0;
      }
    }
  }
  array.setData(newData);

  const maskCtfun = gc.registerResource(vtkColorTransferFunction.newInstance());
  maskCtfun.addRGBPoint(0, 0, 0, 0);
  maskCtfun.addRGBPoint(0.9999, 0, 0, 0);
  maskCtfun.addRGBPoint(1, 1, 0, 1);

  const maskOfun = gc.registerResource(vtkPiecewiseFunction.newInstance());
  maskOfun.addPoint(0, 0);
  maskOfun.addPoint(0.9999, 0);
  maskOfun.addPoint(1, 1);

  volume.getProperty().setRGBTransferFunction(1, maskCtfun);
  volume.getProperty().setScalarOpacity(1, maskOfun);

  volume.getProperty().setIndependentComponents(true);
  volume.getProperty().setComponentWeight(0, 1.0);
  volume.getProperty().setComponentWeight(1, 1.0);

  vmapper.setInputData(imageData);

  renderer.addVolume(volume);
  renderer.getActiveCamera().azimuth(90);
  renderer.getActiveCamera().roll(90);
  renderer.getActiveCamera().azimuth(-60);
  renderer.resetCamera();
  renderer.getActiveCamera().zoom(2.5);

  // ----------------------------------------------------------------

  t.comment('testCustomCode');

  volume.getProperty().setColorMixPreset(ColorMixPreset.CUSTOM);
  const mapperViewProp = vmapper.getViewSpecificProperties();
  mapperViewProp.OpenGL = {
    ShaderReplacements: [
      {
        shaderType: 'Fragment',
        originalValue: '//VTK::CustomColorMix',
        replaceFirst: false,
        replacementValue: `
          if (pwfValue1 > 0.5) {
            return vec4(0.0, 1.0, 1.0, 0.1);
          } else {
            mat4 normalMat = computeMat4Normal(posIS, tValue, tstep);
            float opacity0 = pwfValue0;
            #ifdef vtkGradientOpacityOn
              float gof0 = computeGradientOpacityFactor(normalMat[0].a, goscale0, goshift0, gomin0, gomax0);
              opacity0 *= gof0;
            #endif
            tColor0 = applyAllLightning(tColor0, opacity0, posIS, normalMat[0]);
            return vec4(tColor0, opacity0);
          }
        `,
        replaceAll: false,
      },
    ],
  };
  vmapper.modified();

  let testCustomCodeResolve;
  const testCustomCodePromise = new Promise((res) => {
    testCustomCodeResolve = res;
  });

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baselineCustom],
      'Rendering/Core/VolumeMapper/testColorMix',
      t,
      3.0,
      testCustomCodeResolve
    );
  });

  renderWindow.render();
  await testCustomCodePromise;

  // ----------------------------------------------------------------

  t.comment('testAdditiveWithLigting');

  volume.getProperty().setColorMixPreset(ColorMixPreset.ADDITIVE);

  volume.getProperty().setUseGradientOpacity(0, true);
  volume.getProperty().setGradientOpacityMinimumValue(0, 2);
  volume.getProperty().setGradientOpacityMinimumOpacity(0, 0.0);
  volume.getProperty().setGradientOpacityMaximumValue(0, 20);
  volume.getProperty().setGradientOpacityMaximumOpacity(0, 1.0);
  volume.getProperty().setScalarOpacityUnitDistance(0, 2.955);
  volume.getProperty().setShade(true);
  volume.getProperty().setAmbient(0.3);
  volume.getProperty().setDiffuse(0.7);
  volume.getProperty().setSpecular(1);

  renderer.removeAllLights();
  const light = gc.registerResource(vtkLight.newInstance());
  light.setLightTypeToSceneLight();
  light.setPositional(true);
  light.setPosition(450, 300, 200);
  light.setFocalPoint(0, 0, 0);
  light.setColor(0, 1, 1);
  light.setConeAngle(25);
  light.setIntensity(1.0);
  renderer.addLight(light);

  let testAdditiveResolve;
  const testAdditivePromise = new Promise((res) => {
    testAdditiveResolve = res;
  });

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baselineAdditive],
      'Rendering/Core/VolumeMapper/testColorMix',
      t,
      3.0,
      testAdditiveResolve
    );
  });

  renderWindow.render();
  await testAdditivePromise;

  // ----------------------------------------------------------------

  t.comment('testColorizeWithLigting');

  volume.getProperty().setColorMixPreset(ColorMixPreset.COLORIZE);
  renderer.getActiveCamera().azimuth(-60);
  renderer.getActiveCamera().elevation(-20);

  let testColorizeResolve;
  const testColorizePromise = new Promise((res) => {
    testColorizeResolve = res;
  });

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baselineColorize],
      'Rendering/Core/VolumeMapper/testColorMix',
      t,
      3.0,
      testColorizeResolve
    );
  });

  renderWindow.render();
  await testColorizePromise;

  // ----------------------------------------------------------------

  await gc.releaseResources();
});
