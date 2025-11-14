import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkPlatonicSolidSource from '@kitware/vtk.js/Filters/Sources/PlatonicSolidSource';
import { SolidType } from '@kitware/vtk.js/Filters/Sources/PlatonicSolidSource/Constants';

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

const gui = new GUI();
const params = {
  solidType: 'VTK_SOLID_DODECAHEDRON',
};

gui
  .add(params, 'solidType', [
    'VTK_SOLID_TETRAHEDRON',
    'VTK_SOLID_CUBE',
    'VTK_SOLID_OCTAHEDRON',
    'VTK_SOLID_DODECAHEDRON',
    'VTK_SOLID_ICOSAHEDRON',
  ])
  .name('Solid type')
  .onChange((value) => {
    platonicSolidSource.setSolidType(SolidType[value]);
    renderWindow.render();
  });

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.platonicSolidSource = platonicSolidSource;
global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
