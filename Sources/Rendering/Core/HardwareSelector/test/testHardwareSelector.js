import test from 'tape';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkCalculator from 'vtk.js/Sources/Filters/General/Calculator';
import { AttributeTypes } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';
import {
  FieldDataTypes,
  FieldAssociations,
} from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';

test('Test HardwareSelector', (tapeContext) => {
  const gc = testUtils.createGarbageCollector(tapeContext);
  tapeContext.ok('rendering', 'vtkHardwareSelector TestHardwareSelector');

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

  // Plane in the middle ----------------------------------
  const PlaneSource = gc.registerResource(
    vtkPlaneSource.newInstance({ xResolution: 5, yResolution: 10 })
  );

  const mapper = gc.registerResource(vtkMapper.newInstance());
  mapper.setInputConnection(PlaneSource.getOutputPort());

  const actor = gc.registerResource(vtkActor.newInstance());
  actor.setMapper(mapper);

  renderer.addActor(actor);

  // Sphere lower left ----------------------------------
  const SphereSource = gc.registerResource(vtkSphereSource.newInstance());

  const mapper2 = gc.registerResource(vtkMapper.newInstance());
  mapper2.setInputConnection(SphereSource.getOutputPort());

  const actor2 = gc.registerResource(vtkActor.newInstance());
  actor2.setMapper(mapper2);

  renderer.addActor(actor2);

  // Sphere edges upper right ----------------------------------
  const mapper3 = gc.registerResource(vtkMapper.newInstance());
  mapper3.setInputConnection(SphereSource.getOutputPort());

  const actor3 = gc.registerResource(vtkActor.newInstance());
  actor3.setMapper(mapper3);
  actor3.getProperty().setEdgeVisibility(true);
  actor3.getProperty().setEdgeColor(1.0, 0.5, 0.5);
  actor3.getProperty().setDiffuseColor(0.5, 1.0, 0.5);
  actor3.getProperty().setOpacity(0.8);
  actor3.setPosition(1.0, 1.0, 1.0);
  renderer.addActor(actor3);
  const ConeSource = gc.registerResource(vtkConeSource.newInstance());
  const filter = vtkCalculator.newInstance();

  filter.setInputConnection(ConeSource.getOutputPort());
  filter.setFormula({
    getArrays: (inputDataSets) => ({
      input: [],
      output: [
        {
          location: FieldDataTypes.CELL,
          name: 'Random',
          dataType: 'Float32Array',
          attribute: AttributeTypes.SCALARS,
        },
      ],
    }),
    evaluate: (arraysIn, arraysOut) => {
      const [scalars] = arraysOut.map((d) => d.getData());
      for (let i = 0; i < scalars.length; i++) {
        scalars[i] = Math.random();
      }
    },
  });
  const mapper4 = gc.registerResource(vtkMapper.newInstance());
  mapper4.setInputConnection(filter.getOutputPort());
  const actor4 = gc.registerResource(vtkActor.newInstance());
  actor4.setMapper(mapper4);
  actor4.getProperty().setOpacity(0.5);
  actor4.setPosition(1.0, 1.0, 1.25);
  renderer.addActor(actor4);

  // now create something to view it, in this case webgl
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);
  renderWindow.render();

  const sel = glwindow.getSelector();
  sel.setFieldAssociation(FieldAssociations.FIELD_ASSOCIATION_POINTS);
  sel.setCaptureZValues(true);

  const promises = [];
  promises.push(
    sel.selectAsync(renderer, 200, 200, 300, 300).then((res) => {
      // res[1] should be at 1.0, 1.0, 1.5 in world coords
      const allGood =
        res.length === 3 &&
        res[0].getProperties().prop === actor4 &&
        res[1].getProperties().prop === actor &&
        res[2].getProperties().prop === actor3 &&
        Math.abs(res[2].getProperties().worldPosition[0] - 1.0) < 0.02 &&
        Math.abs(res[2].getProperties().worldPosition[1] - 1.0) < 0.02 &&
        Math.abs(res[2].getProperties().worldPosition[2] - 1.5) < 0.02;

      tapeContext.ok(res.length === 3, 'Three props selected');
      tapeContext.ok(allGood, 'Correct props were selected');
    })
  );

  Promise.all(promises).then(() => {
    gc.releaseResources();
  });
});
