import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtk from 'vtk.js/Sources/vtk';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
  background: [0, 0, 0],
});
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Inline PolyData definition
// ----------------------------------------------------------------------------

// prettier-ignore
const polydata = vtk({
  vtkClass: 'vtkPolyData',
  points: {
    vtkClass: 'vtkPoints',
    dataType: 'Float32Array',
    numberOfComponents: 3,
    values: [
      0, 0, 0,
      1, 0, 0.25,
      1, 1, 0,
      0, 1, 0.25,
    ],
  },
  polys: {
    vtkClass: 'vtkCellArray',
    dataType: 'Uint16Array',
    values: [
      3, 0, 1, 2,
      3, 0, 2, 3,
    ],
  },
  pointData: {
    vtkClass: 'vtkDataSetAttributes',
    activeScalars: 0,
    arrays: [{
      data: {
        vtkClass: 'vtkDataArray',
        name: 'pointScalars',
        dataType: 'Float32Array',
        values: [0, 1, 0, 1],
      },
    }],
  },
  cellData: {
    vtkClass: 'vtkDataSetAttributes',
    activeScalars: 0,
    arrays: [{
      data: {
        vtkClass: 'vtkDataArray',
        name: 'cellScalars',
        dataType: 'Float32Array',
        values: [0, 1],
      },
    }],
  },
});

const mapper = vtkMapper.newInstance({ interpolateScalarsBeforeMapping: true });
mapper.setInputData(polydata);

const lut = mapper.getLookupTable();
lut.setHueRange(0.666, 0);

const actor = vtkActor.newInstance();
actor.setMapper(mapper);

renderer.addActor(actor);
renderer.resetCamera();
renderWindow.render();

// -----------------------------------------------------------
// Make some variables global so that you can inspect and
// modify objects in your browser's developer console:
// -----------------------------------------------------------

global.source = polydata;
global.mapper = mapper;
global.actor = actor;
global.lut = lut;
global.renderer = renderer;
global.renderWindow = renderWindow;
