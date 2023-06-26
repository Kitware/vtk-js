/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */

import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/OpenGL/Profiles/All';

import macro from '@kitware/vtk.js/macros';
import Base64 from '@kitware/vtk.js/Common/Core/Base64';
import DataAccessHelper from '@kitware/vtk.js/IO/Core/DataAccessHelper';
import HttpDataAccessHelper from '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkURLExtract from '@kitware/vtk.js/Common/Core/URLExtract';
import vtkSynchronizableRenderWindow from '@kitware/vtk.js/Rendering/Misc/SynchronizableRenderWindow';

// Force DataAccessHelper to have access to various data source
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

import style from './viewer.module.css';

let autoInit = true;

function emptyContainer(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

export function load(container, options) {
  autoInit = false;
  emptyContainer(container);

  const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
    background: [1, 1, 1],
    rootContainer: container,
    containerStyle: { height: '100%', width: '100%', position: 'absolute' },
  });
  const renderWindow = fullScreenRenderer.getRenderWindow();
  const syncCTX = vtkSynchronizableRenderWindow.getSynchronizerContext();
  const syncRW = vtkSynchronizableRenderWindow.decorate(renderWindow);
  global.renderWindow = renderWindow;

  function onReady(data) {
    syncCTX.setFetchArrayFunction((sha) =>
      Promise.resolve(data.hashes[sha].content)
    );
    console.log(Object.keys(data));
    syncRW.synchronize(data.scene);
    syncRW.render();
  }

  if (options.fileURL || options.url) {
    const progressContainer = document.createElement('div');
    progressContainer.setAttribute('class', style.progress);
    container.appendChild(progressContainer);

    const progressCallback = (progressEvent) => {
      if (progressEvent.lengthComputable) {
        const percent = Math.floor(
          (100 * progressEvent.loaded) / progressEvent.total
        );
        progressContainer.innerHTML = `Loading ${percent}%`;
      } else {
        progressContainer.innerHTML = macro.formatBytesToProperUnit(
          progressEvent.loaded
        );
      }
    };

    if (options.fileURL) {
      HttpDataAccessHelper.fetchBinary(options.fileURL, {
        progressCallback,
      }).then((zipContent) => {
        container.removeChild(progressContainer);
        const dataAccessHelper = DataAccessHelper.get('zip', {
          zipContent,
          callback: (zip) => {
            dataAccessHelper.fetchJSON(null, 'index.json').then(onReady);
          },
        });
      });
    } else {
      HttpDataAccessHelper.fetchJSON(options.url, {
        progressCallback,
      }).then((data) => {
        container.removeChild(progressContainer);
        onReady(data);
      });
    }
  } else if (options.file) {
    const dataAccessHelper = DataAccessHelper.get('zip', {
      zipContent: options.file,
      callback: (zip) => {
        dataAccessHelper.fetchJSON(null, 'index.json').then(onReady);
      },
    });
  } else if (options.base64Str) {
    const zipContent = Base64.toArrayBuffer(options.base64Str);
    const dataAccessHelper = DataAccessHelper.get('zip', {
      zipContent,
      callback: (zip) => {
        dataAccessHelper.fetchJSON(null, 'index.json').then(onReady);
      },
    });
  }
}

export function initLocalFileLoader(container) {
  autoInit = false;
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
  fileContainer.innerHTML = `<div class="${style.bigFileDrop}"/><input type="file" accept=".zip,.vtksz" style="display: none;"/>`;
  myContainer.appendChild(fileContainer);

  const fileInput = fileContainer.querySelector('input');

  function handleFile(e) {
    preventDefaults(e);
    const dataTransfer = e.dataTransfer;
    const files = e.target.files || dataTransfer.files;
    if (files.length === 1) {
      myContainer.removeChild(fileContainer);
      const ext = files[0].name.split('.').slice(-1)[0];
      load(myContainer, { file: files[0], ext });
    }
  }

  fileInput.addEventListener('change', handleFile);
  fileContainer.addEventListener('drop', handleFile);
  fileContainer.addEventListener('click', (e) => fileInput.click());
  fileContainer.addEventListener('dragover', preventDefaults);
}

const userParams = vtkURLExtract.extractURLParameters();

if (userParams.url || userParams.fileURL) {
  const exampleContainer = document.querySelector('.content');
  const rootBody = document.querySelector('body');
  const myContainer = exampleContainer || rootBody;
  if (myContainer) {
    myContainer.classList.add(style.fullScreen);
    rootBody.style.margin = '0';
    rootBody.style.padding = '0';
  }
  load(myContainer, userParams);
}

// Auto setup if no method get called within 100ms
setTimeout(() => {
  if (autoInit) {
    initLocalFileLoader();
  }
}, 100);

window.OfflineLocalView = {
  initLocalFileLoader,
  load,
};
