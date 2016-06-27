import vtkOpenGLRenderWindow from '../../../../../Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from '../../../../../Sources/Rendering/Core/RenderWindow';
import vtkRenderer from '../../../../../Sources/Rendering/Core/Renderer';
import vtkRenderWindowInteractor from '../../../../../Sources/Rendering/Core/RenderWindowInteractor';
import vtkHttpSceneLoader from '../../../../../Sources/IO/Core/HttpSceneLoader';

// Create some control UI
const container = document.querySelector('body');
const renderWindowContainer = document.createElement('div');
container.appendChild(renderWindowContainer);

// create what we will view
const renWin = vtkRenderWindow.newInstance();
const renderer = vtkRenderer.newInstance();
renWin.addRenderer(renderer);

// now create something to view it, in this case webgl
// with mouse/touch interaction
const glwindow = vtkOpenGLRenderWindow.newInstance();
glwindow.setSize(300, 300);
glwindow.setContainer(renderWindowContainer);
renWin.addView(glwindow);

const iren = vtkRenderWindowInteractor.newInstance();
iren.setView(glwindow);

// initialize the interaction and bind event handlers
// to the HTML elements
iren.initialize();
iren.bindEvents(renderWindowContainer, document);

// ----------------------------------------------------------------------------
/* global __BASE_PATH__ */
// ----------------------------------------------------------------------------

const sceneImporter = vtkHttpSceneLoader.newInstance({ renderer, fetchGzip: true });
sceneImporter.setUrl(`${__BASE_PATH__}/data/scene`);
sceneImporter.onReady(() => {
  renWin.render();
});

