import vtkFullScreenRenderWindow from '../../../Sources/Testing/FullScreenRenderWindow';

import vtkActor           from '../../../Sources/Rendering/Core/Actor';
import vtkCalculator      from '../../../Sources/Filters/General/Calculator';
import vtkConeSource      from '../../../Sources/Filters/Sources/ConeSource';
import vtkDataArray       from '../../../Sources/Common/Core/DataArray';
import vtkMapper          from '../../../Sources/Rendering/Core/Mapper';
import vtkPolyData        from '../../../Sources/Common/DataModel/PolyData';
import { AttributeTypes } from '../../../Sources/Common/DataModel/DataSetAttributes/Constants';
import { FieldDataTypes } from '../../../Sources/Common/DataModel/DataSet/Constants';

import controlPanel from './controller.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------
// create a filter on the fly, sort of cool, this is a random scalars
// filter we create inline, for a simple cone you would not need
// this
// ----------------------------------------------------------------------------

const coneSource = vtkConeSource.newInstance({ height: 1.0 });
const filter = vtkCalculator.newInstance();

filter.setInputConnection(coneSource.getOutputPort());
// filter.setFormulaSimple(FieldDataTypes.CELL, [], 'random', () => Math.random());
filter.setFormula({
  getArrays: inputDataSets => ({
    input: [],
    output: [
      { location: FieldDataTypes.CELL, name: 'Random', dataType: 'Float32Array', attribute: AttributeTypes.SCALARS },
    ],
  }),
  evaluate: (arraysIn, arraysOut) => {
    const [scalars] = arraysOut.map(d => d.getData());
    for (let i = 0; i < scalars.length; i++) {
      scalars[i] = Math.random();
    }
  },
});

const mapper = vtkMapper.newInstance();
mapper.setInputConnection(filter.getOutputPort());

const actor = vtkActor.newInstance();
actor.setMapper(mapper);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// UI control handling
// -----------------------------------------------------------

fullScreenRenderer.addController(controlPanel);
const representationSelector = document.querySelector('.representations');
const resolutionChange = document.querySelector('.resolution');

representationSelector.addEventListener('change', (e) => {
  const newRepValue = Number(e.target.value);
  actor.getProperty().setRepresentation(newRepValue);
  renderWindow.render();
});

resolutionChange.addEventListener('input', (e) => {
  const resolution = Number(e.target.value);
  coneSource.setResolution(resolution);
  renderWindow.render();
});

// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
global.source = coneSource;
global.mapper = mapper;
global.actor = actor;
