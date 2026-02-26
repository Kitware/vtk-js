import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/All';

import '@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkHttpSceneLoader from '@kitware/vtk.js/IO/Core/HttpSceneLoader';
import DataAccessHelper from '@kitware/vtk.js/IO/Core/DataAccessHelper';

import GUI from 'lil-gui';

// ----------------------------------------------------------------------------
// Standard rendering code setup
// ----------------------------------------------------------------------------

const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
const renderer = fullScreenRenderer.getRenderer();
const renderWindow = fullScreenRenderer.getRenderWindow();

// ----------------------------------------------------------------------------
// Example code
// ----------------------------------------------------------------------------

const gui = new GUI();
const params = { TimeIndex: 0 };
let timeCtrl;
function initialiseSelector(steps, applyStep) {
  if (timeCtrl) timeCtrl.destroy();
  timeCtrl = gui
    .add(params, 'TimeIndex', 0, steps.length - 1, 1)
    .name('Time step index')
    .onChange((idx) => applyStep(Number(idx)));
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

// controls created via lil-gui

global.renderWindow = renderWindow;
