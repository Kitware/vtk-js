import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkLookupTable from 'vtk.js/Sources/Common/Core/LookupTable';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

import baseline from './testSetTable.png';

test.onlyIfWebGL('Test LookupTable setTable', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkLookupTable TestSetTable');
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

  const res = 10;

  const lut = vtkLookupTable.newInstance();
  lut.setIndexedLookup(true);
  const annotations = new Uint8Array(res);
  for (let i = 0; i < res; i++) {
    annotations[i] = i * 3;
  }
  // Set the annotations to be the annotation values. Another option is to use
  // separate annotation strings.
  lut.setAnnotations(annotations, annotations);
  // Table should always be a Uint8Array
  // numberOfComponents should always be 4 (RGBA)
  // numberOfTuples (size / numberOfComponents, the number of indexd colors) does not have to equal the number of annotations --
  //   if fewer, the table wraps around
  //   if more, the extra values are not used
  // dataType should always be 'Uint8Array'
  const numberOfColors = 8;
  const table = vtkDataArray.newInstance({
    numberOfComponents: 4,
    size: 4 * numberOfColors,
    dataType: 'Uint8Array',
  });
  table.setTuple(0, [215, 0, 0, 255]);
  table.setTuple(1, [140, 60, 255, 255]);
  table.setTuple(2, [2, 136, 0, 255]);
  table.setTuple(3, [0, 172, 199, 255]);
  table.setTuple(4, [152, 255, 0, 255]);
  table.setTuple(5, [255, 127, 209, 255]);
  table.setTuple(6, [108, 0, 79, 255]);
  table.setTuple(7, [255, 165, 48, 255]);
  lut.setTable(table);

  t.equal(lut.getNumberOfColors(), numberOfColors);

  mapper.setLookupTable(lut);

  // hand create a plane with special scalars
  const pd = gc.registerResource(vtkPolyData.newInstance());

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
      scalars[idx] = j * 3;
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
  mapper.setInterpolateScalarsBeforeMapping(false);

  // now create something to view it, in this case webgl
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline],
      'Common/Core/LookupTable/testSetTable',
      t,
      5,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
