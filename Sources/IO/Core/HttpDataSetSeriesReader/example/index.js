import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

// Force DataAccessHelper to have access to various data source
import 'vtk.js/Sources/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import 'vtk.js/Sources/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkHttpDataSetSeriesReader from 'vtk.js/Sources/IO/Core/HttpDataSetSeriesReader';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

import controlPanel from './controller.html';

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

const reader = vtkHttpDataSetSeriesReader.newInstance({ fetchGzip: true });
reader
  .setUrl('https://kitware.github.io/vtk-js-datasets/data/temporal')
  .then(() => {
    fullScreenRenderer.addController(controlPanel);

    const timeSteps = reader.getTimeSteps();
    const timeStepLabel = document.querySelector('#timeStep');

    const updateTimeStep = (index) => {
      const newTimeStep = timeSteps[index];
      timeStepLabel.textContent = `Current time step: ${newTimeStep}`;
      reader.setUpdateTimeStep(newTimeStep);
      renderer.resetCameraClippingRange();
      renderWindow.render();
    };

    let index = 0;
    updateTimeStep(index);

    document.querySelector('#previous').onclick = () => {
      index = (index - 1 + timeSteps.length) % timeSteps.length;
      updateTimeStep(index);
    };

    document.querySelector('#next').onclick = () => {
      index = (index + 1) % timeSteps.length;
      updateTimeStep(index);
    };
  });

const mapper = vtkMapper.newInstance();
mapper.setInputConnection(reader.getOutputPort());

const actor = vtkActor.newInstance();
actor.setMapper(mapper);

renderer.addActor(actor);

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = reader;
global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
