import vtkActor                   from '../../../../../Sources/Rendering/Core/Actor';
import vtkCamera                  from '../../../../../Sources/Rendering/Core/Camera';
import vtkLineSource              from '../../../../../Sources/Filters/Sources/LineSource';
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
actor.getProperty().setEdgeVisibility(true);
ren.addActor(actor);

const mapper = vtkMapper.newInstance();
actor.setMapper(mapper);

const cam = vtkCamera.newInstance();
ren.setActiveCamera(cam);
cam.setFocalPoint(0, 0, 0);
cam.setPosition(0, 0, 4);
cam.setClippingRange(0.1, 50.0);

const lineSource = vtkLineSource.newInstance();
mapper.setInputConnection(lineSource.getOutputPort());

iren.initialize();
iren.bindEvents(renderWindowContainer, document);
ren.resetCamera();
renWin.render();
iren.start();

// ----- JavaScript UI -----

['resolution'].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    const value = Number(e.target.value);
    lineSource.set({ [propertyName]: value });
    renWin.render();
  });
});
const mapping = 'xyz';
const points = [[0, 0, 0], [0, 0, 0]];
['x1', 'y1', 'z1', 'x2', 'y2', 'z2'].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    const value = Number(e.target.value);
    const pointIdx = Number(propertyName[1]);
    points[pointIdx - 1][mapping.indexOf(propertyName[0])] = value;
    lineSource.set({ [`point${pointIdx}`]: points[pointIdx - 1] });
    renWin.render();
  });
});

// ----- Console play ground -----

global.lineSource = lineSource;
global.mapper = mapper;
global.actor = actor;
global.renderer = ren;
global.renderWindow = renWin;
