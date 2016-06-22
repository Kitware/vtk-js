import vtkOpenGLRenderWindow from '../../../Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from '../../../Sources/Rendering/Core/RenderWindow';
import vtkRenderer from '../../../Sources/Rendering/Core/Renderer';
import vtkSphereSource from '../../../Sources/Filters/Sources/SphereSource';
import vtkImageGridSource from '../../../Sources/Filters/Sources/ImageGridSource';
import vtkActor from '../../../Sources/Rendering/Core/Actor';
import vtkTexture from '../../../Sources/Rendering/Core/Texture';
import vtkMapper from '../../../Sources/Rendering/Core/Mapper';
import vtkRenderWindowInteractor from '../../../Sources/Rendering/Core/RenderWindowInteractor';
import vtkDataArray from '../../../Sources/Common/Core/DataArray';
import vtkPolyData from '../../../Sources/Common/DataModel/PolyData';
import * as macro     from '../../../Sources/macro';

import controlPanel from './controller.html';

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

const sphereSource = vtkSphereSource.newInstance();
sphereSource.setThetaResolution(64);
sphereSource.setPhiResolution(32);

// create a filter on the fly to generate tcoords from normals
const tcoordFilter = macro.newInstance((publicAPI, model) => {
  macro.obj(publicAPI, model); // make it an object
  macro.algo(publicAPI, model, 1, 1); // mixin algorithm code 1 in, 1 out
  publicAPI.requestData = (inData, outData) => { // implement requestData
    if (!outData[0] || inData[0].getMTime() > outData[0].getMTime()) {
      // use the normals to generate tcoords :-)
      const norms = inData[0].getPointData().getNormals();

      const newArray = new Float32Array(norms.getNumberOfTuples() * 2);
      const ndata = norms.getData();
      for (let i = 0; i < newArray.length; i += 2) {
        newArray[i] = Math.abs(Math.atan2(ndata[i / 2 * 3], ndata[i / 2 * 3 + 1])) / 3.1415927;
        newArray[i + 1] = Math.asin(ndata[i / 2 * 3 + 2]) / 3.1415927 + 0.5;
      }

      const da = vtkDataArray.newInstance({ tuple: 2, values: newArray });
      da.setName('tcoord');

      const pd = vtkPolyData.newInstance();
      pd.setPolys(inData[0].getPolys());
      pd.setPoints(inData[0].getPoints());
      const cpd = pd.getPointData();
      cpd.addArray(da);
      cpd.setActiveTCoords(da.getName());
      outData[0] = pd;
    }
  };
})();

tcoordFilter.setInputConnection(sphereSource.getOutputPort());
mapper.setInputConnection(tcoordFilter.getOutputPort());

const gridSource = vtkImageGridSource.newInstance();
gridSource.setDataExtent(0, 511, 0, 511, 0, 0);
gridSource.setGridSpacing(16, 16, 0);
gridSource.setGridOrigin(8, 8, 0);
const texture = vtkTexture.newInstance();
texture.setInterpolate(true);
texture.setInputConnection(gridSource.getOutputPort());
actor.addTexture(texture);

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
