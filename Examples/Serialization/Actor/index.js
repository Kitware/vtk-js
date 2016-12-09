import vtkOpenGLRenderWindow from '../../../Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from '../../../Sources/Rendering/Core/RenderWindow';
import vtkRenderer from '../../../Sources/Rendering/Core/Renderer';
import vtkRenderWindowInteractor from '../../../Sources/Rendering/Core/RenderWindowInteractor';

import actorJSON from './actor.json';
import vtk   from '../../../Sources/vtk';

// Fill vtk factory
import '../../../Sources/Rendering/Core/Actor';
import '../../../Sources/Rendering/Core/Mapper';
import '../../../Sources/Common/Core/DataArray';
import '../../../Sources/Common/Core/Points';
import '../../../Sources/Common/DataModel/PolyData';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

// Create some control UI
const container = document.querySelector('body');
const renderWindowContainer = document.createElement('div');
container.appendChild(renderWindowContainer);

// create what we will view
const renWin = vtkRenderWindow.newInstance();
const ren = vtkRenderer.newInstance();
renWin.addRenderer(ren);
ren.setBackground(0.32, 0.34, 0.43);

// now create something to view it, in this case webgl
// with mouse/touch interaction
const glwindow = vtkOpenGLRenderWindow.newInstance();
glwindow.setSize(500, 400);
glwindow.setContainer(renderWindowContainer);
renWin.addView(glwindow);

const iren = vtkRenderWindowInteractor.newInstance();
iren.setView(glwindow);

// initialize the interaction and bind event handlers
// to the HTML elements
iren.initialize();
iren.bindEvents(renderWindowContainer, document);

// ----------------------------------------------------------------------------
// Add actor with its pipeline into renderer
// ----------------------------------------------------------------------------

const actor = vtk(actorJSON);
ren.addActor(actor);

ren.resetCamera();
renWin.render();

