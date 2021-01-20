import 'vtk.js/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from 'vtk.js/Rendering/Core/Actor';
import vtkHttpDataSetSeriesReader from 'vtk.js/IO/Core/HttpDataSetSeriesReader';
import vtkMapper from 'vtk.js/Rendering/Core/Mapper';

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
