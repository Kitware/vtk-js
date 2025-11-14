import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Volume';

// Force DataAccessHelper to have access to various data source
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';
import GUI from 'lil-gui';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0.3, 0.3, 0.3],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const gui = new GUI();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
// UI params
const params = {
  BlendMode: 5,
  IpScalarMin: 0.0,
  IpScalarMax: 1.0,
  MinHounsfield: 1000,
  MinAbsorption: 0.01,
  MaxHounsfield: 2500,
  MaxAbsorption: 0.03,
  SampleDistance: 1.3,
};
const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
const initialSampleDistance = 1.3;

const actor = vtkVolume.newInstance();
const actorProperty = actor.getProperty();
const mapper = vtkVolumeMapper.newInstance();
mapper.setSampleDistance(initialSampleDistance);

// use half float at the cost of precision to save memory
actorProperty.setPreferSizeOverAccuracy(true);

actor.setMapper(mapper);

const radonParameters = {
  get minHounsfield() {
    return params.MinHounsfield;
  },
  get minAbsorption() {
    return params.MinAbsorption;
  },
  get maxHounsfield() {
    return params.MaxHounsfield;
  },
  get maxAbsorption() {
    return params.MaxAbsorption;
  },
};

function updatePiecewiseFunction() {
  const currentBlendMode = mapper.getBlendMode();
  let opacityFunction;

  if (currentBlendMode === 5) {
    opacityFunction = vtkVolumeMapper.createRadonTransferFunction(
      radonParameters.minHounsfield,
      radonParameters.minAbsorption,
      radonParameters.maxHounsfield,
      radonParameters.maxAbsorption
    );
  } else {
    opacityFunction = vtkPiecewiseFunction.newInstance();
    opacityFunction.addPoint(-3024, 0.1);
    opacityFunction.addPoint(-637.62, 0.1);
    opacityFunction.addPoint(700, 0.5);
    opacityFunction.addPoint(3071, 0.9);
  }
  actor.getProperty().setScalarOpacity(0, opacityFunction);
}

actor.getProperty().setScalarOpacityUnitDistance(0, 3.0);
actor.getProperty().setInterpolationTypeToLinear();
actor.getProperty().setShade(true);
actor.getProperty().setAmbient(0.1);
actor.getProperty().setDiffuse(0.9);
actor.getProperty().setSpecular(0.2);
actor.getProperty().setSpecularPower(10.0);

mapper.setInputConnection(reader.getOutputPort());

function updateSampleDistance(val) {
  mapper.setSampleDistance(Number(val));
  renderWindow.render();
}

function updateScalarMin(val) {
  actorProperty.setIpScalarRange(
    Number(val),
    actorProperty.getIpScalarRange()[1]
  );
  renderWindow.render();
}

function updateScalarMax(val) {
  actorProperty.setIpScalarRange(
    actorProperty.getIpScalarRange()[0],
    Number(val)
  );
  renderWindow.render();
}

function applyBlendMode(currentBlendMode) {
  mapper.setBlendMode(currentBlendMode);
  actorProperty.setIpScalarRange(params.IpScalarMin, params.IpScalarMax);
  const colorTransferFunction = vtkColorTransferFunction.newInstance();
  if (currentBlendMode === 5) {
    colorTransferFunction.addRGBPoint(0, 0, 0, 0);
    colorTransferFunction.addRGBPoint(1, 1, 1, 1);
  } else {
    colorTransferFunction.addRGBPoint(-3024, 0, 0, 0);
    colorTransferFunction.addRGBPoint(-637.62, 0, 0, 0);
    colorTransferFunction.addRGBPoint(700, 1, 1, 1);
    colorTransferFunction.addRGBPoint(3071, 1, 1, 1);
  }
  actor.getProperty().setRGBTransferFunction(0, colorTransferFunction);
  updatePiecewiseFunction();
  renderWindow.render();
}

reader.setUrl(`${__BASE_PATH__}/data/volume/headsq.vti`).then(() => {
  reader.loadData().then(() => {
    renderer.addVolume(actor);
    const interactor = renderWindow.getInteractor();
    interactor.setDesiredUpdateRate(15.0);
    renderer.resetCamera();
    renderer.getActiveCamera().elevation(-70);
    updatePiecewiseFunction();

    let radonFolder;

    // Build GUI controls
    gui
      .add(params, 'BlendMode', {
        Composite: 0,
        'Maximum Intensity': 1,
        'Minimum Intensity': 2,
        'Average Intensity': 3,
        'Additive Intensity': 4,
        'Radon transform': 5,
      })
      .name('Blend Mode')
      .onChange((v) => {
        applyBlendMode(Number(v));
        // Show/hide Radon folder based on blend mode
        if (Number(v) === 5) {
          radonFolder.domElement.style.display = '';
        } else {
          radonFolder.domElement.style.display = 'none';
        }
      });
    gui
      .add(params, 'SampleDistance', 0.1, 2.5, 0.1)
      .name('Sample distance')
      .onChange(updateSampleDistance);

    gui
      .add(params, 'IpScalarMin', 0, 1, 0.01)
      .name('IP Scalar Min')
      .onChange(updateScalarMin);
    gui
      .add(params, 'IpScalarMax', 0, 1, 0.01)
      .name('IP Scalar Max')
      .onChange(updateScalarMax);

    radonFolder = gui.addFolder('Radon');
    radonFolder
      .add(params, 'MinHounsfield', -1024, 3071, 5)
      .name('First hounsfield')
      .onChange(() => {
        updatePiecewiseFunction();
        renderWindow.render();
      });
    radonFolder
      .add(params, 'MinAbsorption', 0.0, 0.1, 0.001)
      .name('Min absorption')
      .onChange(() => {
        updatePiecewiseFunction();
        renderWindow.render();
      });
    radonFolder
      .add(params, 'MaxHounsfield', -1024, 3071, 5)
      .name('Max hounsfield')
      .onChange(() => {
        updatePiecewiseFunction();
        renderWindow.render();
      });
    radonFolder
      .add(params, 'MaxAbsorption', 0.0, 0.1, 0.001)
      .name('Max absorption')
      .onChange(() => {
        updatePiecewiseFunction();
        renderWindow.render();
      });

    // Hide Radon folder initially if not Radon transform
    radonFolder.domElement.style.display = params.BlendMode === 5 ? '' : 'none';

    // Initialize state
    params.MinHounsfield = radonParameters.minHounsfield;
    params.MaxHounsfield = radonParameters.maxHounsfield;
    params.MinAbsorption = radonParameters.minAbsorption;
    params.MaxAbsorption = radonParameters.maxAbsorption;
    params.SampleDistance = initialSampleDistance;
    applyBlendMode(5);
  });
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = reader;
global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
