import vtkOpenGLRenderWindow from '../../../Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from '../../../Sources/Rendering/Core/RenderWindow';
import vtkRenderer from '../../../Sources/Rendering/Core/Renderer';
import vtkConeSource from '../../../Sources/Filters/Sources/ConeSource';
import vtkActor from '../../../Sources/Rendering/Core/Actor';
import vtkMapper from '../../../Sources/Rendering/Core/Mapper';
import vtkCamera from '../../../Sources/Rendering/Core/Camera';
import vtkRenderWindowInteractor from '../../../Sources/Rendering/Core/RenderWindowInteractor';
import vtkDataArray from '../../../Sources/Common/Core/DataArray';

import controlPanel from './controller.html';

// Create some control UI
const container = document.querySelector('body');
const controlContainer = document.createElement('div');
const renderWindowContainer = document.createElement('div');
container.appendChild(controlContainer);
container.appendChild(renderWindowContainer);
controlContainer.innerHTML = controlPanel;

const representationSelector = document.querySelector('.representations');
const resolutionChange = document.querySelector('.resolution');

const renWin = vtkRenderWindow.newInstance();
const ren = vtkRenderer.newInstance();
renWin.addRenderer(ren);
ren.setBackground(0.32, 0.34, 0.43);

const glwindow = vtkOpenGLRenderWindow.newInstance();
glwindow.setContainer(renderWindowContainer);
renWin.addView(glwindow);

const iren = vtkRenderWindowInteractor.newInstance();
iren.setView(glwindow);

const actor = vtkActor.newInstance();
ren.addActor(actor);
// actor.getProperty().setRepresentationToWireframe();
// actor.getProperty().setAmbient(1.0);
// actor.getProperty().setAmbientColor(1.0, 0.5, 0.0);

const mapper = vtkMapper.newInstance();
actor.setMapper(mapper);

const cam = vtkCamera.newInstance();
ren.setActiveCamera(cam);
cam.setFocalPoint(0, 0, 0);
cam.setPosition(0, 0, 3);
cam.setClippingRange(0.1, 50.0);

const coneSource = vtkConeSource.newInstance({ height: 1.0 });

// mapper.setInputConnection(coneSource.getOutputPort());
mapper.setInputData(coneData);

iren.initialize();
iren.bindEvents(renderWindowContainer, document);
iren.start();

// ----------------

representationSelector.addEventListener('change', e => {
  const newRepValue = Number(e.target.value);
  actor.getProperty().setRepresentation(newRepValue);
  renWin.render();
});

resolutionChange.addEventListener('change', e => {
  const resolution = Number(e.target.value);
  coneSource.setResolution(resolution);
  renWin.render();
});

global.source = coneSource;
global.mapper = mapper;
global.actor = actor;

