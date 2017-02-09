import test      from 'tape-catch';
import testUtils from 'vtk.js/Sources/Testing/testUtils';

import vtkActor              from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCalculator         from 'vtk.js/Sources/Filters/General/Calculator';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkPlaneSource        from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkRenderer           from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow       from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkStickMapper        from 'vtk.js/Sources/Rendering/Core/StickMapper';

import { AttributeTypes }    from 'vtk.js/Sources/Common/DataModel/DataSetAttributes/Constants';
import { FieldDataTypes }    from 'vtk.js/Sources/Common/DataModel/DataSet/Constants';

import baseline from './testStick.png';

test.onlyIfWebGL('Test StickMapper', (t) => {
  t.ok('rendering', 'vtkOpenGLStickMapper testStick');

  // Create some control UI
  const container = document.querySelector('body');
  const renderWindowContainer = document.createElement('div');
  container.appendChild(renderWindowContainer);

  // create what we will view
  const renderWindow = vtkRenderWindow.newInstance();
  const renderer = vtkRenderer.newInstance();
  renderWindow.addRenderer(renderer);
  renderer.setBackground(0.32, 0.34, 0.43);

  // ----------------------------------------------------------------------------
  // Test code
  // ----------------------------------------------------------------------------

  const planeSource = vtkPlaneSource.newInstance();
  const simpleFilter = vtkCalculator.newInstance();
  const mapper = vtkStickMapper.newInstance();
  const actor = vtkActor.newInstance();

  simpleFilter.setFormula({
    getArrays: inputDataSets => ({
      input: [
        { location: FieldDataTypes.COORDINATE }], // Require point coordinates as input
      output: [ // Generate two output arrays:
        {
          location: FieldDataTypes.POINT,   // This array will be point-data ...
          name: 'orientation',                // ... with the given name ...
          dataType: 'Float32Array',         // ... of this type ...
          numberOfComponents: 3,            // ... with this many components ...
        },
        {
          location: FieldDataTypes.POINT, // This array will be field data ...
          name: 'temperature',                   // ... with the given name ...
          dataType: 'Float32Array',         // ... of this type ...
          attribute: AttributeTypes.SCALARS, // ... and will be marked as the default scalars.
          numberOfComponents: 1,            // ... with this many components ...
        },
        {
          location: FieldDataTypes.POINT, // This array will be field data ...
          name: 'pressure',                   // ... with the given name ...
          dataType: 'Float32Array',         // ... of this type ...
          numberOfComponents: 2,            // ... with this many components ...
        },
      ],
    }),
    evaluate: (arraysIn, arraysOut) => {
      // Convert in the input arrays of vtkDataArrays into variables
      // referencing the underlying JavaScript typed-data arrays:
      const [coords] = arraysIn.map(d => d.getData());
      const [orient, temp, press] = arraysOut.map(d => d.getData());

      // Since we are passed coords as a 3-component array,
      // loop over all the points and compute the point-data output:
      for (let i = 0, sz = coords.length / 3; i < sz; ++i) {
        orient[i * 3] = ((coords[3 * i] - 0.5) * (coords[3 * i] - 0.5)) + ((coords[(3 * i) + 1] - 0.5) * (coords[(3 * i) + 1] - 0.5));
        orient[(i * 3) + 1] = ((coords[3 * i] - 0.5) * (coords[3 * i] - 0.5)) + ((coords[(3 * i) + 1] - 0.5) * (coords[(3 * i) + 1] - 0.5));
        orient[(i * 3) + 2] = 1.0;

        temp[i] = coords[(3 * i) + 1];

        press[(i * 2)] = ((((coords[3 * i]) * (coords[3 * i])) + ((coords[(3 * i) + 1]) * (coords[(3 * i) + 1]))) * 0.05) + 0.05;
        press[(i * 2) + 1] = ((((coords[3 * i]) * (coords[3 * i])) + ((coords[(3 * i) + 1]) * (coords[(3 * i) + 1]))) * 0.01) + 0.01;
      }
      // Mark the output vtkDataArray as modified
      arraysOut.forEach(x => x.modified());
    },
  });

  // The generated 'temperature' array will become the default scalars, so the plane mapper will color by 'temperature':
  simpleFilter.setInputConnection(planeSource.getOutputPort());

  mapper.setInputConnection(simpleFilter.getOutputPort());

  mapper.setOrientationArray('orientation');
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
  const glwindow = vtkOpenGLRenderWindow.newInstance();
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(400, 400);

  const image = glwindow.captureImage();

  testUtils.compareImages(image, [baseline], 'Rendering/OpenGL/StickMapper/', t);
});
