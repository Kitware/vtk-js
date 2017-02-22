import test      from 'tape-catch';
// import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkOpenGLRenderWindow    from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow          from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer              from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkActor                 from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper                from 'vtk.js/Sources/Rendering/Core/Mapper';

// Factory imports
import vtk from 'vtk.js/Sources/vtk';
import 'vtk.js/Sources/Common/Core/Points';
import 'vtk.js/Sources/Common/Core/CellArray';
import 'vtk.js/Sources/Common/DataModel/DataSetAttributes';
import 'vtk.js/Sources/Common/DataModel/PolyData';

import colorMaps from '../ColorMaps.json';
// import baseline from './testColorTransferFunctionPreset.png';

const MAX_NUMBER_OF_PRESETS = 5;

function createScalarMap(offset, preset) {
  const polydata = vtk({
    vtkClass: 'vtkPolyData',
    points: {
      vtkClass: 'vtkPoints',
      dataType: 'Float32Array',
      numberOfComponents: 3,
      values: [
        offset, 0, 0,
        offset + 0.25, 0, 0,
        offset + 0.25, 1, 0,
        offset, 1, 0,
      ],
    },
    polys: {
      vtkClass: 'vtkCellArray',
      dataType: 'Uint16Array',
      values: [
        4, 0, 1, 2, 3,
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
          values: [0, 0, 1, 1],
        },
      }],
    },
  });

  const actor = vtkActor.newInstance();
  const mapper = vtkMapper.newInstance({ interpolateScalarsBeforeMapping: true });
  actor.setMapper(mapper);
  mapper.setInputData(polydata);
  actor.getProperty().set({ edgeVisibility: true, edgeColor: [1, 1, 1] });

  if (preset) {
    const lut = vtkColorTransferFunction.newInstance();
    lut.applyColorMap(preset);
    mapper.setLookupTable(lut);
  }

  return actor;
}

test.onlyIfWebGL('Test Interpolate Scalars Before Colors', (t) => {
  t.ok('rendering', 'vtkOpenGLPolyDataMapper ColorTransferFunction Presets');

  // Create some control UI
  const container = document.querySelector('body');
  const renderWindowContainer = document.createElement('div');
  container.appendChild(renderWindowContainer);

  // create what we will view
  const renderWindow = vtkRenderWindow.newInstance();
  const renderer = vtkRenderer.newInstance();
  renderWindow.addRenderer(renderer);
  renderer.setBackground(0.0, 0.0, 0.0);

  // Add one with default LUT
  renderer.addActor(createScalarMap(-0.5));

  let count = 0;
  colorMaps.forEach((preset, idx) => {
    if (preset.RGBPoints && count < MAX_NUMBER_OF_PRESETS) {
      console.log('add bar for', preset.Name);
      renderer.addActor(createScalarMap(count * 0.5, preset));
      count += 1;
    }
  });

  // now create something to view it, in this case webgl
  const glwindow = vtkOpenGLRenderWindow.newInstance();
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(200 * count, 400);

  const camera = renderer.getActiveCamera();
  renderer.resetCamera();
  camera.zoom(count / 2);
  renderWindow.render();

  // const image = glwindow.captureImage();

  // testUtils.compareImages(image, [baseline], 'Rendering/Core/ColorTransferFunction/', t);
});
