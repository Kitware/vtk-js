/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */

import 'vtk.js/Sources/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import 'vtk.js/Sources/Rendering/Profiles/All';

import vtkFullScreenRenderWindow from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';

import vtkHttpSceneLoader from 'vtk.js/Sources/IO/Core/HttpSceneLoader';
import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';
import vtkURLExtract from 'vtk.js/Sources/Common/Core/URLExtract';
import vtkOBJReader from 'vtk.js/Sources/IO/Misc/OBJReader';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';

import controlWidget from './SceneControllerWidget';
import style from './SceneLoader.module.css';

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
  emptyContainer(container);

  const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
  const renderer = fullScreenRenderer.getRenderer();
  const renderWindow = fullScreenRenderer.getRenderWindow();

  function onReady(sceneImporter) {
    sceneImporter.onReady(() => {
      renderWindow.render();

      // Add UI to dynamically change rendering settings
      if (!widgetCreated) {
        widgetCreated = true;
        controlWidget(
          document.querySelector('body'),
          sceneImporter.getScene(),
          renderWindow.render
        );
      }
    });

    window.addEventListener('dblclick', () => {
      sceneImporter.resetScene();
      renderWindow.render();
    });
  }

  if (options.url) {
    const sceneImporter = vtkHttpSceneLoader.newInstance({ renderer });
    sceneImporter.setUrl(options.url);
    onReady(sceneImporter);
  } else if (options.fileURL) {
    downloadZipFile(options.fileURL).then((zipContent) => {
      const dataAccessHelper = DataAccessHelper.get('zip', {
        zipContent,
        callback: (zip) => {
          const sceneImporter = vtkHttpSceneLoader.newInstance({
            renderer,
            dataAccessHelper,
          });
          sceneImporter.setUrl('index.json');
          onReady(sceneImporter);
        },
      });
    });
  } else if (options.file) {
    if (options.ext === 'obj') {
      const scene = [];
      const reader = new FileReader();
      reader.onload = function onLoad(e) {
        const objReader = vtkOBJReader.newInstance();
        objReader.parse(reader.result);
        const nbOutputs = objReader.getNumberOfOutputPorts();
        for (let idx = 0; idx < nbOutputs; idx++) {
          const source = objReader.getOutputData(idx);
          const mapper = vtkMapper.newInstance();
          const actor = vtkActor.newInstance();
          actor.setMapper(mapper);
          mapper.setInputData(source);
          renderer.addActor(actor);
          scene.push({
            name: source.get('name').name,
            source,
            mapper,
            actor,
          });
        }
        onReady({
          getScene() {
            return scene;
          },
          resetScene() {
            renderer.resetCamera();
          },
          onReady(fn) {
            renderer.resetCamera();
            renderWindow.render();
            fn();
          },
        });
      };
      reader.readAsText(options.file);
    } else {
      const dataAccessHelper = DataAccessHelper.get('zip', {
        zipContent: options.file,
        callback: (zip) => {
          const sceneImporter = vtkHttpSceneLoader.newInstance({
            renderer,
            dataAccessHelper,
          });
          sceneImporter.setUrl('index.json');
          onReady(sceneImporter);
        },
      });
    }
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
    const files = this.files;
    if (files.length === 1) {
      myContainer.removeChild(fileSelector);
      const ext = files[0].name.split('.').slice(-1)[0];
      load(myContainer, { file: files[0], ext });
    }
  }

  fileSelector.onchange = handleFile;
}

// Look at URL an see if we should load a file
// ?fileURL=https://data.kitware.com/api/v1/item/587003d08d777f05f44a5c98/download?contentDisposition=inline
const userParams = vtkURLExtract.extractURLParameters();

if (userParams.url || userParams.fileURL) {
  const exampleContainer = document.querySelector('.content');
  const rootBody = document.querySelector('body');
  const myContainer = exampleContainer || rootBody;
  load(myContainer, userParams);
}

// Auto setup if no method get called within 100ms
setTimeout(() => {
  if (autoInit) {
    initLocalFileLoader();
  }
}, 100);
