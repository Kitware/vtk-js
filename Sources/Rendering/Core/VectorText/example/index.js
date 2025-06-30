/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import vtkVectorText from '@kitware/vtk.js/Rendering/Core/VectorText';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkURLExtract from '@kitware/vtk.js/Common/Core/URLExtract';

import controlPanel from './controller.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------
const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();
fullScreenRenderer.addController(controlPanel);
const textInput = document.getElementById('text');
const fontSelect = document.getElementById('font');
const fontSize = document.getElementById('fontSize');
const bevelInput = document.getElementById('bevel');

const actor = vtkActor.newInstance();
const mapper = vtkMapper.newInstance();
let pd;

const fonts = {
  Roboto: 'https://fonts.gstatic.com/s/roboto/v15/zN7GBFwfMP4uA6AR0HCoLQ.ttf',
  OpenSans:
    'https://fonts.gstatic.com/s/opensans/v10/IgZJs4-7SA1XX_edsoXWog.ttf',
};

const userParms = vtkURLExtract.extractURLParameters();
const selectedFont = userParms.font || 'Roboto';

const fontKeys = Object.keys(fonts);
fontKeys.forEach((key) => {
  const option = document.createElement('option');
  option.value = key;
  option.innerHTML = key;
  fontSelect.appendChild(option);
});
fontSelect.value = selectedFont;

let text = 'I love VTK.js!';
let size = 16;

// ----------------------------------------------------------------------------
// Add a cone source
// ----------------------------------------------------------------------------
async function load() {
  const fontModule = await import(
    /* webpackIgnore: true */ 'https://unpkg.com/opentype.js@1.3.4/dist/opentype.module.js'
  );
  const earcutModule = await import(
    /* webpackIgnore: true */ 'https://unpkg.com/earcut@3.0.1/src/earcut.js'
  );
  fetch(fonts[selectedFont])
    .then((response) => response.arrayBuffer())
    .then((buffer) => {
      const font = fontModule.parse(buffer);
      // Generate a random color based on the letter index
      function perLetterFaceColors(letterIndex) {
        const seed = letterIndex * 9301 + 49297;
        const r = (Math.sin(seed) + 1) / 2;
        const g = (Math.sin(seed + 1) + 1) / 2;
        const b = (Math.sin(seed + 2) + 1) / 2;
        return [r, g, b];
      }
      pd = vtkVectorText.newInstance({
        font,
        bevelEnabled: bevelInput.checked,
        text,
        size,
        perLetterFaceColors,
        earcut: earcutModule.default,
      });
      mapper.setInputConnection(pd.getOutputPort());
      actor.setMapper(mapper);
      renderer.addActor(actor);
      renderer.resetCamera();
      renderWindow.render();
    });

  textInput.addEventListener('input', (event) => {
    text = event.target.value;
    pd.setText(text);
    renderer.resetCamera();
    renderWindow.render();
  });

  fontSize.addEventListener('input', (event) => {
    size = event.target.value;
    pd.setFontSize(size);
    renderer.resetCamera();
    renderWindow.render();
  });

  bevelInput.addEventListener('change', (event) => {
    const bevel = event.target.checked;
    pd.setBevelEnabled(bevel);
    renderWindow.render();
  });
}

fontSelect.addEventListener('change', (event) => {
  const font = event.target.value;
  window.location.search = `?font=${font}`;
});

load();
