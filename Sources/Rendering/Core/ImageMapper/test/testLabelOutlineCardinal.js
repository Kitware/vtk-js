import test from 'tape';
import 'vtk.js/Sources/Rendering/Misc/RenderingAPIs';

import vtkImageMapper from 'vtk.js/Sources/Rendering/Core/ImageMapper';
import vtkImageSlice from 'vtk.js/Sources/Rendering/Core/ImageSlice';
import vtkRenderer from 'vtk.js/Sources/Rendering/Core/Renderer';
import vtkRenderWindow from 'vtk.js/Sources/Rendering/Core/RenderWindow';
import vtkImageData from 'vtk.js/Sources/Common/DataModel/ImageData';
import vtkColorTransferFunction from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPiecewiseFunction from 'vtk.js/Sources/Common/DataModel/PiecewiseFunction';

test.onlyIfWebGL('Test label outline detects cardinal neighbors', async (t) => {
  // 100x100 image rendered at 100x100 canvas = 1:1 pixel mapping.
  // An isolated red pixel (label 1) at the center is surrounded by
  // green (label 5). With outline thickness=1, all 8 green neighbors
  // should be detected as border and rendered with full outline opacity.
  const SIZE = 100;

  const container = document.querySelector('body');
  const renderWindowContainer = document.createElement('div');
  container.appendChild(renderWindowContainer);

  const renderWindow = vtkRenderWindow.newInstance();
  const renderer = vtkRenderer.newInstance();
  renderWindow.addRenderer(renderer);
  renderer.setBackground(0, 0, 0);

  const imageData = vtkImageData.newInstance();
  imageData.setSpacing(1, 1, 1);
  imageData.setOrigin(0, 0, 0);
  imageData.setDirection(1, 0, 0, 0, 1, 0, 0, 0, 1);
  imageData.setExtent(0, SIZE - 1, 0, SIZE - 1, 0, 0);
  imageData.computeTransforms();

  const values = new Uint8Array(SIZE * SIZE);
  values.fill(160); // HIGH_VALUE -> label 5 (green)
  values[50 * SIZE + 50] = 80; // LOW_VALUE -> label 1 (red) at center

  imageData
    .getPointData()
    .setScalars(vtkDataArray.newInstance({ numberOfComponents: 1, values }));
  imageData.modified();

  // Create labelmap
  const labelMapData = vtkImageData.newInstance(
    imageData.get('spacing', 'origin', 'direction')
  );
  labelMapData.setDimensions(...imageData.getDimensions());
  labelMapData.setSpacing(...imageData.getSpacing());
  labelMapData.setOrigin(...imageData.getOrigin());
  labelMapData.setDirection(...imageData.getDirection());
  labelMapData.computeTransforms();

  const labelValues = new Uint8Array(SIZE * SIZE);
  for (let i = 0; i < values.length; i++) {
    if (values[i] === 80) labelValues[i] = 1;
    else if (values[i] === 160) labelValues[i] = 5;
  }
  labelMapData
    .getPointData()
    .setScalars(
      vtkDataArray.newInstance({ numberOfComponents: 1, values: labelValues })
    );

  const mapper = vtkImageMapper.newInstance();
  mapper.setInputData(labelMapData);
  const actor = vtkImageSlice.newInstance();
  actor.setMapper(mapper);

  const cfun = vtkColorTransferFunction.newInstance();
  cfun.addRGBPoint(0, 0, 0, 0);
  cfun.addRGBPoint(1, 1, 0, 0);
  cfun.addRGBPoint(5, 0, 1, 0);
  const ofun = vtkPiecewiseFunction.newInstance();
  ofun.addPoint(0, 0);
  ofun.addPoint(1, 0.5);
  ofun.addPoint(5, 0.5);

  actor.getProperty().setRGBTransferFunction(0, cfun);
  actor.getProperty().setScalarOpacity(0, ofun);
  actor.getProperty().setInterpolationTypeToNearest();
  actor.getProperty().setUseLabelOutline(true);
  actor.getProperty().setUseLookupTableScalarRange(true);
  actor.getProperty().setLabelOutlineThickness([1, 1, 1, 1, 1]);
  actor.getProperty().setLabelOutlineOpacity(1.0);

  renderer.addActor(actor);

  const cam = renderer.getActiveCamera();
  cam.setParallelProjection(true);
  cam.setPosition(49.5, 49.5, 1);
  cam.setFocalPoint(49.5, 49.5, 0);
  cam.setViewUp(0, 1, 0);
  cam.setParallelScale(50);
  renderer.resetCameraClippingRange();

  const glwindow = renderWindow.newAPISpecificView();
  glwindow.setContainer(renderWindowContainer);
  renderWindow.addView(glwindow);
  glwindow.setSize(SIZE, SIZE);

  const imagePromise = glwindow.captureNextImage();
  renderWindow.render();
  const image = await imagePromise;

  // Decode captured image to read pixel values
  const img = new Image();
  await new Promise((resolve) => {
    img.onload = resolve;
    img.src = image;
  });

  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const pixelData = ctx.getImageData(0, 0, SIZE, SIZE).data;

  const getPixel = (x, y) => {
    const idx = (y * SIZE + x) * 4;
    return { r: pixelData[idx], g: pixelData[idx + 1], b: pixelData[idx + 2] };
  };

  // Red pixel at image (50, 50). Screen y = SIZE - 1 - 50 = 49.
  const cx = 50;
  const cy = SIZE - 1 - 50;

  // Outline opacity=1.0 -> green channel = 255 for outline pixels
  // Fill opacity=0.5 -> green channel ≈ 128 for non-outline pixels
  // Threshold at 200 to distinguish the two
  const OUTLINE_THRESHOLD = 200;

  const up = getPixel(cx, cy - 1);
  const down = getPixel(cx, cy + 1);
  const left = getPixel(cx - 1, cy);
  const right = getPixel(cx + 1, cy);

  const upLeft = getPixel(cx - 1, cy - 1);
  const upRight = getPixel(cx + 1, cy - 1);
  const downLeft = getPixel(cx - 1, cy + 1);
  const downRight = getPixel(cx + 1, cy + 1);

  // Diagonal neighbors should always be detected as outline
  t.ok(upLeft.g > OUTLINE_THRESHOLD, `upLeft g=${upLeft.g} should be outline`);
  t.ok(
    upRight.g > OUTLINE_THRESHOLD,
    `upRight g=${upRight.g} should be outline`
  );
  t.ok(
    downLeft.g > OUTLINE_THRESHOLD,
    `downLeft g=${downLeft.g} should be outline`
  );
  t.ok(
    downRight.g > OUTLINE_THRESHOLD,
    `downRight g=${downRight.g} should be outline`
  );

  // Cardinal neighbors must also be detected as outline.
  // This is the actual bug check: with || they get fill (g≈128) not outline (g=255)
  t.ok(up.g > OUTLINE_THRESHOLD, `up g=${up.g} should be outline`);
  t.ok(down.g > OUTLINE_THRESHOLD, `down g=${down.g} should be outline`);
  t.ok(left.g > OUTLINE_THRESHOLD, `left g=${left.g} should be outline`);
  t.ok(right.g > OUTLINE_THRESHOLD, `right g=${right.g} should be outline`);

  // Clean up
  renderWindow.removeView(glwindow);
  renderWindow.removeRenderer(renderer);
  container.removeChild(renderWindowContainer);

  t.end();
});
