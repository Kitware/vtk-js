import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkRegularPolygonSource from '@kitware/vtk.js/Filters/Sources/RegularPolygonSource';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import { Representation } from '@kitware/vtk.js/Rendering/Core/Property/Constants';
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
const regularPolygonSource = vtkRegularPolygonSource.newInstance();

const mapper = vtkMapper.newInstance();
const actor = vtkActor.newInstance();

actor.getProperty().setRepresentation(Representation.WIREFRAME);

mapper.setInputConnection(regularPolygonSource.getOutputPort());
actor.setMapper(mapper);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

const gui = new GUI();
const params = {
  numberOfSides: 6,
};

gui
  .add(params, 'numberOfSides', 3, 100, 1)
  .name('Number of sides')
  .onChange((value) => {
    regularPolygonSource.set({ numberOfSides: Number(value) });
    renderWindow.render();
  });

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.regularPolygonSource = regularPolygonSource;
global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
