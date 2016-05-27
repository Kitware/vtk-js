import vtkActor                   from '../../../../../Sources/Rendering/Core/Actor';
import vtkCamera                  from '../../../../../Sources/Rendering/Core/Camera';
import vtkHttpDataSetReader       from '../../../../../Sources/IO/Core/HttpDataSetReader';
import vtkMapper                  from '../../../../../Sources/Rendering/Core/Mapper';
import vtkOpenGLRenderWindow      from '../../../../../Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderer                from '../../../../../Sources/Rendering/Core/Renderer';
import vtkRenderWindow            from '../../../../../Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor  from '../../../../../Sources/Rendering/Core/RenderWindowInteractor';

/* global __BASE_PATH__ */
const datasetToLoad = `${__BASE_PATH__}/data/cow.vtp`;

// Create some control UI
const renderWindowContainer = document.querySelector('body');
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
cam.setPosition(0, 0, 25);
cam.setClippingRange(0.1, 50.0);

const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: true });
mapper.setInputConnection(reader.getOutputPort());

iren.initialize();
iren.bindEvents(renderWindowContainer, document);
iren.start();

// ---- Fetch geometry ----------
// Server is not sending the .gz and whith the compress header
// Need to fetch the true file name and uncompress it locally
reader.setUrl(datasetToLoad).then(() => {
  reader.loadData().then(() => {
    renWin.render();
  });
});

global.reader = reader;
