// For streamlined VR development install the WebXR emulator extension
// https://github.com/MozillaReality/WebXR-emulator-extension

import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkCalculator from '@kitware/vtk.js/Filters/General/Calculator';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkWebXRRenderWindowHelper from '@kitware/vtk.js/Rendering/WebXR/RenderWindowHelper';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import { AttributeTypes } from '@kitware/vtk.js/Common/DataModel/DataSetAttributes/Constants';
import { FieldDataTypes } from '@kitware/vtk.js/Common/DataModel/DataSet/Constants';
import { XrSessionTypes } from '@kitware/vtk.js/Rendering/WebXR/RenderWindowHelper/Constants';

// Force DataAccessHelper to have access to various data source
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

import controlPanel from './controller.html';

// Import the Looking Glass WebXR Polyfill override
// Assumes that the Looking Glass Bridge native application is already running.
// See https://docs.lookingglassfactory.com/developer-tools/webxr
import(
  // eslint-disable-next-line import/no-unresolved, import/extensions
  /* webpackIgnore: true */ 'https://unpkg.com/@lookingglass/webxr@0.3.0/dist/@lookingglass/bundle/webxr.js'
).then((obj) => {
  // eslint-disable-next-line no-new
  new obj.LookingGlassWebXRPolyfill();
});

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const xrRenderWindowHelper = vtkWebXRRenderWindowHelper.newInstance({
  renderWindow: fullScreenRenderer.getApiSpecificRenderWindow(),
});

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
// create a filter on the fly, sort of cool, this is a random scalars
// filter we create inline, for a simple cone you would not need
// this
// ----------------------------------------------------------------------------

const coneSource = vtkConeSource.newInstance({ height: 1.0, radius: 0.5 });
const filter = vtkCalculator.newInstance();

filter.setInputConnection(coneSource.getOutputPort());
// filter.setFormulaSimple(FieldDataTypes.CELL, [], 'random', () => Math.random());
filter.setFormula({
  getArrays: (inputDataSets) => ({
    input: [],
    output: [
      {
        location: FieldDataTypes.CELL,
        name: 'Random',
        dataType: 'Float32Array',
        attribute: AttributeTypes.SCALARS,
      },
    ],
  }),
  evaluate: (arraysIn, arraysOut) => {
    const [scalars] = arraysOut.map((d) => d.getData());
    for (let i = 0; i < scalars.length; i++) {
      scalars[i] = Math.random();
    }
  },
});

const mapper = vtkMapper.newInstance();
mapper.setInputConnection(filter.getOutputPort());

const actor = vtkActor.newInstance();
actor.setMapper(mapper);
actor.setPosition(0.0, 0.0, -20.0);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);
const representationSelector = document.querySelector('.representations');
const resolutionChange = document.querySelector('.resolution');
const vrbutton = document.querySelector('.vrbutton');

representationSelector.addEventListener('change', (e) => {
  const newRepValue = Number(e.target.value);
  actor.getProperty().setRepresentation(newRepValue);
  renderWindow.render();
});

resolutionChange.addEventListener('input', (e) => {
  const resolution = Number(e.target.value);
  coneSource.setResolution(resolution);
  renderWindow.render();
});

vrbutton.addEventListener('click', (e) => {
  if (vrbutton.textContent === 'Send To Looking Glass') {
    xrRenderWindowHelper.startXR(XrSessionTypes.LookingGlassVR);
    vrbutton.textContent = 'Return From Looking Glass';
  } else {
    xrRenderWindowHelper.stopXR();
    vrbutton.textContent = 'Send To Looking Glass';
  }
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = coneSource;
global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
