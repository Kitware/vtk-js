import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkLookupTable from 'vtk.js/Sources/Common/Core/LookupTable';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

import baseline from './testCategoricalColors.png';

test.onlyIfWebGL('Test Categorical Colors', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkLookupTable TestCategoricalColors');
  // testUtils.keepDOM();

  // Create some control UI
  const container = document.querySelector('body');
  const renderWindowContainer = gc.registerDOMElement(
    document.createElement('div')
  );
  container.appendChild(renderWindowContainer);

  // create what we will view
  const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
  const renderer = gc.registerResource(vtkRenderer.newInstance());
  renderWindow.addRenderer(renderer);
  renderer.setBackground(0.32, 0.34, 0.43);

  const actor = gc.registerResource(vtkActor.newInstance());
  actor.getProperty().setEdgeVisibility(true);
  actor.getProperty().setEdgeColor(1.0, 0.5, 0.5);
  renderer.addActor(actor);

  const mapper = gc.registerResource(vtkMapper.newInstance());
  actor.setMapper(mapper);

  const lut = vtkLookupTable.newInstance();
  lut.setIndexedLookup(true);
  lut.setAnnotation(1.0, 'One');
  lut.setAnnotation(2.0, 'Two');
  lut.setAnnotation(10.0, 'Ten');
  lut.setAnnotation(100.0, 'Many');
  lut.setAnnotation(1000.0, 'Lots');
  lut.setAnnotation(10000.0, 'Wowza');
  lut.removeAnnotation(2.0);
  lut.setNumberOfColors(4);
  mapper.setLookupTable(lut);

  // hand create a plane with special scalars
  const pd = gc.registerResource(vtkPolyData.newInstance());
  const res = 10;

  // Points
  const points = new Float32Array(res * res * 3);
  pd.getPoints().setData(points, 3);

  // Cells
  let cellLocation = 0;
  const polys = new Uint32Array(8 * (res - 1) * (res - 1));
  pd.getPolys().setData(polys, 1);

  // Scalars
  const scalars = new Float32Array(res * res);

  for (let i = 0; i < res; i++) {
    for (let j = 0; j < res; j++) {
      const idx = i * res + j;
      points[idx * 3] = j;
      points[idx * 3 + 1] = i;
      points[idx * 3 + 2] = 0.0;
      scalars[idx] = 10.0 ** Math.floor(j / 2);
      // also add nan for some data
      if (i === 4) {
        scalars[idx] = NaN;
      }
    }
  }

  for (let i = 0; i < res - 1; i++) {
    for (let j = 0; j < res - 1; j++) {
      const idx = i * res + j;
      polys[cellLocation++] = 3;
      polys[cellLocation++] = idx;
      polys[cellLocation++] = idx + 1;
      polys[cellLocation++] = idx + res;
      polys[cellLocation++] = 3;
      polys[cellLocation++] = idx + 1;
      polys[cellLocation++] = idx + res + 1;
      polys[cellLocation++] = idx + res;
    }
  }

  const da = gc.registerResource(
    vtkDataArray.newInstance({ numberOfComponents: 1, values: scalars })
  );
  pd.getPointData().setScalars(da);

  mapper.setInputData(pd);
  mapper.setInterpolateScalarsBeforeMapping(true);

  // now create something to view it, in this case webgl
  const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline],
      'Common/Core/LookupTable/testCategoricalColors',
      t,
      2,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
