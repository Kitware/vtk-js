import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkCalculator from '@kitware/vtk.js/Filters/General/Calculator';
import vtkConeSource from '@kitware/vtk.js/Filters/Sources/ConeSource';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkOpenGLHardwareSelector from '@kitware/vtk.js/Rendering/OpenGL/HardwareSelector';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import { AttributeTypes } from '@kitware/vtk.js/Common/DataModel/DataSetAttributes/Constants';
import {
  FieldDataTypes,
  FieldAssociations,
} from '@kitware/vtk.js/Common/DataModel/DataSet/Constants';
import vtkSphereSource from '@kitware/vtk.js/Filters/Sources/SphereSource';

import vtkFPSMonitor from '@kitware/vtk.js/Interaction/UI/FPSMonitor';

import controlPanel from './controller.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
const openGLRenderWindow = fullScreenRenderer.getApiSpecificRenderWindow();

const fpsMonitor = vtkFPSMonitor.newInstance();
const fpsElm = fpsMonitor.getFpsMonitorContainer();
fpsElm.style.position = 'absolute';
fpsElm.style.left = '10px';
fpsElm.style.bottom = '10px';
fpsElm.style.background = 'rgba(255,255,255,0.5)';
fpsElm.style.borderRadius = '5px';

const container = document.querySelector('body');
fpsMonitor.setContainer(container);
fpsMonitor.setRenderWindow(renderWindow);

fullScreenRenderer.setResizeCallback(fpsMonitor.update);

const selector = vtkOpenGLHardwareSelector.newInstance({
  captureZValues: true,
});
selector.setFieldAssociation(FieldAssociations.FIELD_ASSOCIATION_POINTS);
selector.attach(openGLRenderWindow, renderer);
// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
// create a filter on the fly, sort of cool, this is a random scalars
// filter we create inline, for a simple cone you would not need
// this
// ----------------------------------------------------------------------------

const coneSource = vtkConeSource.newInstance({
  center: [0, 1, 1000],
  height: 1.0,
});

const filter = vtkCalculator.newInstance();

filter.setInputConnection(coneSource.getOutputPort());
// filter.setFormulaSimple(FieldDataTypes.CELL, [], 'random', () => Math.random());
filter.setFormula({
  getArrays: (inputDataSets) => ({
    input: [],
    output: [
      {
        location: FieldDataTypes.CELL,
        name: 'Random',
        dataType: 'Float32Array',
        attribute: AttributeTypes.SCALARS,
      },
    ],
  }),
  evaluate: (arraysIn, arraysOut) => {
    const [scalars] = arraysOut.map((d) => d.getData());
    for (let i = 0; i < scalars.length; i++) {
      scalars[i] = Math.random();
    }
  },
});

const mapper = vtkMapper.newInstance();
mapper.setInputConnection(filter.getOutputPort());

const actor = vtkActor.newInstance();
actor.setMapper(mapper);

const sphereSource = vtkSphereSource.newInstance({
  center: [0, 1, 1000],
  radius: 0.02,
});
const mapper1 = vtkMapper.newInstance();
mapper1.setInputConnection(sphereSource.getOutputPort());
const actor1 = vtkActor.newInstance();
actor1.setMapper(mapper1);
actor1.getProperty().setColor([0.95, 0.45, 0.95]);
renderer.addActor(actor1);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();
fpsMonitor.update();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);
const representationSelector = document.querySelector('.representations');
const resolutionChange = document.querySelector('.resolution');
const pickInfo = document.getElementById('pickInfo');

representationSelector.addEventListener('change', (e) => {
  const newRepValue = Number(e.target.value);
  actor.getProperty().setRepresentation(newRepValue);
  renderWindow.render();
  fpsMonitor.update();
});

resolutionChange.addEventListener('input', (e) => {
  const resolution = Number(e.target.value);
  coneSource.setResolution(resolution);
  renderWindow.render();
  fpsMonitor.update();
});

function handlePicking(xp, yp, tolerance) {
  const x1 = Math.floor(xp - tolerance);
  const y1 = Math.floor(yp - tolerance);
  const x2 = Math.ceil(xp + tolerance);
  const y2 = Math.ceil(yp + tolerance);

  selector.setArea(x1, y1, x2, y2);

  if (selector.captureBuffers()) {
    const pos = [xp, yp];
    const outSelectedPosition = [0, 0];
    const info = selector.getPixelInformation(
      pos,
      tolerance,
      outSelectedPosition
    );

    if (info == null || info.prop == null) return [];

    const startPoint = openGLRenderWindow.displayToWorld(
      Math.round((x1 + x2) / 2),
      Math.round((y1 + y2) / 2),
      0,
      renderer
    );

    const endPoint = openGLRenderWindow.displayToWorld(
      Math.round((x1 + x2) / 2),
      Math.round((y1 + y2) / 2),
      1,
      renderer
    );

    const ray = [Array.from(startPoint), Array.from(endPoint)];

    const worldPosition = Array.from(
      openGLRenderWindow.displayToWorld(
        info.displayPosition[0],
        info.displayPosition[1],
        info.zValue,
        renderer
      )
    );

    const displayPosition = [
      info.displayPosition[0],
      info.displayPosition[1],
      info.zValue,
    ];

    const selection = [];
    selection[0] = {
      worldPosition,
      displayPosition,
      compositeID: info.compositeID,
      ...info.prop.get('representationId'),
      ray,
    };
    return selection;
  }
  return [];
}

function getScreenEventPositionFor(source) {
  const bounds = container.getBoundingClientRect();
  const [canvasWidth, canvasHeight] = openGLRenderWindow.getSize();
  const scaleX = canvasWidth / bounds.width;
  const scaleY = canvasHeight / bounds.height;
  const position = {
    x: scaleX * (source.clientX - bounds.left),
    y: scaleY * (bounds.height - source.clientY + bounds.top),
    z: 0,
  };
  return position;
}

function onMouseDown(e) {
  if (e !== undefined) {
    const sc = getScreenEventPositionFor(e);
    const e1 = handlePicking(sc.x, sc.y, 10);
    if (e1.length === 0) {
      console.warn('e1 null', e1);
      return;
    }
    let pickInfoText = `Screen Position: ${sc.x}, ${sc.y} \nPick Info:\n`;
    pickInfoText += `${JSON.stringify(e1[0], null, 10)}`;
    pickInfo.innerHTML = pickInfoText;
    console.log(pickInfoText);

    sphereSource.setCenter(e1[0].worldPosition);
    renderWindow.render();
    fpsMonitor.update();
  }
}

container.addEventListener('mousedown', onMouseDown);

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = coneSource;
global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
