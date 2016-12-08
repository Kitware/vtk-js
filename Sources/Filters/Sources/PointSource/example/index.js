import vtkActor                   from '../../../../../Sources/Rendering/Core/Actor';
import vtkCamera                  from '../../../../../Sources/Rendering/Core/Camera';
import vtkPointSource             from '../../../../../Sources/Filters/Sources/PointSource';
import vtkMapper                  from '../../../../../Sources/Rendering/Core/Mapper';
import vtkOpenGLRenderWindow      from '../../../../../Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderer                from '../../../../../Sources/Rendering/Core/Renderer';
import vtkRenderWindow            from '../../../../../Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor  from '../../../../../Sources/Rendering/Core/RenderWindowInteractor';
import vtkMath                    from '../../../../../Sources/Common/Core/Math';

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
actor.getProperty().setPointSize(5);
ren.addActor(actor);

const mapper = vtkMapper.newInstance();
actor.setMapper(mapper);

const cam = vtkCamera.newInstance();
ren.setActiveCamera(cam);
cam.setFocalPoint(0, 0, 0);
cam.setPosition(0, 0, 4);
cam.setClippingRange(0.1, 50.0);

const pointSource = vtkPointSource.newInstance();
pointSource.setNumberOfPoints(25);
pointSource.setRadius(0.75);
vtkMath.randomSeed(141592);
pointSource.update();
mapper.setInputConnection(pointSource.getOutputPort());

iren.initialize();
iren.bindEvents(renderWindowContainer, document);
ren.resetCamera();
renWin.render();
console.log(actor.getBounds());
iren.start();

// ----- JavaScript UI -----

['numberOfPoints', 'radius'].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    const value = Number(e.target.value);
    pointSource.set({ [propertyName]: value });
    renWin.render();
  });
});

// ----- Console play ground -----
global.pointSource = pointSource;
global.mapper = mapper;
global.actor = actor;
global.renderer = ren;
global.renderWindow = renWin;
