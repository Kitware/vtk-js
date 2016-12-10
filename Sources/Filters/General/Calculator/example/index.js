import vtkActor                   from '../../../../../Sources/Rendering/Core/Actor';
import vtkCamera                  from '../../../../../Sources/Rendering/Core/Camera';
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
const coordFilter = vtkCalculator.newInstance({
  formula: {
    getArrays: (inputDataSets) => ({
      input: [
        { location: FieldDataTypes.COORDINATE }],
      output: [
        { location: FieldDataTypes.POINT, name: 'x' },
        { location: FieldDataTypes.POINT, name: 'y', attribute: AttributeTypes.SCALARS },
      ]}),
    evaluate: (arraysIn, arraysOut) => {
      const [coords] = arraysIn.map(d => d.getData());
      const [x, y] = arraysOut.map(d => d.getData());

      for (let i = 0, sz = coords.length / 3; i < sz; ++i) {
        x[i] = coords[3 * i];
        y[i] = coords[3 * i + 1];
      }
      arraysOut.forEach(arr => arr.modified());
    },
  },
});
coordFilter.setInputConnection(planeSource.getOutputPort());
const simpleFilter = vtkCalculator.newInstance();
simpleFilter.setInputConnection(coordFilter.getOutputPort());
simpleFilter.setFormulaSimple(
  FieldDataTypes.POINT,
  ['x', 'y'],
  'z',
  (x, y) => ((x - 0.5) * (x - 0.5)) + ((y - 0.5) * (y - 0.5)) + 0.125);
planeMapper.setInputConnection(simpleFilter.getOutputPort());
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
    const didChange = simpleFilter.setFormulaSimple(
      FieldDataTypes.POINT, ['x', 'y'], 'z', fn);
    renWin.render();
  } else {
    e.target.style.background = '#ffb';
  }
});

// ----- Console play ground -----

global.planeSource = planeSource;
global.planeMapper = planeMapper;
global.planeActor = planeActor;
global.coordFilter = coordFilter;
global.simpleFilter = simpleFilter;
global.warpMapper = warpMapper;
global.warpActor = warpActor;
global.renderer = ren;
global.renderWindow = renWin;
