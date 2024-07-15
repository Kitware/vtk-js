import test from 'tape';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import 'vtk.js/Sources/Rendering/Profiles/Geometry';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkLookupTable from 'vtk.js/Sources/Common/Core/LookupTable';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';

import {
  ColorMode,
  ScalarMode,
} from 'vtk.js/Sources/Rendering/Core/Mapper/Constants';

import baseline from './testCellData.png';

test.onlyIfWebGL('Test Color Mapping With Cell Data', async (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkMapper CellData');

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
  renderer.addActor(actor);

  const nCells = 100;
  // These cells will have the value NaN
  const nanCellRange = [50, 60];
  // Range of the values in the cell data array
  const valuesRange = [-0.1, 1.1];
  // Range of the colors in the lookup table / transfer function
  const colorRange = [0, 1];

  const nanColor = [1.0, 0.5, 0.5, 1.0];
  const aboveRangeColor = [1, 1, 0, 1];
  const belowRangeColor = [0, 1, 1, 1];

  const points = new Float32Array(3 * 2 * (nCells + 1));
  for (let xIndex = 0, pointIndex = 0; xIndex <= nCells; ++xIndex) {
    const xValue = xIndex / nCells;

    points[pointIndex++] = xValue;
    points[pointIndex++] = 0;
    points[pointIndex++] = 0;

    points[pointIndex++] = xValue;
    points[pointIndex++] = 1;
    points[pointIndex++] = 0;
  }

  const polys = new Uint32Array(5 * nCells);
  const values = new Float32Array(nCells);
  for (let cellId = 0, cellIndex = 0; cellId < nCells; ++cellId) {
    polys[cellIndex++] = 4;
    polys[cellIndex++] = 2 * cellId;
    polys[cellIndex++] = 2 * cellId + 1;
    polys[cellIndex++] = 2 * cellId + 3;
    polys[cellIndex++] = 2 * cellId + 2;

    const interpolationValue = cellId / (nCells - 1);
    values[cellId] =
      valuesRange[0] + interpolationValue * (valuesRange[1] - valuesRange[0]);
  }

  for (let i = nanCellRange[0]; i < nanCellRange[1]; i++) {
    values[i] = NaN;
  }

  const dataArray = gc.registerResource(
    vtkDataArray.newInstance({
      name: 'data',
      numberOfComponents: 1,
      values,
    })
  );

  const polydata = gc.registerResource(vtkPolyData.newInstance());
  polydata.getPoints().setData(points, 3);
  polydata.getPolys().setData(polys, 1);
  polydata.getCellData().addArray(dataArray);

  const mapper = gc.registerResource(
    vtkMapper.newInstance({
      useLookupTableScalarRange: true,
      colorByArrayName: dataArray.getName(),
      colorMode: ColorMode.MAP_SCALARS,
      interpolateScalarsBeforeMapping: true,
      scalarMode: ScalarMode.USE_CELL_FIELD_DATA,
      scalarVisibility: true,
    })
  );
  mapper.setInputData(polydata);
  actor.setMapper(mapper);

  // Now create something to view it
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  function baselineTest(baselineImage) {
    return new Promise((resolve) => {
      glwindow.captureNextImage().then((image) => {
        testUtils.compareImages(
          image,
          [baselineImage],
          'Rendering/Core/Mapper/testCellData',
          t,
          {
            pixelThreshold: 0.01, // 1% (range is [0, 1])
            mismatchTolerance: 1, // 1% (raw percentage)
          },
          resolve
        );
      });
      renderWindow.render();
    });
  }

  // Using a color transfer function
  const transferFunction = gc.registerResource(
    vtkColorTransferFunction.newInstance()
  );
  transferFunction.setNanColorFrom(nanColor);
  transferFunction.setUseAboveRangeColor(true);
  transferFunction.setAboveRangeColorFrom(aboveRangeColor);
  transferFunction.setUseBelowRangeColor(true);
  transferFunction.setBelowRangeColorFrom(belowRangeColor);
  transferFunction.addRGBPointLong(0.0, 1.0, 0.0, 0.0, 0.5, 1.0);
  transferFunction.addRGBPointLong(0.5, 0.0, 1.0, 0.0, 0.5, 1.0);
  transferFunction.addRGBPointLong(1.0, 0.0, 0.0, 1.0, 0.5, 1.0);
  transferFunction.setMappingRange(...colorRange);
  transferFunction.updateRange();
  mapper.setLookupTable(transferFunction);
  await baselineTest(baseline);

  // Using a lookup table
  const lookupTable = gc.registerResource(vtkLookupTable.newInstance());
  lookupTable.setNanColorFrom(nanColor);
  lookupTable.setUseAboveRangeColor(true);
  lookupTable.setAboveRangeColorFrom(aboveRangeColor);
  lookupTable.setUseBelowRangeColor(true);
  lookupTable.setBelowRangeColorFrom(belowRangeColor);
  lookupTable.setNumberOfColors(nCells);
  lookupTable.setRange(...colorRange);
  lookupTable.setTable([
    [255, 0, 0, 255],
    [0, 255, 0, 255],
    [0, 0, 255, 255],
  ]);
  mapper.setLookupTable(lookupTable);
  await baselineTest(baseline);

  // Free memory, end the test
  gc.releaseResources();
});
