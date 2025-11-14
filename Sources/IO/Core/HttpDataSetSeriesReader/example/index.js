import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

// Force DataAccessHelper to have access to various data source
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkHttpDataSetSeriesReader from '@kitware/vtk.js/IO/Core/HttpDataSetSeriesReader';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import GUI from 'lil-gui';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

renderer.getActiveCamera().setPosition(6, 3, 7);
renderer.getActiveCamera().setFocalPoint(0, 2, 0);

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
    const gui = new GUI();
    const timeSteps = reader.getTimeSteps();
    const params = { Index: 0, TimeStep: timeSteps[0] };

    const updateTimeStep = (index) => {
      const newTimeStep = timeSteps[index];
      params.TimeStep = newTimeStep;
      reader.setUpdateTimeStep(newTimeStep);
      renderer.resetCameraClippingRange();
      renderWindow.render();
    };

    const idxCtrl = gui
      .add(params, 'Index', 0, timeSteps.length - 1, 1)
      .name('Index')
      .onChange((i) => updateTimeStep(Number(i)));
    gui.add(params, 'TimeStep').name('Current time step').listen();
    gui.add(
      {
        Previous: () => {
          params.Index =
            (params.Index - 1 + timeSteps.length) % timeSteps.length;
          idxCtrl.updateDisplay?.();
          updateTimeStep(params.Index);
        },
      },
      'Previous'
    );
    gui.add(
      {
        Next: () => {
          params.Index = (params.Index + 1) % timeSteps.length;
          idxCtrl.updateDisplay?.();
          updateTimeStep(params.Index);
        },
      },
      'Next'
    );

    updateTimeStep(0);
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
