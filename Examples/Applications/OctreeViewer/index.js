/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-bitwise */
/* eslint-disable no-unused-vars */

import '@kitware/vtk.js/favicon';

// Load the rendering pieces we want to use (for both WebGL and WebGPU)
import '@kitware/vtk.js/Rendering/Profiles/Geometry';
import '@kitware/vtk.js/Rendering/Profiles/Molecule';

import macro from '@kitware/vtk.js/macros';
import HttpDataAccessHelper from '@kitware/vtk.js/IO/Core/DataAccessHelper/HttpDataAccessHelper';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkSphereMapper from '@kitware/vtk.js/Rendering/Core/SphereMapper';
import vtkURLExtract from '@kitware/vtk.js/Common/Core/URLExtract';
import vtkXMLImageDataReader from '@kitware/vtk.js/IO/XML/XMLImageDataReader';
import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData';

// Force DataAccessHelper to have access to various data source
import '@kitware/vtk.js/IO/Core/DataAccessHelper/HtmlDataAccessHelper';
import '@kitware/vtk.js/IO/Core/DataAccessHelper/JSZipDataAccessHelper';

import style from './Octree.module.css';

let autoInit = true;
const userParams = vtkURLExtract.extractURLParameters();

// ----------------------------------------------------------------------------
// Add class to body if iOS device
// ----------------------------------------------------------------------------

const iOS = /iPad|iPhone|iPod/.test(window.navigator.platform);

if (iOS) {
  document.querySelector('body').classList.add('is-ios-device');
}

// ----------------------------------------------------------------------------

function emptyContainer(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

// ----------------------------------------------------------------------------

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

// ----------------------------------------------------------------------------

function createViewer(rootContainer, fileContents, options) {
  const background = options.background
    ? options.background.split(',').map((s) => Number(s))
    : [0, 0, 0];
  const containerStyle = options.containerStyle;
  const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
    background,
    rootContainer,
    containerStyle,
  });
  const renderer = fullScreenRenderer.getRenderer();
  const renderWindow = fullScreenRenderer.getRenderWindow();
  renderWindow.getInteractor().setDesiredUpdateRate(30);

  const vtiReader = vtkXMLImageDataReader.newInstance();
  vtiReader.parseAsArrayBuffer(fileContents);

  const source = vtiReader.getOutputData(0);
  const points = [];
  const [piMax, pjMax, pkMax] = source.getDimensions();
  const [ciMax, cjMax, ckMax] = [piMax - 1, pjMax - 1, pkMax - 1];
  const array = source.getCellData().getScalars().getData();
  const quaterSpacing = source.getSpacing()[0] / 4;
  const xyz = [0, 0, 0];
  for (let k = 0; k < ckMax; k++) {
    for (let j = 0; j < cjMax; j++) {
      for (let i = 0; i < ciMax; i++) {
        const cIdx = i + j * ciMax + k * ciMax * cjMax;
        const v = array[cIdx];
        if (v) {
          source.indexToWorld([i + 0.5, j + 0.5, k + 0.5], xyz);
          if (v & 1) {
            points.push(xyz[0] - quaterSpacing);
            points.push(xyz[1] - quaterSpacing);
            points.push(xyz[2] - quaterSpacing);
          }
          if (v & 2) {
            points.push(xyz[0] + quaterSpacing);
            points.push(xyz[1] - quaterSpacing);
            points.push(xyz[2] - quaterSpacing);
          }
          if (v & 4) {
            points.push(xyz[0] - quaterSpacing);
            points.push(xyz[1] + quaterSpacing);
            points.push(xyz[2] - quaterSpacing);
          }
          if (v & 8) {
            points.push(xyz[0] + quaterSpacing);
            points.push(xyz[1] + quaterSpacing);
            points.push(xyz[2] - quaterSpacing);
          }
          if (v & 16) {
            points.push(xyz[0] - quaterSpacing);
            points.push(xyz[1] - quaterSpacing);
            points.push(xyz[2] + quaterSpacing);
          }
          if (v & 32) {
            points.push(xyz[0] + quaterSpacing);
            points.push(xyz[1] - quaterSpacing);
            points.push(xyz[2] + quaterSpacing);
          }
          if (v & 64) {
            points.push(xyz[0] - quaterSpacing);
            points.push(xyz[1] + quaterSpacing);
            points.push(xyz[2] + quaterSpacing);
          }
          if (v & 128) {
            points.push(xyz[0] + quaterSpacing);
            points.push(xyz[1] + quaterSpacing);
            points.push(xyz[2] + quaterSpacing);
          }
        }
      }
    }
  }
  const polydata = vtkPolyData.newInstance();
  // const mapper = vtkMapper.newInstance();
  const mapper = vtkSphereMapper.newInstance();
  mapper.setRadius(quaterSpacing);
  const actor = vtkActor.newInstance();

  polydata.getPoints().setData(Float64Array.from(points), 3);
  // const nbCells = points.length / 3;
  // const cells = new Uint16Array(nbCells + 1);
  // cells[0] = nbCells;
  // for (let i = 0; i < nbCells; i++) {
  //   cells[i + 1] = i;
  // }
  // polydata.getVerts().setData(cells);

  // Pipeline handling
  actor.setMapper(mapper);
  mapper.setInputData(polydata);
  renderer.addActor(actor);

  // First render
  renderer.resetCamera();
  renderWindow.render();

  global.pipeline = {
    actor,
    renderer,
    renderWindow,
    mapper,
    source,
    fullScreenRenderer,
  };
}

// ----------------------------------------------------------------------------

export function load(container, options) {
  autoInit = false;
  emptyContainer(container);

  if (options.file) {
    if (options.ext === 'vti') {
      const reader = new FileReader();
      reader.onload = function onLoad(e) {
        createViewer(container, reader.result, options);
      };
      reader.readAsArrayBuffer(options.file);
    } else {
      console.error('Unkown file...');
    }
  } else if (options.fileURL) {
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

    HttpDataAccessHelper.fetchBinary(options.fileURL, {
      progressCallback,
    }).then((binary) => {
      container.removeChild(progressContainer);
      createViewer(container, binary, options);
    });
  }
}

export function initLocalFileLoader(container) {
  const exampleContainer = document.querySelector('.content');
  const rootBody = document.querySelector('body');
  const myContainer = container || exampleContainer || rootBody;

  const fileContainer = document.createElement('div');
  fileContainer.innerHTML = `<div class="${style.bigFileDrop}"/><input type="file" accept=".vti" style="display: none;"/>`;
  myContainer.appendChild(fileContainer);

  const fileInput = fileContainer.querySelector('input');

  function handleFile(e) {
    preventDefaults(e);
    const dataTransfer = e.dataTransfer;
    const files = e.target.files || dataTransfer.files;
    if (files.length === 1) {
      myContainer.removeChild(fileContainer);
      const ext = files[0].name.split('.').slice(-1)[0];
      const options = { file: files[0], ext, ...userParams };
      load(myContainer, options);
    }
  }

  fileInput.addEventListener('change', handleFile);
  fileContainer.addEventListener('drop', handleFile);
  fileContainer.addEventListener('click', (e) => fileInput.click());
  fileContainer.addEventListener('dragover', preventDefaults);
}

// Look at URL an see if we should load a file
// ?fileURL=https://data.kitware.com/api/v1/item/59cdbb588d777f31ac63de08/download
if (userParams.fileURL) {
  const exampleContainer = document.querySelector('.content');
  const rootBody = document.querySelector('body');
  const myContainer = exampleContainer || rootBody;
  load(myContainer, userParams);
}

const viewerContainers = document.querySelectorAll('.vtkjs-volume-viewer');
let nbViewers = viewerContainers.length;
while (nbViewers--) {
  const viewerContainer = viewerContainers[nbViewers];
  const fileURL = viewerContainer.dataset.url;
  const options = {
    containerStyle: { height: '100%' },
    ...userParams,
    fileURL,
  };
  load(viewerContainer, options);
}

// Auto setup if no method get called within 100ms
setTimeout(() => {
  if (autoInit) {
    initLocalFileLoader();
  }
}, 100);
