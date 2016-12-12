import vtkActor                   from '../../../../../Sources/Rendering/Core/Actor';
import vtkCamera                  from '../../../../../Sources/Rendering/Core/Camera';
import vtkDataArray               from '../../../../../Sources/Common/Core/DataArray';
import vtkPoints                  from '../../../../../Sources/Common/Core/Points';
import vtkPolyData                from '../../../../../Sources/Common/DataModel/PolyData';
import vtkPlaneSource             from '../../../../../Sources/Filters/Sources/PlaneSource';
import vtkCalculator              from '../../../../../Sources/Filters/General/Calculator';
import vtkWarpScalar              from '../../../../../Sources/Filters/General/WarpScalar';
import vtkMapper                  from '../../../../../Sources/Rendering/Core/Mapper';
import { VTK_COLOR_MODE, VTK_SCALAR_MODE } from '../../../../../Sources/Rendering/Core/Mapper/Constants';
import vtkOpenGLRenderWindow      from '../../../../../Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderer                from '../../../../../Sources/Rendering/Core/Renderer';
import vtkRenderWindow            from '../../../../../Sources/Rendering/Core/RenderWindow';
import vtkRenderWindowInteractor  from '../../../../../Sources/Rendering/Core/RenderWindowInteractor';
import { AttributeTypes }         from '../../../../../Sources/Common/DataModel/DataSetAttributes/Constants';
import { FieldDataTypes }         from '../../../../../Sources/Common/DataModel/DataSet/Constants';

import controlPanel from './controlPanel.html';

// Create some control UI
const rootContainer = document.querySelector('body');
rootContainer.innerHTML = controlPanel;
const renderWindowContainer = document.querySelector('.renderwidow');
// ----------------------

const ren = vtkRenderer.newInstance();
ren.setBackground(1.00, 1.00, 1.00);

const renWin = vtkRenderWindow.newInstance();
renWin.addRenderer(ren);

const glwindow = vtkOpenGLRenderWindow.newInstance();
glwindow.setContainer(renderWindowContainer);
renWin.addView(glwindow);
glwindow.setSize(600,400);

const iren = vtkRenderWindowInteractor.newInstance();
iren.setView(glwindow);

const planeActor = vtkActor.newInstance();
planeActor.getProperty().setEdgeVisibility(true);
ren.addActor(planeActor);

const planeMapper = vtkMapper.newInstance({ colorMode: VTK_COLOR_MODE.DEFAULT, scalarMode: VTK_SCALAR_MODE.DEFAULT });
planeActor.setMapper(planeMapper);

const warpActor = vtkActor.newInstance();
ren.addActor(warpActor);

const warpMapper = vtkMapper.newInstance({ scalarVisibility: false });
warpActor.setMapper(warpMapper);

const cam = vtkCamera.newInstance();
ren.setActiveCamera(cam);
cam.setFocalPoint(0.5, 0.5, 0.5);
cam.setPosition(4, 4, 4);
cam.setViewUp(0, 0, 1);
cam.setClippingRange(0.1, 50.0);

const planeSource = vtkPlaneSource.newInstance({ xResolution: 15, yResolution: 15 });
const simpleFilter = vtkCalculator.newInstance();
simpleFilter.setInputConnection(planeSource.getOutputPort());
simpleFilter.setFormulaSimple(
  FieldDataTypes.POINT, // Generate an output array defined over points.
  [],  // We don't request any point-data arrays because point coordinates are made available by default.
  'z', // Name the output array "z"
  x => ((x[0] - 0.5) * (x[0] - 0.5)) + ((x[1] - 0.5) * (x[1] - 0.5)) + 0.125
); // Our formula for z

// The generated 'z' array will become the default scalars, so the plane mapper will color by 'z':
planeMapper.setInputConnection(simpleFilter.getOutputPort());

// We will also generate a surface whose points are displaced from the plane by 'z':
const warpScalar = vtkWarpScalar.newInstance();
warpScalar.setInputConnection(simpleFilter.getOutputPort());
warpScalar.setInputArrayToProcess(0, 'z', 'PointData', 'Scalars');
warpMapper.setInputConnection(warpScalar.getOutputPort());

iren.initialize();
iren.bindEvents(renderWindowContainer, document);
ren.resetCamera();
renWin.render();
iren.start();

// ----- JavaScript UI -----

['xResolution', 'yResolution'].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    const value = Number(e.target.value);
    planeSource.set({ [propertyName]: value });
    renWin.render();
  });
});

['scaleFactor'].forEach((propertyName) => {
  document.querySelector(`.${propertyName}`).addEventListener('input', (e) => {
    const value = Number(e.target.value);
    warpScalar.set({ [propertyName]: value });
    renWin.render();
  });
});

document.querySelector('.formula').addEventListener('input', (e) => {
  let fn = null;
  try {
    fn = new Function('x,y', `return ${e.target.value}`);
  } catch (exc) {
    if (!('name' in exc && exc.name === 'SyntaxError')) {
      console.log('Unexpected exception ', exc);
      e.target.style.background = '#fbb';
      return;
    }
  }
  if (fn) {
    e.target.style.background = '#fff';
    const formulaObj = simpleFilter.createSimpleFormulaObject(
      FieldDataTypes.POINT, [], 'z', fn);

    // See if the formula is actually valid by invoking "formulaObj" on
    // a dataset containing a single point.
    planeSource.update();
    const arraySpec = formulaObj.getArrays(planeSource.getOutputData());
    const testData = vtkPolyData.newInstance();
    const testPts = vtkPoints.newInstance();
    testPts.setData(
      vtkDataArray.newInstance({ name: 'coords', numberOfComponents: 3, size:3, values: [0,0,0] }));
    testData.setPoints(testPts);
    const testOut = vtkPolyData.newInstance();
    testOut.shallowCopy(testData);
    const testArrays = simpleFilter.prepareArrays(arraySpec, testData, testOut);
    try {
      formulaObj.evaluate(testArrays.arraysIn, testArrays.arraysOut);

      // We evaluated 1 point without exception... it's safe to update the
      // filter and re-render.
      simpleFilter.setFormula(formulaObj);
      renWin.render();
      return;
    } catch (exc) {
      console.log('Unexpected exception ', exc);
    }
  }
  e.target.style.background = '#ffb';
});

// ----- Console play ground -----

global.planeSource = planeSource;
global.planeMapper = planeMapper;
global.planeActor = planeActor;
global.simpleFilter = simpleFilter;
global.warpMapper = warpMapper;
global.warpActor = warpActor;
global.renderer = ren;
global.renderWindow = renWin;
