import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkActor2D from 'vtk.js/Sources/Rendering/Core/Actor2D';
import vtkCalculator from 'vtk.js/Sources/Filters/General/Calculator';
import vtkCoordinate from 'vtk.js/Sources/Rendering/Core/Coordinate';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkMapper2D from 'vtk.js/Sources/Rendering/Core/Mapper2D';
import { AttributeTypes } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';
import { FieldDataTypes } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';
import { DisplayLocation } from 'vtk.js/Sources/Rendering/Core/Property2D/Constants';
import { Representation } from 'vtk.js/Sources/Rendering/Core/Property/Constants';

import vtkFPSMonitor from 'vtk.js/Sources/Interaction/UI/FPSMonitor';

import controlPanel from './controller.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
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

// fpsMonitor.setContainer(document.querySelector('body'));
// fpsMonitor.setRenderWindow(renderWindow);

fullScreenRenderer.setResizeCallback(fpsMonitor.update);

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
// create a filter on the fly, sort of cool, this is a random scalars
// filter we create inline, for a simple cone you would not need
// this
// ----------------------------------------------------------------------------

const coneSource = vtkConeSource.newInstance({
  resolution: 10,
});

const sphereSource = vtkSphereSource.newInstance({});

const filter = vtkCalculator.newInstance();

filter.setInputConnection(sphereSource.getOutputPort());
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
mapper.setInputConnection(coneSource.getOutputPort());
const mapper2D = vtkMapper2D.newInstance();
mapper2D.setInputConnection(filter.getOutputPort());
const c = vtkCoordinate.newInstance();
c.setCoordinateSystemToWorld();
mapper2D.setTransformCoordinate(c);
mapper2D.setScalarVisibility(false);

const actor = vtkActor.newInstance();
actor.setMapper(mapper);
actor.getProperty().setEdgeVisibility(true);
actor.getProperty().setEdgeColor([0.5, 0, 0.6]);
actor.getProperty().setLineWidth(3);
const actor2D = vtkActor2D.newInstance();
actor2D.setMapper(mapper2D);
actor2D.getProperty().setColor([1, 0, 0]);
actor2D.getProperty().setOpacity(0.5);
actor2D.getProperty().setLineWidth(3);
actor2D.getProperty().setDisplayLocation(DisplayLocation.FOREGROUND);
actor2D.getProperty().setRepresentation(Representation.SURFACE);

renderer.addActor(actor);
renderer.addActor2D(actor2D);
renderer.resetCamera();
renderWindow.render();
fpsMonitor.update();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);
const representationSelector = document.querySelector('.representations');
const resolutionChange = document.querySelector('.resolution');

representationSelector.addEventListener('change', (e) => {
  const newRepValue = Number(e.target.value);
  actor2D.getProperty().setRepresentation(newRepValue);
  actor.getProperty().setRepresentation(newRepValue);
  renderWindow.render();
  fpsMonitor.update();
});

resolutionChange.addEventListener('input', (e) => {
  const resolution = Number(e.target.value);
  sphereSource.setThetaResolution(resolution);
  coneSource.setResolution(resolution);
  renderWindow.render();
  fpsMonitor.update();
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = coneSource;
global.mapper = mapper;
global.actor = actor;
global.sphereSource = sphereSource;
global.mapper2D = mapper2D;
global.actor2D = actor2D;
global.renderer = renderer;
global.renderWindow = renderWindow;
