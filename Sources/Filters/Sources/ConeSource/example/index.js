import vtkActor                   from '../../../../../Sources/Rendering/Core/Actor';
import vtkCamera                  from '../../../../../Sources/Rendering/Core/Camera';
import vtkConeSource              from '../../../../../Sources/Filters/Sources/ConeSource';
import vtkMapper                  from '../../../../../Sources/Rendering/Core/Mapper';
import vtkOpenGLRenderWindow      from '../../../../../Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderer                from '../../../../../Sources/Rendering/Core/Renderer';
import vtkRenderWindow            from '../../../../../Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor  from '../../../../../Sources/Rendering/Core/RenderWindowInteractor';

import controlPanel from './controlPanel.html';

// Create some control UI
const rootContainer = document.querySelector('body');
rootContainer.innerHTML = controlPanel;
const renderWindowContainer = document.querySelector('.renderwidow');
// ----------------------

const ren = vtkRenderer.newInstance();
ren.setBackground(0.32, 0.34, 0.43);

const renWin = vtkRenderWindow.newInstance();
renWin.addRenderer(ren);

const glwindow = vtkOpenGLRenderWindow.newInstance();
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
cam.setPosition(0, 0, 4);
cam.setClippingRange(0.1, 50.0);

const coneSource = vtkConeSource.newInstance();
mapper.setInputConnection(coneSource.getOutputPort());

iren.initialize();
iren.bindEvents(renderWindowContainer, document);
iren.start();

// ----- JavaScript UI -----

['height', 'radius', 'resolution'].forEach(propertyName => {
  document.querySelector(`.${propertyName}`).addEventListener('input', e => {
    const value = Number(e.target.value);
    coneSource.set({ [propertyName]: value });
    renWin.render();
  });
});

document.querySelector('.capping').addEventListener('change', e => {
  const capping = !!(e.target.checked);
  coneSource.set({ capping });
  renWin.render();
});

// ----- Console play ground -----

global.coneSource = coneSource;
global.mapper = mapper;
global.actor = actor;
global.renderer = ren;
global.renderWindow = renWin;
