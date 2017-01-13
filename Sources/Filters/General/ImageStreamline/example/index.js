import vtkOpenGLRenderWindow from '../../../../../Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from '../../../../../Sources/Rendering/Core/RenderWindow';
import vtkRenderer from '../../../../../Sources/Rendering/Core/Renderer';
import vtkOutlineFilter from '../../../../../Sources/Filters/General/OutlineFilter';
import vtkPlaneSource from '../../../../../Sources/Filters/Sources/PlaneSource';
import vtkImageStreamline from '../../../../../Sources/Filters/General/ImageStreamline';
import vtkActor from '../../../../../Sources/Rendering/Core/Actor';
import vtkMapper from '../../../../../Sources/Rendering/Core/Mapper';
import vtkRenderWindowInteractor from '../../../../../Sources/Rendering/Core/RenderWindowInteractor';
import vtkDataArray from '../../../../../Sources/Common/Core/DataArray';
import vtkImageData from '../../../../../Sources/Common/DataModel/ImageData';
import * as macro     from '../../../../../Sources/macro';

import controlPanel from './controller.html';

/* global document */

// Create some control UI
const container = document.querySelector('body');
const controlContainer = document.createElement('div');
const renderWindowContainer = document.createElement('div');
container.appendChild(controlContainer);
container.appendChild(renderWindowContainer);
controlContainer.innerHTML = controlPanel;

// create what we will view
const renWin = vtkRenderWindow.newInstance();
const ren = vtkRenderer.newInstance();
renWin.addRenderer(ren);
ren.setBackground(0.32, 0.34, 0.43);

const actor = vtkActor.newInstance();
ren.addActor(actor);

const mapper = vtkMapper.newInstance();
actor.setMapper(mapper);

const vecSource = macro.newInstance((publicAPI, model) => {
  macro.obj(publicAPI, model); // make it an object
  macro.algo(publicAPI, model, 0, 1); // mixin algorithm code 1 in, 1 out
  publicAPI.requestData = (inData, outData) => { // implement requestData
    if (!outData[0]) {
      const id = vtkImageData.newInstance();
      id.setSpacing(0.1, 0.1, 0.1);
      id.setExtent(0, 9, 0, 9, 0, 9);
      const dims = [10, 10, 10];

      const newArray = new Float32Array(3 * dims[0] * dims[1] * dims[2]);

      let i = 0;
      for (let z = 0; z <= 9; z++) {
        for (let y = 0; y <= 9; y++) {
          for (let x = 0; x <= 9; x++) {
            newArray[i++] = 0.1 * x;
            const v = 0.1 * y;
            newArray[i++] = (v * v);
            newArray[i++] = 0;
          }
        }
      }

      const da = vtkDataArray.newInstance({ numberOfComponents: 3, values: newArray });
      da.setName('vectors');

      const cpd = id.getPointData();
      cpd.setVectors(da);

      // Update output
      outData[0] = id;
    }
  };
})();

const planeSource = vtkPlaneSource.newInstance();
planeSource.setOrigin(0.05, 0.05, 0.05);
planeSource.setPoint1(0.05, 0.85, 0.05);
planeSource.setPoint2(0.05, 0.05, 0.85);

const sline = vtkImageStreamline.newInstance();
sline.setIntegrationStep(0.01);
sline.setInputConnection(vecSource.getOutputPort());
sline.setInputConnection(planeSource.getOutputPort(), 1);

mapper.setInputConnection(sline.getOutputPort());

const outlineFilter = vtkOutlineFilter.newInstance();
outlineFilter.setInputConnection(vecSource.getOutputPort());

const actor2 = vtkActor.newInstance();
ren.addActor(actor2);

const mapper2 = vtkMapper.newInstance();
actor2.setMapper(mapper2);

mapper2.setInputConnection(outlineFilter.getOutputPort());

// now create something to view it, in this case webgl
// with mouse/touch interaction
const glwindow = vtkOpenGLRenderWindow.newInstance();
glwindow.setSize(800, 600);
glwindow.setContainer(renderWindowContainer);
renWin.addView(glwindow);

const iren = vtkRenderWindowInteractor.newInstance();
iren.setView(glwindow);

// initialize the interaction and bind event handlers
// to the HTML elements
iren.initialize();
iren.bindEvents(renderWindowContainer, document);

// ----- JavaScript UI -----

['xResolution', 'yResolution'].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    const value = Number(e.target.value);
    planeSource.set({ [propertyName]: value });
    console.log(planeSource.getXResolution());
    console.log(planeSource.getYResolution());
    renWin.render();
  });
});

global.mapper = mapper;
global.actor = actor;
