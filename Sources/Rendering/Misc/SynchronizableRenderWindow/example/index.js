import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/All';

import JSZip from 'jszip';

import vtkInteractorStyleTrackballCamera from 'vtk.js/Sources/Interaction/Style/InteractorStyleTrackballCamera';
import vtkOpenGLRenderWindow from 'vtk.js/Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindowInteractor from 'vtk.js/Sources/Rendering/Core/RenderWindowInteractor';
import vtkSynchronizableRenderWindow from 'vtk.js/Sources/Rendering/Misc/SynchronizableRenderWindow';

import style from './SynchronizableRenderWindow.module.css';

const CONTEXT_NAME = '__zipFileContent__';

// ----------------------------------------------------------------------------

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// ----------------------------------------------------------------------------

function emptyContainer(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

// ----------------------------------------------------------------------------

function loadZipContent(zipContent, container) {
  const fileContents = { state: null, arrays: {} };

  function getArray(hash, binary) {
    return Promise.resolve(fileContents.arrays[hash]);
  }

  const zip = new JSZip();
  zip.loadAsync(zipContent).then(() => {
    let workLoad = 0;

    function done() {
      if (workLoad !== 0) {
        return;
      }

      // Synchronize context
      const synchronizerContext =
        vtkSynchronizableRenderWindow.getSynchronizerContext(CONTEXT_NAME);
      synchronizerContext.setFetchArrayFunction(getArray);

      // openGLRenderWindow
      const openGLRenderWindow = vtkOpenGLRenderWindow.newInstance();
      openGLRenderWindow.setContainer(container);

      // RenderWindow (synchronizable)
      const renderWindow = vtkSynchronizableRenderWindow.newInstance({
        synchronizerContext,
      });
      renderWindow.addView(openGLRenderWindow);

      // Size handling
      function resize() {
        const dims = container.getBoundingClientRect();
        const devicePixelRatio = window.devicePixelRatio || 1;
        openGLRenderWindow.setSize(
          Math.floor(dims.width * devicePixelRatio),
          Math.floor(dims.height * devicePixelRatio)
        );
        renderWindow.render();
      }
      window.addEventListener('resize', resize);
      resize();

      // Interactor
      const interactor = vtkRenderWindowInteractor.newInstance();
      interactor.setInteractorStyle(
        vtkInteractorStyleTrackballCamera.newInstance()
      );
      interactor.setView(openGLRenderWindow);
      interactor.initialize();
      interactor.bindEvents(container);

      // Load the scene
      renderWindow.getSynchronizerContext().onProgressEvent((count) => {
        console.log('progress', count);
      });
      renderWindow.synchronize(fileContents.state).then((ok) => {
        if (ok) {
          console.log('Synchronization done');
        } else {
          console.log('Skip synchronization');
        }
      });
    }

    zip.forEach((relativePath, zipEntry) => {
      const fileName = relativePath.split('/').pop();
      if (fileName === 'index.json') {
        workLoad++;
        zipEntry.async('string').then((txt) => {
          fileContents.state = JSON.parse(txt);
          workLoad--;
          done();
        });
      }

      if (fileName.length === 32) {
        workLoad++;
        const hash = fileName;
        zipEntry.async('arraybuffer').then((arraybuffer) => {
          fileContents.arrays[hash] = arraybuffer;
          workLoad--;
          done();
        });
      }
    });
  });
}

// ----------------------------------------------------------------------------

export function load(container, options) {
  emptyContainer(container);
  loadZipContent(options.file, container);
}

// ----------------------------------------------------------------------------

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
  fileContainer.innerHTML = `<div class="${style.bigFileDrop}"/>
    <input type="file" accept=".zip,.obj" style="display: none;"/>`;
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

// ----------------------------------------------------------------------------
// Auto setup
// ----------------------------------------------------------------------------

initLocalFileLoader();
