import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkLight from 'vtk.js/Sources/Rendering/Core/Light';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

import vtkFPSMonitor from 'vtk.js/Sources/Interaction/UI/FPSMonitor';

// import controlPanel from './controller.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0.1, 0.1, 0.1],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

const fpsMonitor = vtkFPSMonitor.newInstance();
const fpsElm = fpsMonitor.getFpsMonitorContainer();
fpsElm.style.position = 'absolute';
fpsElm.style.left = '10px';
fpsElm.style.bottom = '10px';
fpsElm.style.background = 'rgba(255,255,255,0.5)';
fpsElm.style.borderRadius = '5px';

fpsMonitor.setContainer(document.querySelector('body'));
fpsMonitor.setRenderWindow(renderWindow);

fullScreenRenderer.setResizeCallback(fpsMonitor.update);

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const sphereSource = vtkSphereSource.newInstance({
  center: [0, 0, 0],
  height: 1.0,
});
sphereSource.setThetaResolution(64);
sphereSource.setPhiResolution(32);

const mapper = vtkMapper.newInstance();
mapper.setInputConnection(sphereSource.getOutputPort());

const objectCount = 5;

for (let r = 0; r < objectCount; r++) {
  for (let c = 0; c < objectCount; c++) {
    const actor = vtkActor.newInstance();
    actor.setMapper(mapper);
    actor.setPosition(0.0, 0.0, 0.0);

    // Setting PBR values
    actor.setPosition(c * 1.2, r * 1.2, 0.0);

    actor.getProperty().setRoughness(0.2 + c / objectCount);
    actor.getProperty().setMetallic(r / objectCount);
    actor.getProperty().setBaseIOR(1.45);
    actor.getProperty().setDiffuseColor(1.0, 0.3, 0.2);

    renderer.addActor(actor);
  }
}

// Adding the point lights
const light1 = vtkLight.newInstance();
light1.setPosition(-1, -1, objectCount);
light1.setColor(1, 0.5, 0.5);
light1.setIntensity(objectCount * objectCount);
light1.setPositional(true);
light1.setConeAngle(100);

const light2 = vtkLight.newInstance();
light2.setPosition(-1, objectCount * 1.2, objectCount);
light2.setColor(0.5, 1, 0.5);
light2.setIntensity(objectCount * objectCount);
light2.setPositional(true);
light2.setConeAngle(100);

const light3 = vtkLight.newInstance();
light3.setPosition(objectCount * 1.2, -1, objectCount);
light3.setColor(0.5, 0.5, 1);
light3.setIntensity(objectCount * objectCount);
light3.setPositional(true);
light3.setConeAngle(100);

const light4 = vtkLight.newInstance();
light4.setPosition(objectCount * 1.2, objectCount * 1.2, objectCount);
light4.setColor(1, 1, 1);
light4.setIntensity(objectCount * objectCount);
light4.setPositional(true);
light4.setConeAngle(100);

renderer.addLight(light1);
renderer.addLight(light2);
renderer.addLight(light3);
renderer.addLight(light4);

// Adding the directional light
const light5 = vtkLight.newInstance();
light5.setDirection([0, 1, -1]);
light5.setColor(1, 1, 1);
light5.setIntensity(1);
renderer.addLight(light5);

renderer.resetCamera();
renderWindow.render();

fpsMonitor.update();

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = sphereSource;
global.mapper = mapper;
global.renderer = renderer;
global.renderWindow = renderWindow;
