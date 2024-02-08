import test from 'tape';

import * as CssFilters from 'vtk.js/Sources/Rendering/Core/ColorTransferFunction/CssFilters';

test('Test CssFilters identity', (t) => {
  const color = [Math.random(), Math.random(), -1, 2];
  const identity = CssFilters.createIdentityFilter();
  const output = CssFilters.applyFilter(identity, ...color);
  const expectedOutput = [color[0], color[1], 0, 1];
  t.deepEqual(output, expectedOutput, 'Apply identity filter');
  t.end();
});

test('Test CssFilters brightness', (t) => {
  const color = [0.1, 0.5, 0.9, 0.2];
  const halfBright = CssFilters.createBrightnessFilter(0.5);
  const output = CssFilters.applyFilter(halfBright, ...color);
  t.deepEqual([0.05, 0.25, 0.45, 0.2], output, 'Apply brightness filter');
  t.end();
});

test('Fuzzy test all CssFilters', (t) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const randomChannel = () => Math.floor(Math.random() * 256);

  const numberOfRepetitions = 1000;
  for (let repetition = 0; repetition < numberOfRepetitions; repetition++) {
    const contrast = 2 * Math.random();
    const saturate = 2 * Math.random();
    const brightness = 2 * Math.random();
    const invert = Math.random();

    const color = [randomChannel(), randomChannel(), randomChannel(), 255];

    // Apply filters one by one (don't combine as it is not equivalent)
    let filtersOutput = color.map((channel) => channel / 255);
    const contrastFilter = CssFilters.createContrastFilter(contrast);
    filtersOutput = CssFilters.applyFilter(contrastFilter, ...filtersOutput);
    const saturateFilter = CssFilters.createSaturateFilter(saturate);
    filtersOutput = CssFilters.applyFilter(saturateFilter, ...filtersOutput);
    const brightnessFilter = CssFilters.createBrightnessFilter(brightness);
    filtersOutput = CssFilters.applyFilter(brightnessFilter, ...filtersOutput);
    const invertFilter = CssFilters.createInvertFilter(invert);
    filtersOutput = CssFilters.applyFilter(invertFilter, ...filtersOutput);

    // Reference: canvas 2D context filters
    ctx.fillStyle = `rgb(${color[0]} ${color[1]} ${color[2]})`;
    ctx.filter = `contrast(${contrast}) saturate(${saturate}) brightness(${brightness}) invert(${invert})`;
    ctx.beginPath();
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const canvasPixel = ctx.getImageData(0, 0, 1, 1).data;
    const referenceOutput = [...canvasPixel].map((x) => x / 255);

    for (let channel = 0; channel < 4; ++channel) {
      const error = referenceOutput[channel] - filtersOutput[channel];
      // The error depends on the values of each filter
      // For example, using a color of [127.5, 127.5, 128.49] with a saturate of 1000 creates big errors
      // This is because the CSS filters use uint8 instead of floating point numbers
      if (Math.abs(error) > 7 / 255) {
        t.fail('Error is too big');
      }
    }
  }
  t.end();
});
