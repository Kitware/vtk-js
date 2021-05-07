import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCubeAxesActor from 'vtk.js/Sources/Rendering/Core/CubeAxesActor';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkURLExtract from 'vtk.js/Sources/Common/Core/URLExtract';

import 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import 'vtk.js/Sources/Rendering/WebGPU/RenderWindow';

// Process arguments from URL
const userParams = vtkURLExtract.extractURLParameters();

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const renderWindow = vtkRenderWindow.newInstance();
const renderer = vtkRenderer.newInstance({ background: [0.2, 0.3, 0.4] });
renderWindow.addRenderer(renderer);

// ----------------------------------------------------------------------------
// Simple pipeline ConeSource --> Mapper --> Actor
// ----------------------------------------------------------------------------

const coneSource = vtkConeSource.newInstance({ height: 1.0 });

const mapper = vtkMapper.newInstance();
mapper.setInputConnection(coneSource.getOutputPort());

const actor = vtkActor.newInstance();
actor.setMapper(mapper);

// ----------------------------------------------------------------------------
// Add the actor to the renderer and set the camera based on it
// ----------------------------------------------------------------------------

renderer.addActor(actor);
renderer.resetCamera();

const cubeAxes = vtkCubeAxesActor.newInstance();
cubeAxes.setCamera(renderer.getActiveCamera());
cubeAxes.setDataBounds(actor.getBounds());
renderer.addActor(cubeAxes);

// ----------------------------------------------------------------------------
// Use OpenGL as the backend to view the all this
// ----------------------------------------------------------------------------

const apiSpecificRenderWindow = renderWindow.newAPISpecificView(
  userParams.viewAPI
);
renderWindow.addView(apiSpecificRenderWindow);

// ----------------------------------------------------------------------------
// Create a div section to put this into
// ----------------------------------------------------------------------------

const container = document.createElement('div');
document.querySelector('body').appendChild(container);
apiSpecificRenderWindow.setContainer(container);

// ----------------------------------------------------------------------------
// Capture size of the container and set it to the renderWindow
// ----------------------------------------------------------------------------

const { width, height } = container.getBoundingClientRect();
apiSpecificRenderWindow.setSize(width, height);

// ----------------------------------------------------------------------------
// Setup an interactor to handle mouse events
// ----------------------------------------------------------------------------

const interactor = vtkRenderWindowInteractor.newInstance();
interactor.setView(apiSpecificRenderWindow);
interactor.initialize();
interactor.bindEvents(container);

// ----------------------------------------------------------------------------
// Setup interactor style to use
// ----------------------------------------------------------------------------

interactor.setInteractorStyle(vtkInteractorStyleTrackballCamera.newInstance());

// make the cubeAxes global visibility in case you want to try changing
// some values
global.cubeAxes = cubeAxes;
