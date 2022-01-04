import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCalculator from 'vtk.js/Sources/Filters/General/Calculator';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import { AttributeTypes } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';
import { FieldDataTypes } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';

// Force DataAccessHelper to have access to various data source
import 'vtk.js/Sources/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import 'vtk.js/Sources/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import 'vtk.js/Sources/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

import controlPanel from './controller.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0, 255],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
// create a filter on the fly, sort of cool, this is a random scalars
// filter we create inline, for a simple cone you would not need
// this
// ----------------------------------------------------------------------------

const coneSource = vtkConeSource.newInstance({ height: 100, radius: 50 });
const filter = vtkCalculator.newInstance();

filter.setInputConnection(coneSource.getOutputPort());

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
actor.setPosition(0.0, 0.0, -20.0);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);
const arbutton = document.querySelector('.arbutton');
arbutton.disabled = !fullScreenRenderer
  .getApiSpecificRenderWindow()
  .getXrSupported();

const SESSION_IS_AR = true;
arbutton.addEventListener('click', (e) => {
  if (arbutton.textContent === 'Start AR') {
    fullScreenRenderer.setBackground([0, 0, 0, 0]);
    fullScreenRenderer.getApiSpecificRenderWindow().startXR(SESSION_IS_AR);
    arbutton.textContent = 'Exit AR';
  } else {
    fullScreenRenderer.setBackground([0, 0, 0, 255]);
    fullScreenRenderer.getApiSpecificRenderWindow().stopXR(SESSION_IS_AR);
    arbutton.textContent = 'Start AR';
  }
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = coneSource;
global.mapper = mapper;
global.actor = actor;
global.renderer = renderer;
global.renderWindow = renderWindow;
