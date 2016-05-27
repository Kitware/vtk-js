import vtkOpenGLRenderWindow from '../../../Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from '../../../Sources/Rendering/Core/RenderWindow';
import vtkRenderer from '../../../Sources/Rendering/Core/Renderer';
import vtkSphereSource from '../../../Sources/Filters/Sources/SphereSource';
import vtkActor from '../../../Sources/Rendering/Core/Actor';
import vtkMapper from '../../../Sources/Rendering/Core/Mapper';
import vtkCamera from '../../../Sources/Rendering/Core/Camera';
import vtkRenderWindowInteractor from '../../../Sources/Rendering/Core/RenderWindowInteractor';
import vtkWarpScalar from '../../../Sources/Filters/General/WarpScalar';

import controlPanel from './controller.html';

// Create some control UI
const container = document.querySelector('body');
const controlContainer = document.createElement('div');
const renderWindowContainer = document.createElement('div');
container.appendChild(controlContainer);
container.appendChild(renderWindowContainer);
controlContainer.innerHTML = controlPanel;

const scaleFactorInput = document.querySelector('.scale-factor');

const renWin = vtkRenderWindow.newInstance();
const ren = vtkRenderer.newInstance();
renWin.addRenderer(ren);
ren.setBackground(0.32, 0.34, 0.43);

const glwindow = vtkOpenGLRenderWindow.newInstance();
glwindow.setSize(500, 500);
glwindow.setContainer(renderWindowContainer);
renWin.addView(glwindow);

const iren = vtkRenderWindowInteractor.newInstance();
iren.setView(glwindow);

const actor = vtkActor.newInstance();
ren.addActor(actor);

const mapper = vtkMapper.newInstance();
actor.setMapper(mapper);

const cam = vtkCamera.newInstance();
ren.setActiveCamera(cam);
cam.setFocalPoint(0, 0, 0);
cam.setPosition(0, 0, 3);
cam.setClippingRange(0.1, 50.0);

// Build pipeline
const sphereSource = vtkSphereSource.newInstance();
const filter = vtkWarpScalar.newInstance();

filter.setInputConnection(sphereSource.getOutputPort());
mapper.setInputConnection(filter.getOutputPort());

// Initialize interactor and start
iren.initialize();
iren.bindEvents(renderWindowContainer, document);
iren.start();

// ----------------

scaleFactorInput.addEventListener('change', e => {
  const scaleFactor = Number(e.target.value);
  // coneSource.setResolution(resolution);
  console.log(`New scale factor: ${scaleFactor}`);
  renWin.render();
});

global.source = sphereSource;
global.mapper = mapper;
global.actor = actor;
