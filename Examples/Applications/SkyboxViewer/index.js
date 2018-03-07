/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */

import 'vtk.js/Sources/favicon';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkSkybox from 'vtk.js/Sources/Rendering/Core/Skybox';
import vtkSkyboxReader from 'vtk.js/Sources/IO/Misc/SkyboxReader';

import style from './SkyboxViewer.mcss';

const reader = vtkSkyboxReader.newInstance();

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function createController(options) {
  if (options.length === 1) {
    return null;
  }
  const buffer = ['<select class="position">'];
  buffer.push(options.join(''));
  buffer.push('</select>');

  return buffer.join('');
}

function createVisualization(container, mapReader) {
  // Empty container
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
    rootContainer: container,
    containerStyle: { height: '100%', width: '100%', position: 'absolute' },
  });
  const renderer = fullScreenRenderer.getRenderer();
  const renderWindow = fullScreenRenderer.getRenderWindow();
  const actor = vtkSkybox.newInstance();
  actor.addTexture(mapReader.getOutputData());
  renderer.addActor(actor);
  renderWindow.render();

  // Add Control UI
  const controller = createController(
    mapReader.getPositions().map((t) => `<option value="${t}">${t}</option>`)
  );
  if (controller) {
    fullScreenRenderer.addController(controller);

    document.querySelector('.position').addEventListener('change', (e) => {
      actor.removeAllTextures();
      reader.setPosition(e.target.value);
      reader.update();
      actor.addTexture(mapReader.getOutputData());
      renderWindow.render();
    });
  }
}

export function initLocalFileLoader(container) {
  const exampleContainer = document.querySelector('.content');
  const rootBody = document.querySelector('body');
  const myContainer = container || exampleContainer || rootBody;

  if (myContainer !== container) {
    myContainer.classList.add(style.fullScreen);
    rootBody.style.margin = '0';
    rootBody.style.padding = '0';
  } else {
    rootBody.style.margin = '0';
    rootBody.style.padding = '0';
  }

  const fileContainer = document.createElement('div');
  fileContainer.innerHTML = `<div class="${
    style.bigFileDrop
  }"/><input type="file" accept=".skybox,.zip" style="display: none;"/>`;
  myContainer.appendChild(fileContainer);

  const fileInput = fileContainer.querySelector('input');

  function handleFile(e) {
    preventDefaults(e);
    const dataTransfer = e.dataTransfer;
    const files = e.target.files || dataTransfer.files;
    if (files.length === 1) {
      myContainer.removeChild(fileContainer);
      reader.parseAsArrayBuffer(files[0]);
      reader.getReadyPromise().then(() => {
        createVisualization(myContainer, reader);
      });
    }
  }

  fileInput.addEventListener('change', handleFile);
  fileContainer.addEventListener('drop', handleFile);
  fileContainer.addEventListener('click', (e) => fileInput.click());
  fileContainer.addEventListener('dragover', preventDefaults);
}

// Auto setup if no method get called within 100ms
initLocalFileLoader();
