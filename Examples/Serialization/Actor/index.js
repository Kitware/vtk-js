import vtkFullScreenRenderWindow from '../../../Sources/Testing/FullScreenRenderWindow';
import vtk                       from '../../../Sources/vtk';

import actorJSON                 from './actor.json';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Add actor with its pipeline into renderer
// ----------------------------------------------------------------------------

const actor = vtk(actorJSON);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

