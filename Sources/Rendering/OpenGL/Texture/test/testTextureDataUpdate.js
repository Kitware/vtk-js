/* eslint-disable no-await-in-loop */
import test from 'tape';
import testUtils from 'vtk.js/Sources/Testing/testUtils';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkPlaneSource from 'vtk.js/Sources/Filters/Sources/PlaneSource';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';

test.onlyIfWebGL(
  'Test Texture Data Update Without GL_INVALID_OPERATION',
  async (t) => {
    const gc = testUtils.createGarbageCollector();

    // Helper function to check for GL errors
    // Dont want to see GL_INVALID_OPERATION: glTexStorage2D: Texture is immutable.
    function checkGLError(gl) {
      const error = gl.getError();
      if (error !== gl.NO_ERROR) {
        const errorMsg =
          error === gl.INVALID_OPERATION
            ? 'GL_INVALID_OPERATION detected'
            : `GL Error ${error} (0x${error.toString(16)})`;
        t.fail(errorMsg);
        t.end();
        return true;
      }
      return false;
    }

    // Create render setup
    const container = gc.registerDOMElement(document.createElement('div'));
    document.querySelector('body').appendChild(container);

    const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
    const renderer = gc.registerResource(vtkRenderer.newInstance());
    renderWindow.addRenderer(renderer);

    const glwindow = gc.registerResource(vtkOpenGLRenderWindow.newInstance());
    glwindow.setContainer(container);
    renderWindow.addView(glwindow);
    glwindow.setSize(64, 64);

    // Create textured plane
    const plane = gc.registerResource(vtkPlaneSource.newInstance());
    const mapper = gc.registerResource(vtkMapper.newInstance());
    mapper.setInputConnection(plane.getOutputPort());

    const actor = gc.registerResource(vtkActor.newInstance());
    actor.setMapper(mapper);
    renderer.addActor(actor);

    // Create texture with red data
    const texture = gc.registerResource(vtkTexture.newInstance());
    const imageData = gc.registerResource(vtkImageData.newInstance());
    imageData.setDimensions(64, 64, 1);

    const data = new Uint8Array(64 * 64 * 3).fill(255); // red
    const scalars = gc.registerResource(
      vtkDataArray.newInstance({
        numberOfComponents: 3,
        values: data,
      })
    );
    imageData.getPointData().setScalars(scalars);
    texture.setInputData(imageData);
    actor.addTexture(texture);

    renderWindow.render();

    // Update texture to green
    data.fill(0);
    for (let i = 1; i < data.length; i += 3) {
      data[i] = 255; // green channel
    }
    scalars.modified();
    imageData.modified();
    texture.modified();

    renderWindow.render();

    // Check for GL errors
    if (checkGLError(glwindow.getContext())) {
      gc.releaseResources();
      return;
    }

    t.pass('No GL errors occurred during texture update');
    gc.releaseResources();
  }
);
