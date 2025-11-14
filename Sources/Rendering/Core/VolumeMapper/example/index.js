import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Volume';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import { ColorMixPreset } from '@kitware/vtk.js/Rendering/Core/VolumeProperty/Constants';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkLight from '@kitware/vtk.js/Rendering/Core/Light';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkMath from '@kitware/vtk.js/Common/Core/Math';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import vtkProperty from '@kitware/vtk.js/Rendering/Core/Property';
import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';

// Force the loading of HttpDataAccessHelper to support gzip decompression
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';

import GUI from 'lil-gui';

const { Representation, Shading } = vtkProperty;

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const gui = new GUI();
renderer.setTwoSidedLighting(false);

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
// Server is not sending the .gz and with the compress header
// Need to fetch the true file name and uncompress it locally
// ----------------------------------------------------------------------------

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
const volumeOptions = {};
let volumeController;
let presetController;
let forceNearestControllers = [];
const params = {
  ParallelProjection: false,
  Lighting: true,
  LAO: false,
  Scattering: 0.0,
  Volume: '',
  Preset: 'DEFAULT',
};

const actor = vtkVolume.newInstance();
const mapper = vtkVolumeMapper.newInstance();
mapper.setSampleDistance(0.7);
actor.setMapper(mapper);

// create color and opacity transfer functions
const ctfun = vtkColorTransferFunction.newInstance();
ctfun.addRGBPoint(0, 0, 0, 0);
ctfun.addRGBPoint(95, 1.0, 1.0, 1.0);
ctfun.addRGBPoint(225, 0.66, 0.66, 0.5);
ctfun.addRGBPoint(255, 0.3, 0.3, 0.5);
const ofun = vtkPiecewiseFunction.newInstance();
ofun.addPoint(0.0, 0.1);
ofun.addPoint(255.0, 1.0);
actor.getProperty().setComputeNormalFromOpacity(true);
actor.getProperty().setLAOKernelRadius(5);
actor.getProperty().setLAOKernelSize(10);
actor.getProperty().setLocalAmbientOcclusion(0);
actor.getProperty().setVolumetricScatteringBlending(0);
actor.getProperty().setRGBTransferFunction(0, ctfun);
actor.getProperty().setScalarOpacity(0, ofun);
actor.getProperty().setInterpolationTypeToLinear();
actor.getProperty().setUseGradientOpacity(0, true);
actor.getProperty().setGradientOpacityMinimumValue(0, 2);
actor.getProperty().setGradientOpacityMinimumOpacity(0, 0.0);
actor.getProperty().setGradientOpacityMaximumValue(0, 20);
actor.getProperty().setGradientOpacityMaximumOpacity(0, 1.0);
actor.getProperty().setScalarOpacityUnitDistance(0, 2.955);
actor.getProperty().setShade(true);
actor.getProperty().setAmbient(0.3);
actor.getProperty().setDiffuse(1);
actor.getProperty().setSpecular(1);

renderer.addVolume(actor);

renderer.removeAllLights();
const light = vtkLight.newInstance();
light.setLightTypeToSceneLight();
light.setPositional(true);
light.setPosition(450, 300, 200);
light.setFocalPoint(0, 0, 0);
light.setColor(0, 0.45, 0.45);
light.setConeAngle(25);
light.setIntensity(1.0);
renderer.addLight(light);

// Visualize the light source
if (light.getPositional()) {
  const ls = vtkSphereSource.newInstance({
    center: light.getPosition(),
    radius: 5.0,
  });
  const lm = vtkMapper.newInstance();
  lm.setInputConnection(ls.getOutputPort());
  const la = vtkActor.newInstance({ mapper: lm });
  la.getProperty().setColor(1, 1, 1);
  la.getProperty().setRepresentation(Representation.WIREFRAME);
  la.getProperty().setInterpolation(Shading.FLAT);
  la.getProperty().setColor(light.getColor());
  la.getProperty().setLineWidth(2.0);
  renderer.addActor(la);

  const lightDir = [0, 0, 0];
  vtkMath.subtract(light.getFocalPoint(), light.getPosition(), lightDir);
  vtkMath.normalize(lightDir);
  const frustumCenter = light.getPosition();
  const frustumHeight = 80;
  const frustumRadius =
    frustumHeight * Math.tan((light.getConeAngle() * 1.0 * Math.PI) / 180);
  const halfDir = [0, 0, 0];
  vtkMath.add(
    frustumCenter,
    vtkMath.multiplyScalar(lightDir, frustumHeight * 0.5),
    halfDir
  );
  vtkMath.multiplyScalar(lightDir, -1, lightDir);
  const lc = vtkConeSource.newInstance({
    center: halfDir,
    radius: frustumRadius,
    height: frustumHeight,
    direction: lightDir,
    resolution: 6,
  });
  const lcm = vtkMapper.newInstance();
  lcm.setInputConnection(lc.getOutputPort());
  const lca = vtkActor.newInstance({ mapper: lcm });
  lca.getProperty().setColor(1, 1, 1);
  lca.getProperty().setRepresentation(Representation.WIREFRAME);
  lca.getProperty().setInterpolation(Shading.FLAT);
  lca.getProperty().setColor(light.getColor());
  lca.getProperty().setLineWidth(2.0);
  renderer.addActor(lca);
}

const presetKeys = Object.keys(ColorMixPreset).filter((k) => k !== 'CUSTOM');

const setColorMixPreset = (presetKey) => {
  const preset = ColorMixPreset[presetKey];
  actor.getProperty().setColorMixPreset(preset);
  params.Preset = presetKey;
};

function rebuildForceNearestControllers(comp) {
  forceNearestControllers.forEach((c) => gui.remove(c));
  forceNearestControllers = [];
  for (let i = 0; i < comp; ++i) {
    const obj = {
      [`ForceNearest${i}`]: actor.getProperty().getForceNearestInterpolation(i),
    };
    const ctrl = gui
      .add(obj, `ForceNearest${i}`)
      .name(`Force nearest interpolation for component ${i}`)
      .onChange((v) => {
        actor.getProperty().setForceNearestInterpolation(i, Boolean(v));
        renderWindow.render();
      });
    forceNearestControllers.push(ctrl);
  }
}

reader.setUrl(`${__BASE_PATH__}/data/volume/LIDC2.vti`).then(() => {
  reader.loadData().then(() => {
    const imageData = reader.getOutputData();
    mapper.setInputData(imageData);

    const array = imageData.getPointData().getArray(0);
    const baseComp = 1;
    const baseData = array.getData();
    const newComp = 2;
    const cubeData = new Float32Array(newComp * baseData.length);
    const sphereData = new Float32Array(newComp * baseData.length);
    const dims = imageData.getDimensions();
    for (let z = 0; z < dims[2]; ++z) {
      for (let y = 0; y < dims[1]; ++y) {
        for (let x = 0; x < dims[0]; ++x) {
          const iTuple = x + dims[0] * (y + dims[1] * z);
          const isInCube =
            x >= 0.3 * dims[0] &&
            x <= 0.7 * dims[0] &&
            y >= 0.3 * dims[1] &&
            y <= 0.7 * dims[1] &&
            z >= 0.3 * dims[2] &&
            z <= 0.7 * dims[2];
          cubeData[iTuple * newComp + 0] = baseData[iTuple];
          cubeData[iTuple * newComp + 1] = isInCube ? 1 : 0;
          const isInSphere =
            (x / dims[0] - 0.5) ** 2 +
              (y / dims[1] - 0.5) ** 2 +
              (z / dims[2] - 0.5) ** 2 <
            0.2 ** 2;
          sphereData[iTuple * newComp + 0] = baseData[iTuple];
          sphereData[iTuple * newComp + 1] = isInSphere ? 1 : 0;
        }
      }
    }

    volumeOptions['Base volume'] = {
      comp: baseComp,
      data: baseData,
    };
    volumeOptions['Sphere labelmap volume'] = {
      comp: newComp,
      data: sphereData,
    };
    volumeOptions['Cube labelmap volume'] = {
      comp: newComp,
      data: cubeData,
    };

    const volumeKeys = Object.keys(volumeOptions);
    params.Volume = volumeKeys[0];
    if (volumeController) gui.remove(volumeController);
    volumeController = gui
      .add(params, 'Volume', volumeKeys)
      .name('Volume')
      .onChange((value) => {
        const { comp, data } = volumeOptions[value];
        if (comp === 1) {
          setColorMixPreset('DEFAULT');
        }
        rebuildForceNearestControllers(comp);
        array.setData(data);
        array.setNumberOfComponents(comp);
        mapper.modified();
        renderWindow.render();
      });

    const maskCtfun = vtkColorTransferFunction.newInstance();
    maskCtfun.addRGBPoint(0, 0, 0, 0);
    maskCtfun.addRGBPoint(0.9999, 0, 0, 0);
    maskCtfun.addRGBPoint(1, 1, 0, 1);

    const maskOfun = vtkPiecewiseFunction.newInstance();
    maskOfun.addPoint(0, 0);
    maskOfun.addPoint(0.9999, 0);
    maskOfun.addPoint(1, 1);

    actor.getProperty().setRGBTransferFunction(1, maskCtfun);
    actor.getProperty().setScalarOpacity(1, maskOfun);

    const interactor = renderWindow.getInteractor();
    interactor.setDesiredUpdateRate(15.0);
    renderer.getActiveCamera().azimuth(90);
    renderer.getActiveCamera().roll(90);
    renderer.getActiveCamera().azimuth(-60);
    renderer.resetCamera();
    renderWindow.render();
  });
});

// TEST  ==============

gui
  .add(params, 'ParallelProjection')
  .name('Parallel Projection')
  .onChange((v) => {
    const cam = renderer.getActiveCamera();
    cam.setParallelProjection(Boolean(v));
    renderWindow.render();
  });
gui
  .add(params, 'Lighting')
  .name('Lighting')
  .onChange((v) => {
    actor.getProperty().setShade(Boolean(v));
    renderWindow.render();
  });
gui
  .add(params, 'LAO')
  .name('Toggle LAO')
  .onChange((v) => {
    actor.getProperty().setLocalAmbientOcclusion(Boolean(v));
    renderWindow.render();
  });
gui
  .add(params, 'Scattering', 0.0, 1.0, 0.1)
  .name('Volumetric Scattering')
  .onChange((v) => {
    actor.getProperty().setVolumetricScatteringBlending(Number(v));
    renderWindow.render();
  });

if (presetController) gui.remove(presetController);
presetController = gui
  .add(params, 'Preset', presetKeys)
  .name('Preset')
  .onChange((key) => {
    setColorMixPreset(key);
    renderWindow.render();
  });

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = reader;
global.mapper = mapper;
global.actor = actor;
global.ctfun = ctfun;
global.ofun = ofun;
global.renderer = renderer;
global.renderWindow = renderWindow;
