import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkCalculator from 'vtk.js/Sources/Filters/General/Calculator';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkSphereMapper from 'vtk.js/Sources/Rendering/Core/SphereMapper';

import { AttributeTypes } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';
import { FieldDataTypes } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';

import baseline from './testDisableScalarColoring.png';

test.onlyIfWebGL('Test vtkSphereMapper Rendering', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkSphereMapper Rendering');

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

  const mapper = gc.registerResource(vtkSphereMapper.newInstance());
  actor.setMapper(mapper);

  const coneSource = gc.registerResource(
    vtkConeSource.newInstance({ height: 1.0 })
  );

  const scalarRange = [1000000, -1000000];

  const filter = gc.registerResource(vtkCalculator.newInstance());
  filter.setInputConnection(coneSource.getOutputPort());
  filter.setFormula({
    getArrays: (inputDataSets) => ({
      input: [{ location: FieldDataTypes.COORDINATE }],
      output: [
        {
          location: FieldDataTypes.POINT,
          name: 'distance magnitude',
          dataType: 'Float32Array',
          attribute: AttributeTypes.SCALARS,
        },
      ],
    }),
    evaluate: (arraysIn, arraysOut) => {
      const [coords] = arraysIn.map((d) => d.getData());
      const [dmag] = arraysOut.map((d) => d.getData());

      for (let i = 0, sz = coords.length / 3; i < sz; ++i) {
        const idx = i * 3;
        const [x, y, z] = [coords[idx], coords[idx + 1], coords[idx + 2]];
        dmag[i] = Math.sqrt(x * x + y * y + z * z);
        if (dmag[i] > scalarRange[1]) {
          scalarRange[1] = dmag[i];
        }
        if (dmag[i] < scalarRange[0]) {
          scalarRange[0] = dmag[i];
        }
      }
      arraysOut.forEach((arr) => arr.modified());
    },
  });

  coneSource.update();
  filter.update();

  mapper.setInputConnection(filter.getOutputPort());

  console.log(
    `Setting mapper scalar range to [${scalarRange[0]}, ${scalarRange[1]}]`
  );
  mapper.setScalarRange(scalarRange);
  mapper.setColorByArrayName('distance magnitude');
  mapper.setColorModeToMapScalars();
  mapper.setScalarVisibility(true);

  // now create something to view it, in this case webgl
  const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  renderWindow.render();

  // Now disable scalar coloring and make sure we get back to gray
  mapper.setScalarVisibility(false);
  mapper.setColorByArrayName(null);

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline],
      'Rendering/Core/SphereMapper/testDisableScalarColoring',
      t,
      1.0,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
