import { it, expect } from 'vitest';

import testUtils from 'vtk.js/Sources/Testing/testUtils';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';

// Mean brightness of the captured data URL's center region.
async function computeCenterBrightness(dataURL) {
  const image = new Image();
  image.src = dataURL;
  await image.decode();

  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0);

  const size = Math.floor(Math.min(canvas.width, canvas.height) / 4);
  const x = Math.floor((canvas.width - size) / 2);
  const y = Math.floor((canvas.height - size) / 2);
  const { data } = context.getImageData(x, y, size, size);
  let sum = 0;
  const pixelCount = data.length / 4;
  for (let i = 0; i < data.length; i += 4) {
    sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
  }
  return sum / pixelCount;
}

function createSlice(gc, imageData, { opacity, level }) {
  const mapper = gc.registerResource(vtkImageMapper.newInstance());
  mapper.setInputData(imageData);

  const actor = gc.registerResource(vtkImageSlice.newInstance());
  actor.getProperty().setColorWindow(255);
  actor.getProperty().setColorLevel(level);
  actor.getProperty().setOpacity(opacity);
  actor.setMapper(mapper);
  return actor;
}

it.skipIf(!__VTK_TEST_WEBGPU__)(
  'Test WebGPU translucent pass keeps coplanar geometry over opaque geometry',
  async () => {
    const gc = testUtils.createGarbageCollector();

    const container = document.querySelector('body');
    const renderWindowContainer = gc.registerDOMElement(
      document.createElement('div')
    );
    container.appendChild(renderWindowContainer);

    const renderWindow = gc.registerResource(vtkRenderWindow.newInstance());
    const renderer = gc.registerResource(vtkRenderer.newInstance());
    renderWindow.addRenderer(renderer);
    renderer.setBackground(0, 0, 0);

    const dims = 64;
    const sliceZ = 50;
    const values = new Uint8Array(dims * dims).fill(255);
    const scalars = vtkDataArray.newInstance({
      name: 'Pixels',
      values,
      numberOfComponents: 1,
    });
    const imageData = gc.registerResource(vtkImageData.newInstance());
    imageData.setDimensions(dims, dims, 1);
    imageData.setOrigin(0, 0, sliceZ);
    imageData.getPointData().setScalars(scalars);

    // Opaque base slice rendered black (level far above the data range), and
    // an exactly coplanar translucent white overlay at 50% opacity — the
    // overlay/labelmap-on-a-slice configuration. The overlay only survives
    // when the translucent pass accepts fragments whose depth EQUALS the
    // opaque depth (greater-equal under reversed z, like the OpenGL backend).
    const baseSlice = createSlice(gc, imageData, { opacity: 1, level: 1000 });
    const overlaySlice = createSlice(gc, imageData, {
      opacity: 0.5,
      level: 127.5,
    });
    renderer.addActor(baseSlice);
    renderer.addActor(overlaySlice);

    const center = (dims - 1) / 2;
    const camera = renderer.getActiveCamera();
    camera.setParallelProjection(true);
    camera.setFocalPoint(center, center, sliceZ);
    camera.setPosition(center, center, sliceZ - 1);
    camera.setViewUp(0, -1, 0);
    camera.setParallelScale(dims / 2);
    camera.setClippingRange(0.01, 1000.01);

    const view = gc.registerResource(renderWindow.newAPISpecificView('WebGPU'));
    view.setContainer(renderWindowContainer);
    renderWindow.addView(view);
    view.setSize(128, 128);

    const promise = view
      .captureNextImage()
      .then(async (image) => {
        const brightness = await computeCenterBrightness(image);
        expect(
          brightness,
          'the coplanar translucent overlay must blend over the opaque slice (depth-equal fragments rejected renders black)'
        ).toBeGreaterThan(60);
      })
      .finally(gc.releaseResources);
    renderWindow.render();
    return promise;
  }
);
