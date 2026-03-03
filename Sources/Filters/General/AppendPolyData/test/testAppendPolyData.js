import { it, expect } from 'vitest';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkAppendPolyData from 'vtk.js/Sources/Filters/General/AppendPolyData';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkCylinderSource from 'vtk.js/Sources/Filters/Sources/CylinderSource';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkCalculator from 'vtk.js/Sources/Filters/General/Calculator';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';

import {
  AttributeTypes,
  DesiredOutputPrecision,
} from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';
import { FieldDataTypes } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';
import { VtkDataTypes } from 'vtk.js/Sources/Common/Core/DataArray/Constants';

import baseline from './testAppendPolyData.png';

it('Test vtkAppendPolyData instance', () => {
  expect(vtkAppendPolyData).toBeTruthy();
  const instance = vtkAppendPolyData.newInstance();
  expect(instance).toBeTruthy();
});

it('Test vtkAppendPolyData execution', () => {
  const cone = vtkConeSource.newInstance({ resolution: 6, capping: true });
  const cylinder = vtkCylinderSource.newInstance({
    resolution: 6,
    capping: true,
  });
  const filter = vtkAppendPolyData.newInstance();
  filter.setInputConnection(cone.getOutputPort(), 0);
  filter.addInputConnection(cylinder.getOutputPort());
  filter.setOutputPointsPrecision(DesiredOutputPrecision.DEFAULT);

  const outPD = filter.getOutputData();

  expect(outPD.getPoints().getNumberOfPoints() === 31).toBeTruthy();
  expect(outPD.getPoints().getDataType() === VtkDataTypes.DOUBLE).toBeTruthy();
  const expNumPolys = [cone, cylinder].reduce(
    (count, c) => count + c.getOutputData().getPolys().getNumberOfCells(),
    0
  );
  const outNumPolys = outPD.getPolys().getNumberOfCells();
  expect(outNumPolys === expNumPolys).toBeTruthy();
});

it('Test addInputData edge case', () => {
  const appender = vtkAppendPolyData.newInstance();
  const input = vtkPolyData.newInstance();

  appender.addInputData(input);
  const output = appender.getOutputData();

  expect(input === output).toBeTruthy();
  expect(appender.getNumberOfInputPorts() === 1).toBeTruthy();

  const input2 = vtkPolyData.newInstance();
  appender.addInputData(input2);
  const output2 = appender.getOutputData();

  expect(output2 !== input && output2 !== input2).toBeTruthy();

  expect(appender.getNumberOfInputPorts() === 2).toBeTruthy();
});

it.skipIf(__VTK_TEST_NO_WEBGL__)('Test vtkAppendPolyData rendering', () => {
  const gc = testUtils.createGarbageCollector();
  expect('rendering').toBeTruthy();

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

  const mapper = gc.registerResource(vtkMapper.newInstance());
  actor.setMapper(mapper);

  const calc = vtkCalculator.newInstance();
  calc.setFormula({
    getArrays: (inputDataSets) => ({
      input: [],
      output: [
        {
          location: FieldDataTypes.POINT,
          name: 'Scalars',
          dataType: 'Float32Array',
          attribute: AttributeTypes.SCALARS,
        },
      ],
    }),
    evaluate: (arraysIn, arraysOut) => {
      const [scalars] = arraysOut.map((d) => d.getData());
      for (let i = 0; i < scalars.length; i++) {
        scalars[i] = i * 0.01;
      }
    },
  });

  const plane = vtkPlaneSource.newInstance({ xResolution: 5, yResolution: 10 });
  calc.setInputConnection(plane.getOutputPort());
  const plane2 = vtkPlaneSource.newInstance({
    xResolution: 10,
    yResolution: 5,
  });
  plane2.setOrigin(0.5, 0, -0.5);
  plane2.setPoint1(0.5, 0, 0.5);
  plane2.setPoint2(0.5, 1, -0.5);
  const calc2 = vtkCalculator.newInstance();
  calc2.setFormula(calc.getFormula());
  calc2.setInputConnection(plane2.getOutputPort());

  const filter = vtkAppendPolyData.newInstance();
  filter.setInputConnection(calc2.getOutputPort());
  filter.addInputConnection(calc.getOutputPort());
  mapper.setInputConnection(filter.getOutputPort());

  // now create something to view it, in this case webgl
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  const camera = renderer.getActiveCamera();
  camera.yaw(40);
  camera.roll(40);
  camera.azimuth(40);
  renderer.resetCamera();

  const promise = glwindow
    .captureNextImage()
    .then((image) =>
      testUtils.compareImages(
        image,
        [baseline],
        'Filters/General/AppendPolyData/testAppendPolyData',
        2.5
      )
    )
    .finally(gc.releaseResources);
  renderWindow.render();
  return promise;
});
