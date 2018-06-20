import test from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCalculator from 'vtk.js/Sources/Filters/General/Calculator';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkSphereMapper from 'vtk.js/Sources/Rendering/Core/SphereMapper';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';

import { AttributeTypes } from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';
import { FieldDataTypes } from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';

import baseline from './testSphere.png';

test.onlyIfWebGL('Test SphereMapper', (t) => {
  const gc = testUtils.createGarbageCollector(t);
  t.ok('rendering', 'vtkOpenGLSphereMapper testSphere');

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

  // ----------------------------------------------------------------------------
  // Test code
  // ----------------------------------------------------------------------------

  const planeSource = gc.registerResource(vtkPlaneSource.newInstance());
  const simpleFilter = gc.registerResource(vtkCalculator.newInstance());
  const mapper = gc.registerResource(vtkSphereMapper.newInstance());
  const actor = gc.registerResource(vtkActor.newInstance());

  simpleFilter.setFormula({
    getArrays: (inputDataSets) => ({
      input: [{ location: FieldDataTypes.COORDINATE }], // Require point coordinates as input
      output: [
        // Generate two output arrays:
        {
          location: FieldDataTypes.POINT, // This array will be point-data ...
          name: 'pressure', // ... with the given name ...
          dataType: 'Float32Array', // ... of this type ...
          numberOfComponents: 1, // ... with this many components ...
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
        press[i] =
          ((coords[3 * i] - 0.5) * (coords[3 * i] - 0.5) +
            (coords[3 * i + 1] - 0.5) * (coords[3 * i + 1] - 0.5) +
            0.125) *
          0.1;
        temp[i] = coords[3 * i + 1];
      }
      // Mark the output vtkDataArray as modified
      arraysOut.forEach((x) => x.modified());
    },
  });

  // The generated 'temperature' array will become the default scalars, so the plane mapper will color by 'temperature':
  simpleFilter.setInputConnection(planeSource.getOutputPort());

  mapper.setInputConnection(simpleFilter.getOutputPort());
  mapper.setScaleArray('pressure');

  actor.setMapper(mapper);

  renderer.addActor(actor);
  renderer.resetCamera();
  renderWindow.render();

  // -----------------------------------------------------------
  // Make some variables global so that you can inspect and
  // modify objects in your browser's developer console:
  // -----------------------------------------------------------

  // create something to view it, in this case webgl
  const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  glwindow.captureNextImage().then((image) => {
    testUtils.compareImages(
      image,
      [baseline],
      'Rendering/OpenGL/SphereMapper',
      t,
      1,
      gc.releaseResources
    );
  });
  renderWindow.render();
});
