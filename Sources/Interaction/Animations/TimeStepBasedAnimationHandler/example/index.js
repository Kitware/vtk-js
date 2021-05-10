import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/All';

import 'vtk.js/Sources/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpSceneLoader from 'vtk.js/Sources/IO/Core/HttpSceneLoader';
import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';

import controlPanel from './controller.html';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

function initialiseSelector(steps, applyStep) {
  const select = document.querySelector('#timeselect');
  select.addEventListener('change', () => {
    applyStep(select.selectedIndex);
  });
  select.innerHTML = '';
  steps.forEach((time) => {
    const option = document.createElement('option');
    option.setAttribute('value', time);
    option.innerText = `${time}`;
    select.appendChild(option);
  });
}

function downloadZipFile(url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onreadystatechange = (e) => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200 || xhr.status === 0) {
          resolve(xhr.response);
        } else {
          reject(xhr, e);
        }
      }
    };

    // Make request
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.send();
  });
}

downloadZipFile(
  'https://kitware.github.io/vtk-js-datasets/data/vtkjs/timesteps.vtkjs'
).then((zipContent) => {
  const dataAccessHelper = DataAccessHelper.get('zip', {
    zipContent,
    callback() {
      const sceneImporter = vtkHttpSceneLoader.newInstance({
        dataAccessHelper,
        renderer,
      });

      global.sceneImporter = sceneImporter;

      sceneImporter.setUrl('index.json');
      sceneImporter.onReady(() => {
        const animationHandler = sceneImporter.getAnimationHandler();
        global.animationHandler = animationHandler;
        if (animationHandler && animationHandler.getTimeSteps().length > 1) {
          const steps = animationHandler.getTimeSteps();
          const applyStep = (stepIdx) => {
            const step = steps[stepIdx];
            if (
              step >= animationHandler.getTimeRange()[0] &&
              step <= animationHandler.getTimeRange()[1]
            ) {
              animationHandler.setCurrentTimeStep(step);
              renderer.resetCameraClippingRange();
              renderWindow.render();
            }
          };
          initialiseSelector(steps, applyStep);
        }
        renderWindow.render();
      });
    },
  });
});

// ----------------------------------------------------------------------------
// UI control handling
// ----------------------------------------------------------------------------

fullScreenRenderer.addController(controlPanel);

global.renderWindow = renderWindow;
