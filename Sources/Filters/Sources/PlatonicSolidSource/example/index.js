import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPlatonicSolidSource from '@kitware/vtk.js/Filters/Sources/PlatonicSolidSource';
import { SolidType } from '@kitware/vtk.js/Filters/Sources/PlatonicSolidSource/Constants';

import controlPanel from './controlPanel.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
const platonicSolidSource = vtkPlatonicSolidSource.newInstance({
  solidType: SolidType.VTK_SOLID_DODECAHEDRON,
});

const mapper = vtkMapper.newInstance();
const actor = vtkActor.newInstance();

mapper.setInputConnection(platonicSolidSource.getOutputPort());
actor.setMapper(mapper);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

const solidTypeSelect = document.querySelector('select[name="solidType"]');
solidTypeSelect.addEventListener('change', (event) => {
  const solidType = event.target.value;
  platonicSolidSource.setSolidType(SolidType[solidType.toUpperCase()]);
  renderWindow.render();
});

// Set the initial value of the select element
solidTypeSelect.value = 'VTK_SOLID_DODECAHEDRON';

// Render the initial state
renderWindow.render();

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.platonicSolidSource = platonicSolidSource;
global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
