import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkLookupTable from 'vtk.js/Sources/Common/Core/LookupTable';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkScalarBarActor from 'vtk.js/Sources/Rendering/Core/ScalarBarActor';

import baseline from './testScalarBar.png';
import baseline2 from './testScalarBar2.png';

test('Test ScalarBar', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkLookupTable TestScalarBar');

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

  const lut = gc.registerResource(
    vtkLookupTable.newInstance({
      mappingRange: [0, 70],
      hueRange: [0.5, 1],
      saturationRange: [1, 1],
      valueRange: [1, 0],
      nanColor: [0.6627450980392157, 0.6627450980392157, 0.6627450980392157, 1],
      belowRangeColor: [0, 0, 0, 1],
      aboveRangeColor: [1, 1, 1, 1],
      useAboveRangeColor: true,
      useBelowRangeColor: true,
      alpha: 1,
      vectorSize: -1,
      vectorComponent: 0,
      vectorMode: 1,
      indexedLookup: 0,
    })
  );
  // // Table should always be a Uint8Array
  // // numberOfComponents should always be 4 (RGBA)
  // // numberOfTuples (size / numberOfComponents, the number of indexd colors) does not have to equal the number of annotations --
  // //   if fewer, the table wraps around
  // //   if more, the extra values are not used
  // // dataType should always be 'Uint8Array'
  const numberOfColors = 7;
  const table = vtkDataArray.newInstance({
    numberOfComponents: 4,
    size: 4 * numberOfColors,
    dataType: 'Uint8Array',
  });
  table.setTuple(0, [68, 1, 84, 255]);
  table.setTuple(1, [68, 57, 130, 255]);
  table.setTuple(2, [48, 103, 141, 255]);
  table.setTuple(3, [32, 144, 140, 255]);
  table.setTuple(4, [53, 183, 120, 255]);
  table.setTuple(5, [144, 214, 67, 255]);
  table.setTuple(6, [253, 231, 36, 255]);
  lut.setTable(table);
  lut.build();

  const scalarBarActor = vtkScalarBarActor.newInstance();
  renderer.addActor(scalarBarActor);
  scalarBarActor.setAxisLabel('Test ScalarBar');
  scalarBarActor.setScalarsToColors(lut);
  scalarBarActor.setDrawBelowRangeSwatch(true);
  scalarBarActor.setDrawAboveRangeSwatch(true);
  scalarBarActor.setDrawNanAnnotation(true);
  scalarBarActor.setAutomated(false);
  scalarBarActor.setBoxPosition(-1.0, -0.5);
  scalarBarActor.setBoxSize(2.0, 1.0);

  // now create something to view it, in this case webgl
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);
  renderer.resetCamera();
  renderWindow.render();

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline, baseline2],
      'Common/Core/LookupTable/testScalarBar',
      t,
      5,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
