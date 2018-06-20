import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkCalculator from 'vtk.js/Sources/Filters/General/Calculator';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkConeSource from 'vtk.js/Sources/Filters/Sources/ConeSource';
import vtkGlyph3DMapper from 'vtk.js/Sources/Rendering/Core/Glyph3DMapper';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';

import { AttributeTypes } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';
import { FieldDataTypes } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';

import baseline from './testGlyph3DMapper.png';

test.onlyIfWebGL('Test vtkGlyph3DMapper Rendering', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkGlyph3DMapper Rendering');

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

  const planeSource = vtkPlaneSource.newInstance();
  const simpleFilter = vtkCalculator.newInstance();
  const mapper = vtkGlyph3DMapper.newInstance();
  const actor = vtkActor.newInstance();

  simpleFilter.setFormula({
    getArrays: (inputDataSets) => ({
      input: [{ location: FieldDataTypes.COORDINATE }], // Require point coordinates as input
      output: [
        // Generate two output arrays:
        {
          location: FieldDataTypes.POINT, // This array will be point-data ...
          name: 'pressure', // ... with the given name ...
          dataType: 'Float32Array', // ... of this type ...
          numberOfComponents: 3, // ... with this many components ...
        },
        {
          location: FieldDataTypes.POINT, // This array will be field data ...
          name: 'temperature', // ... with the given name ...
          dataType: 'Float32Array', // ... of this type ...
          attribute: AttributeTypes.SCALARS, // ... and will be marked as the default scalars.
          numberOfComponents: 1, // ... with this many components ...
        },
      ],
    }),
    evaluate: (arraysIn, arraysOut) => {
      // Convert in the input arrays of vtkDataArrays into variables
      // referencing the underlying JavaScript typed-data arrays:
      const [coords] = arraysIn.map((d) => d.getData());
      const [press, temp] = arraysOut.map((d) => d.getData());

      // Since we are passed coords as a 3-component array,
      // loop over all the points and compute the point-data output:
      for (let i = 0, sz = coords.length / 3; i < sz; ++i) {
        press[i * 3] = (coords[3 * i] - 0.5) * (coords[3 * i] - 0.5);
        press[i * 3 + 1] =
          ((coords[3 * i + 1] - 0.5) * (coords[3 * i + 1] - 0.5) + 0.125) * 0.1;
        press[i * 3 + 2] =
          ((coords[3 * i] - 0.5) * (coords[3 * i] - 0.5) +
            (coords[3 * i + 1] - 0.5) * (coords[3 * i + 1] - 0.5) +
            0.125) *
          0.1;
        temp[i] = coords[3 * i + 1] * 0.1;
      }
      // Mark the output vtkDataArray as modified
      arraysOut.forEach((x) => x.modified());
    },
  });

  // The generated 'temperature' array will become the default scalars, so the plane mapper will color by 'temperature':
  simpleFilter.setInputConnection(planeSource.getOutputPort());

  mapper.setInputConnection(simpleFilter.getOutputPort(), 0);

  const coneSource = vtkConeSource.newInstance();
  coneSource.setResolution(12);
  mapper.setInputConnection(coneSource.getOutputPort(), 1);
  mapper.setOrientationArray('pressure');
  mapper.setScalarRange(0.0, 0.1);

  actor.setMapper(mapper);
  renderer.addActor(actor);
  renderer.resetCamera();
  renderer.getActiveCamera().zoom(1.3);

  // now create something to view it, in this case webgl
  const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  renderWindow.render();

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline],
      'Rendering/Core/Glyph3DMapper/testGlyph3DMapper',
      t,
      1.0,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
