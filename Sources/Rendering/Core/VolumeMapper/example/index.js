import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Volume';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpDataSetReader from '@kitware/vtk.js/IO/Core/HttpDataSetReader';
import vtkXMLImageDataReader from '@kitware/vtk.js/IO/XML/XMLImageDataReader';
import vtkVolume from '@kitware/vtk.js/Rendering/Core/Volume';
import vtkVolumeMapper from '@kitware/vtk.js/Rendering/Core/VolumeMapper';
import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';
import vtkPiecewiseFunction from '@kitware/vtk.js/Common/DataModel/PiecewiseFunction';

import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });

const actor = vtkVolume.newInstance();
const mapper = vtkVolumeMapper.newInstance();
mapper.setBlendModeToMaximumIntensity();
actor.setMapper(mapper);

const ctfun = vtkColorTransferFunction.newInstance();
ctfun.addRGBPoint(0, 0, 0, 0);
ctfun.addRGBPoint(255, 1.0, 1.0, 1.0);
const ofun = vtkPiecewiseFunction.newInstance();
ofun.addPoint(0.0, 0.1);
ofun.addPoint(255.0, 1.0);

actor.getProperty().setRGBTransferFunction(0, ctfun);
actor.getProperty().setScalarOpacity(0, ofun);

renderer.addVolume(actor);
reader.setUrl(`${__BASE_PATH__}/data/volume/LIDC2.vti`).then(() => {
  reader.loadData().then(() => {
    const imageData = reader.getOutputData();
    mapper.setInputData(imageData);

    const array = imageData.getPointData().getArray(0);
    const baseData = array.getData();

    const newComp = 2;
    const cubeData = new Float32Array(newComp * baseData.length);
    const dims = imageData.getDimensions();
    for (let z = 0; z < dims[2]; ++z) {
      for (let y = 0; y < dims[1]; ++y) {
        for (let x = 0; x < dims[0]; ++x) {
          const iTuple = x + dims[0] * (y + dims[1] * z);
          const value = baseData[iTuple];
          cubeData[iTuple * newComp + 0] = baseData[iTuple];

          let segValue = 0;
          if (value > 225) {
            segValue = 1;
          } else if (value > 200 && value < 220) {
            segValue = 2;
          }
          cubeData[iTuple * newComp + 1] = segValue;
        }
      }
    }

    const maskCtfun = vtkColorTransferFunction.newInstance();
    maskCtfun.addRGBPoint(0, 0, 0, 0);
    maskCtfun.addRGBPoint(1, 0, 0, 1); // blue  to red
    maskCtfun.addRGBPoint(2, 1, 0, 0); // red to green

    const maskOfun = vtkPiecewiseFunction.newInstance();
    maskOfun.addPoint(0, 0);
    maskOfun.addPoint(1, 1);
    maskOfun.addPoint(2, 1);

    actor.getProperty().setColorMixPreset(1);

    const arrayAgain = mapper.getInputData().getPointData().getArray(0);

    arrayAgain.setData(cubeData);
    arrayAgain.setNumberOfComponents(2);

    actor.getProperty().setRGBTransferFunction(1, maskCtfun);
    actor.getProperty().setScalarOpacity(1, maskOfun);
    // actor.getProperty().setInterpolationTypeToNearest();
    actor.getProperty().setForceNearestInterpolation(1, true);

    mapper.setBlendMode(22);
    const camera = renderer.getActiveCamera();
    // set parallel projection
    camera.setParallelProjection(true);
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
global.renderer = renderer;
global.renderWindow = renderWindow;
