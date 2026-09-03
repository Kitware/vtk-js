import '@kitware/vtk.js/favicon';

import vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';

import vtkImageInterpolator from '@kitware/vtk.js/Imaging/Core/ImageInterpolator';
import { InterpolationMode } from '@kitware/vtk.js/Imaging/Core/AbstractImageInterpolator/Constants';

import GUI from 'lil-gui';

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const SIZE = 16;
const SCALE = 32;

// ----------------------------------------------------------------------------
// Create a 16 x 16 test image
// ----------------------------------------------------------------------------

const imageData = vtkImageData.newInstance();

imageData.setDimensions(SIZE, SIZE, 1);
imageData.setSpacing(1, 1, 1);
imageData.setOrigin(0, 0, 0);

const values = new Float32Array(SIZE * SIZE);

for (let y = 0; y < SIZE; ++y) {
  for (let x = 0; x < SIZE; ++x) {
    let value;

    // Four distinct regions.
    if (x < 8 && y < 8) {
      value = 0;
    } else if (x >= 8 && y < 8) {
      value = 255;
    } else if (x < 8 && y >= 8) {
      value = 64;
    } else {
      value = 192;
    }

    // Diagonal feature.
    if (x === y || x === y + 1 || x + 1 === y) {
      value = 255;
    }

    values[y * SIZE + x] = value;
  }
}

imageData.getPointData().setScalars(
  vtkDataArray.newInstance({
    name: 'Scalars',
    numberOfComponents: 1,
    values,
  })
);

// ----------------------------------------------------------------------------
// vtkImageInterpolator
// ----------------------------------------------------------------------------

const interpolator = vtkImageInterpolator.newInstance();

interpolator.initialize(imageData);
interpolator.setInterpolationMode(InterpolationMode.NEAREST);

// IMPORTANT:
// initialize() creates the interpolation information and update() makes sure
// that the current interpolation mode is propagated into it.
interpolator.update();

// ----------------------------------------------------------------------------
// Canvas
// ----------------------------------------------------------------------------

const canvas = document.createElement('canvas');

canvas.width = SIZE * SCALE;
canvas.height = SIZE * SCALE;

canvas.style.position = 'absolute';
canvas.style.left = '50%';
canvas.style.top = '50%';
canvas.style.transform = 'translate(-50%, -50%)';

document.body.appendChild(canvas);

const context = canvas.getContext('2d');

const output = context.createImageData(canvas.width, canvas.height);

// ----------------------------------------------------------------------------
// Interpolation
// ----------------------------------------------------------------------------

function interpolate(x, y) {
  const value = [0];

  interpolator.interpolateIJK([x, y, 0], value);

  return value[0];
}

// ----------------------------------------------------------------------------
// Render
// ----------------------------------------------------------------------------

function render() {
  // Make sure the interpolation information reflects the selected mode.
  interpolator.update();

  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const value = interpolate(
        (x / canvas.width) * SIZE - 0.5,
        (y / canvas.height) * SIZE - 0.5
      );

      const gray = Math.max(0, Math.min(255, Math.round(value)));

      const offset = 4 * (y * canvas.width + x);

      output.data[offset] = gray;
      output.data[offset + 1] = gray;
      output.data[offset + 2] = gray;
      output.data[offset + 3] = 255;
    }
  }

  context.putImageData(output, 0, 0);
}

// ----------------------------------------------------------------------------
// GUI
// ----------------------------------------------------------------------------

const model = {
  interpolation: 'NEAREST',
};

const gui = new GUI();

gui
  .add(model, 'interpolation', ['NEAREST', 'LINEAR', 'CUBIC'])
  .name('Interpolation')
  .onChange((value) => {
    if (value === 'LINEAR') {
      interpolator.setInterpolationMode(InterpolationMode.LINEAR);
    } else if (value == 'NEAREST') {
      interpolator.setInterpolationMode(InterpolationMode.NEAREST);
    } else if (value == 'CUBIC') {
      interpolator.setInterpolationMode(InterpolationMode.CUBIC);
    }

    render();
  });

// ----------------------------------------------------------------------------
// Initial render
// ----------------------------------------------------------------------------

render();

// ----------------------------------------------------------------------------
// Expose for debugging
// ----------------------------------------------------------------------------

globalThis.imageData = imageData;
globalThis.interpolator = interpolator;
globalThis.InterpolationMode = InterpolationMode;
globalThis.render = render;
