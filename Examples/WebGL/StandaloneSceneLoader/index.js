/* global window document XMLHttpRequest */
/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */

// import 'normalize.css';
import 'babel-polyfill';

import vtkOpenGLRenderWindow      from '../../../Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow            from '../../../Sources/Rendering/Core/RenderWindow';
import vtkRenderer                from '../../../Sources/Rendering/Core/Renderer';
import vtkRenderWindowInteractor  from '../../../Sources/Rendering/Core/RenderWindowInteractor';
import vtkHttpSceneLoader         from '../../../Sources/IO/Core/HttpSceneLoader';

import DataAccessHelper           from '../../../Sources/IO/Core/DataAccessHelper';

import controlWidget from './SceneControllerWidget';
import style from './SceneLoader.mcss';

const iOS = /iPad|iPhone|iPod/.test(window.navigator.platform);
let autoInit = true;
let widgetCreated = false;

// Add class to body if iOS device --------------------------------------------

if (iOS) {
  document.querySelector('body').classList.add('is-ios-device');
}

function emptyContainer(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
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

export function load(container, options) {
  autoInit = false;
  let dims = container.getBoundingClientRect();
  emptyContainer(container);

  // Create some control UI
  const renderWindowContainer = document.createElement('div');
  container.appendChild(renderWindowContainer);
  // create what we will view
  const renWin = vtkRenderWindow.newInstance();
  const renderer = vtkRenderer.newInstance();
  renWin.addRenderer(renderer);
  // now create something to view it, in this case webgl
  // with mouse/touch interaction
  const glwindow = vtkOpenGLRenderWindow.newInstance();
  glwindow.setSize(dims.width, dims.height);
  glwindow.setContainer(renderWindowContainer);
  renWin.addView(glwindow);

  window.addEventListener('resize', () => {
    dims = container.getBoundingClientRect();
    glwindow.setSize(dims.width, dims.height);
    renWin.render();
  });

  const iren = vtkRenderWindowInteractor.newInstance();
  iren.setView(glwindow);
  // initialize the interaction and bind event handlers
  // to the HTML elements
  iren.initialize();
  iren.bindEvents(renderWindowContainer, document);

  function onReady(sceneImporter) {
    sceneImporter.onReady(() => {
      renWin.render();

      // Add UI to dynamically change rendering settings
      if (!widgetCreated) {
        widgetCreated = true;
        controlWidget(document.querySelector('body'), sceneImporter.getScene(), renWin.render);
      }
    });

    window.addEventListener('dblclick', () => {
      sceneImporter.resetScene();
      renWin.render();
    });
  }

  if (options.url) {
    const sceneImporter = vtkHttpSceneLoader.newInstance({ renderer });
    sceneImporter.setUrl(options.url);
    onReady(sceneImporter);
  } else if (options.fileURL) {
    downloadZipFile(options.fileURL)
      .then((zipContent) => {
        const dataAccessHelper = DataAccessHelper.get(
          'zip',
          {
            zipContent,
            callback: (zip) => {
              const sceneImporter = vtkHttpSceneLoader.newInstance({ renderer, dataAccessHelper });
              sceneImporter.setUrl('index.json');
              onReady(sceneImporter);
            },
          });
      });
  } else if (options.file) {
    const dataAccessHelper = DataAccessHelper.get(
      'zip',
      {
        zipContent: options.file,
        callback: (zip) => {
          const sceneImporter = vtkHttpSceneLoader.newInstance({ renderer, dataAccessHelper });
          sceneImporter.setUrl('index.json');
          onReady(sceneImporter);
        },
      });
  }
}

export function initLocalFileLoader(container) {
  autoInit = false;
  const exampleContainer = document.querySelector('.content');
  const rootBody = document.querySelector('body');
  const myContainer = container || exampleContainer || rootBody;

  const fileSelector = document.createElement('input');
  fileSelector.setAttribute('type', 'file');
  fileSelector.setAttribute('class', style.bigFileDrop);
  myContainer.appendChild(fileSelector);
  myContainer.setAttribute('class', style.fullScreen);

  function handleFile(e) {
    var files = this.files;
    if (files.length === 1) {
      myContainer.removeChild(fileSelector);
      load(myContainer, { file: files[0] });
    }
  }

  fileSelector.onchange = handleFile;
}

// Auto setup if no method get called within 100ms
setTimeout(() => {
  if (autoInit) {
    initLocalFileLoader();
  }
}, 100);
