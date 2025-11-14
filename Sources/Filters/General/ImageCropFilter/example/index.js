import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Volume';

// Force the loading of HttpDataAccessHelper to support gzip decompression
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';

import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';
import vtkImageCropFilter from '@kitware/vtk.js/Filters/General/ImageCropFilter';

import GUI from 'lil-gui';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
// Server is not sending the .gz and with the compress header
// Need to fetch the true file name and uncompress it locally
// ----------------------------------------------------------------------------

// create filter
const cropFilter = vtkImageCropFilter.newInstance();

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });

const actor = vtkVolume.newInstance();
const mapper = vtkVolumeMapper.newInstance();
mapper.setSampleDistance(1.1);
actor.setMapper(mapper);

// create color and opacity transfer functions
const ctfun = vtkColorTransferFunction.newInstance();
ctfun.addRGBPoint(0, 85 / 255.0, 0, 0);
ctfun.addRGBPoint(95, 1.0, 1.0, 1.0);
ctfun.addRGBPoint(225, 0.66, 0.66, 0.5);
ctfun.addRGBPoint(255, 0.3, 1.0, 0.5);
const ofun = vtkPiecewiseFunction.newInstance();
ofun.addPoint(0.0, 0.0);
ofun.addPoint(255.0, 1.0);
actor.getProperty().setRGBTransferFunction(0, ctfun);
actor.getProperty().setScalarOpacity(0, ofun);
actor.getProperty().setScalarOpacityUnitDistance(0, 3.0);
actor.getProperty().setInterpolationTypeToLinear();
actor.getProperty().setUseGradientOpacity(0, true);
actor.getProperty().setGradientOpacityMinimumValue(0, 2);
actor.getProperty().setGradientOpacityMinimumOpacity(0, 0.0);
actor.getProperty().setGradientOpacityMaximumValue(0, 20);
actor.getProperty().setGradientOpacityMaximumOpacity(0, 1.0);
actor.getProperty().setShade(true);
actor.getProperty().setAmbient(0.2);
actor.getProperty().setDiffuse(0.7);
actor.getProperty().setSpecular(0.3);
actor.getProperty().setSpecularPower(8.0);

cropFilter.setInputConnection(reader.getOutputPort());
mapper.setInputConnection(cropFilter.getOutputPort());

reader.setUrl(`${__BASE_PATH__}/data/volume/headsq.vti`).then(() => {
  reader.loadData().then(() => {
    renderer.addVolume(actor);

    const data = reader.getOutputData();
    cropFilter.setCroppingPlanes(...data.getExtent());

    const extent = data.getExtent();
    const gui = new GUI();
    const params = {
      Imin: extent[0],
      Imax: extent[1],
      Jmin: extent[2],
      Jmax: extent[3],
      Kmin: extent[4],
      Kmax: extent[5],
    };

    function updateCropping() {
      const planes = [
        params.Imin,
        params.Imax,
        params.Jmin,
        params.Jmax,
        params.Kmin,
        params.Kmax,
      ];
      cropFilter.setCroppingPlanes(...planes);
      renderWindow.render();
    }

    const iFolder = gui.addFolder('I');
    iFolder
      .add(params, 'Imin', extent[0], extent[1], 1)
      .name('Min')
      .onChange((value) => {
        params.Imin = Number(value);
        updateCropping();
      });
    iFolder
      .add(params, 'Imax', extent[0], extent[1], 1)
      .name('Max')
      .onChange((value) => {
        params.Imax = Number(value);
        updateCropping();
      });

    const jFolder = gui.addFolder('J');
    jFolder
      .add(params, 'Jmin', extent[2], extent[3], 1)
      .name('Min')
      .onChange((value) => {
        params.Jmin = Number(value);
        updateCropping();
      });
    jFolder
      .add(params, 'Jmax', extent[2], extent[3], 1)
      .name('Max')
      .onChange((value) => {
        params.Jmax = Number(value);
        updateCropping();
      });

    const kFolder = gui.addFolder('K');
    kFolder
      .add(params, 'Kmin', extent[4], extent[5], 1)
      .name('Min')
      .onChange((value) => {
        params.Kmin = Number(value);
        updateCropping();
      });
    kFolder
      .add(params, 'Kmax', extent[4], extent[5], 1)
      .name('Max')
      .onChange((value) => {
        params.Kmax = Number(value);
        updateCropping();
      });

    iFolder.open();
    jFolder.open();
    kFolder.open();

    const interactor = renderWindow.getInteractor();
    interactor.setDesiredUpdateRate(15.0);
    renderer.resetCamera();
    renderWindow.render();
  });
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
global.cropFilter = cropFilter;
