import vtkOpenGLRenderWindow from '../../../Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from '../../../Sources/Rendering/Core/RenderWindow';
import vtkRenderer from '../../../Sources/Rendering/Core/Renderer';
import vtkConeSource from '../../../Sources/Filters/Sources/ConeSource';
import vtkActor from '../../../Sources/Rendering/Core/Actor';
import vtkMapper from '../../../Sources/Rendering/Core/Mapper';
import vtkRenderWindowInteractor from '../../../Sources/Rendering/Core/RenderWindowInteractor';
import vtkDataArray from '../../../Sources/Common/Core/DataArray';
import vtkPolyData from '../../../Sources/Common/DataModel/PolyData';
import * as macro     from '../../../Sources/macro';

import controlPanel from './controller.html';

/* global document */

// Create some control UI
const container = document.querySelector('body');
const controlContainer = document.createElement('div');
const renderWindowContainer = document.createElement('div');
container.appendChild(controlContainer);
container.appendChild(renderWindowContainer);
controlContainer.innerHTML = controlPanel;

const representationSelector = document.querySelector('.representations');
const resolutionChange = document.querySelector('.resolution');

// create what we will view
const renWin = vtkRenderWindow.newInstance();
const ren = vtkRenderer.newInstance();
renWin.addRenderer(ren);
ren.setBackground(0.32, 0.34, 0.43);

const actor = vtkActor.newInstance();
ren.addActor(actor);

const mapper = vtkMapper.newInstance();
actor.setMapper(mapper);

const coneSource = vtkConeSource.newInstance({ height: 1.0 });

// create a filter on the fly, sort of cool, this is a random scalars
// filter we create inline, for a simple cone you would not need
// this
const randFilter = macro.newInstance((publicAPI, model) => {
  macro.obj(publicAPI, model); // make it an object
  macro.algo(publicAPI, model, 1, 1); // mixin algorithm code 1 in, 1 out
  publicAPI.requestData = (inData, outData) => { // implement requestData
    if (!outData[0] || inData[0].getMTime() > outData[0].getMTime()) {
      const newArray = new Float32Array(coneSource.getResolution() + 1);
      for (let i = 0; i < newArray.length; i++) {
        newArray[i] = Math.random();
      }

      const da = vtkDataArray.newInstance({ values: newArray });
      da.setName('temp');

      const pd = vtkPolyData.newInstance();
      pd.setPolys(inData[0].getPolys());
      pd.setPoints(inData[0].getPoints());
      // const cpd = pd.getPointData();
      const cpd = pd.getCellData();
      cpd.addArray(da);
      cpd.setActiveScalars(da.getName());
      outData[0] = pd;
    }
  };
})();

randFilter.setInputConnection(coneSource.getOutputPort());
mapper.setInputConnection(randFilter.getOutputPort());

// now create something to view it, in this case webgl
// with mouse/touch interaction
const glwindow = vtkOpenGLRenderWindow.newInstance();
glwindow.setSize(500, 400);
glwindow.setContainer(renderWindowContainer);
renWin.addView(glwindow);

const iren = vtkRenderWindowInteractor.newInstance();
iren.setView(glwindow);

// initialize the interaction and bind event handlers
// to the HTML elements
iren.initialize();
iren.bindEvents(renderWindowContainer, document);

// ----------------

representationSelector.addEventListener('change', e => {
  const newRepValue = Number(e.target.value);
  actor.getProperty().setRepresentation(newRepValue);
  renWin.render();
});

resolutionChange.addEventListener('input', e => {
  const resolution = Number(e.target.value);
  coneSource.setResolution(resolution);
  renWin.render();
});

global.source = coneSource;
global.mapper = mapper;
global.actor = actor;
