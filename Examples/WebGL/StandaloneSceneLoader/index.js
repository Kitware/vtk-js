/* global window document */
/* eslint-disable import/prefer-default-export */

import 'normalize.css';
import 'babel-polyfill';

import vtkOpenGLRenderWindow      from '../../../Sources/Rendering/OpenGL/RenderWindow';
import vtkRenderWindow            from '../../../Sources/Rendering/Core/RenderWindow';
import vtkRenderer                from '../../../Sources/Rendering/Core/Renderer';
import vtkRenderWindowInteractor  from '../../../Sources/Rendering/Core/RenderWindowInteractor';
import vtkHttpSceneLoader         from '../../../Sources/IO/Core/HttpSceneLoader';

import DataAccessHelper           from '../../../Sources/IO/Core/DataAccessHelper';

import style from './SceneLoader.mcss';

const iOS = /iPad|iPhone|iPod/.test(window.navigator.platform);
let autoInit = false;

// Add class to body if iOS device --------------------------------------------

if (iOS) {
  document.querySelector('body').classList.add('is-ios-device');
}

export function load(container, options) {
  autoInit = false;
  let dims = container.getBoundingClientRect();

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
    renWin.setSize(dims.width, dims.height);
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
  } else if (options.file) {
    const dataAccessHelper = DataAccessHelper.get(
      'zip',
      {
        zipContent: options.file,
        callback: (zip) => {
          // Find root index.json
          const metaFiles = [];
          zip.forEach((relativePath, zipEntry) => {
            if (relativePath.indexOf('index.json') !== -1) {
              metaFiles.push(relativePath);
            }
          });
          metaFiles.sort();

          const sceneImporter = vtkHttpSceneLoader.newInstance({ renderer, dataAccessHelper });
          sceneImporter.setUrl(metaFiles[0]);
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
  fileSelector.setAttribute('class', style.fullParentSize);
  myContainer.appendChild(fileSelector);

  fileSelector.onchange = (e) => {
    var files = this.files;
    if (files.length === 1) {
      myContainer.removeChild(fileSelector);
      load(myContainer, { file: files[0] });
    }
  };
}

// Auto setup if no method get called within 100ms
setTimeout(() => {
  if (autoInit) {
    initLocalFileLoader();
  }
}, 100);
