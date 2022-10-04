import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkSphereSource from 'vtk.js/Sources/Filters/Sources/SphereSource';
import { FieldAssociations } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';

const SIZE = 500;

function addActor(gc, renderer, size) {
  const actor = gc.registerResource(vtkActor.newInstance());
  renderer.addActor(actor);

  const mapper = gc.registerResource(vtkMapper.newInstance());
  actor.setMapper(mapper);

  const source = gc.registerResource(
    vtkSphereSource.newInstance({
      center: [Math.random(), Math.random(), 0],
      radius: 1 / Math.sqrt(size),
    })
  );
  mapper.setInputConnection(source.getOutputPort());
}

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

  // Add some content
  for (let i = 0; i < SIZE; i++) {
    addActor(gc, renderer, SIZE);
  }

  // now create something to view it, in this case webgl
  const glwindow = gc.registerResource(renderWindow.newAPISpecificView());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  console.time('first normal render');
  let previousTime = Date.now();
  glwindow.captureNextImage().then(() => {
    const taTime = Date.now() - previousTime;
    console.timeEnd('first normal render');

    console.time('second normal render');
    previousTime = Date.now();
    glwindow.captureNextImage().then(() => {
      const tbTime = Date.now() - previousTime;
      console.timeEnd('second normal render');

      const sel = glwindow.getSelector();
      sel.setFieldAssociation(FieldAssociations.FIELD_ASSOCIATION_POINTS);

      console.time('hardware render');
      previousTime = Date.now();
      sel.selectAsync(renderer, 200, 200, 300, 300).then((res) => {
        const tcTime = Date.now() - previousTime;
        console.timeEnd('hardware render');

        tapeContext.ok(
          // should take about 5 normal renders but we give it some wiggle room
          tcTime < tbTime * 10,
          `Hardware selector takes less than ten normal renders (${taTime}, ${tbTime}, ${tcTime})`
        );

        gc.releaseResources();
      });
    });
    renderWindow.render();
  });
  renderWindow.render();
});
