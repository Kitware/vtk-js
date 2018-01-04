import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkOutlineFilter from 'vtk.js/Sources/Filters/General/OutlineFilter';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkImageStreamline from 'vtk.js/Sources/Filters/General/ImageStreamline';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import { Representation } from 'vtk.js/Sources/Rendering/Core/Property/Constants';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import macro from 'vtk.js/Sources/macro';

import controlPanel from './controller.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

function addRepresentation(name, filter, props = {}) {
  const mapper = vtkMapper.newInstance();
  mapper.setInputConnection(filter.getOutputPort());

  const actor = vtkActor.newInstance();
  actor.setMapper(mapper);
  actor.getProperty().set(props);
  renderer.addActor(actor);

  global[`${name}Actor`] = actor;
  global[`${name}Mapper`] = mapper;
}

// ----------------------------------------------------------------------------

const vecSource = macro.newInstance((publicAPI, model) => {
  macro.obj(publicAPI, model); // make it an object
  macro.algo(publicAPI, model, 0, 1); // mixin algorithm code 1 in, 1 out
  publicAPI.requestData = (inData, outData) => {
    // implement requestData
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
            newArray[i++] = v * v;
            newArray[i++] = 0;
          }
        }
      }

      const da = vtkDataArray.newInstance({
        numberOfComponents: 3,
        values: newArray,
      });
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

const outlineFilter = vtkOutlineFilter.newInstance();
outlineFilter.setInputConnection(vecSource.getOutputPort());

addRepresentation('streamLine', sline, {
  diffuseColor: [0, 1, 1],
  lineWidth: 5,
});
addRepresentation('outline', outlineFilter, {
  diffuseColor: [1, 0, 0],
  lineWidth: 3,
});
addRepresentation('seed', planeSource, {
  representation: Representation.POINTS,
  pointSize: 10,
});

// -----------------------------------------------------------

renderer.resetCamera();
renderWindow.render();

// ----------------------------------------------------------------------------
// UI control handling
// ----------------------------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

['xResolution', 'yResolution'].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    const value = Number(e.target.value);
    planeSource.set({ [propertyName]: value });
    renderWindow.render();
  });
});

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.planeSource = planeSource;
global.sline = sline;
global.outlineFilter = outlineFilter;
global.renderer = renderer;
global.renderWindow = renderWindow;
