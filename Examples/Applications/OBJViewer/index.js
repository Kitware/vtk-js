/* eslint-disable import/prefer-default-export */
/* eslint-disable import/no-extraneous-dependencies */

import 'babel-polyfill';
import JSZip from 'jszip';

import vtkFullScreenRenderWindow  from 'vtk.js/Sources/Rendering/Misc/FullScreenRenderWindow';

import vtkOBJReader               from 'vtk.js/Sources/IO/Misc/OBJReader';
import vtkMTLReader               from 'vtk.js/Sources/IO/Misc/MTLReader';
import vtkMapper                  from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkActor                   from 'vtk.js/Sources/Rendering/Core/Actor';

import style from './OBJViewer.mcss';

const iOS = /iPad|iPhone|iPod/.test(window.navigator.platform);

// Add class to body if iOS device --------------------------------------------

if (iOS) {
  document.querySelector('body').classList.add('is-ios-device');
}

function emptyContainer(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}

export function load(container, options) {
  emptyContainer(container);

  const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance();
  const renderer = fullScreenRenderer.getRenderer();
  const renderWindow = fullScreenRenderer.getRenderWindow();

  if (options.file) {
    if (options.ext === 'obj') {
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
        }
        renderer.resetCamera();
        renderWindow.render();
      };
      reader.readAsText(options.file);
    } else {
      // ZipContent
      const fileContents = { obj: {}, mtl: {}, img: {} };
      const zip = new JSZip();
      zip
        .loadAsync(options.file)
        .then(() => {
          let workLoad = 0;

          function done() {
            if (workLoad !== 0) {
              return;
            }
            // Attach images to MTLs
            Object.keys(fileContents.mtl).forEach((mtlFilePath) => {
              const mtlReader = fileContents.mtl[mtlFilePath];
              const basePath = mtlFilePath.split('/').filter((v, i, a) => i < (a.length - 1)).join('/');
              mtlReader.listImages().forEach((relPath) => {
                const key = `${basePath}/${relPath}`;
                const imgSRC = fileContents.img[key];
                if (imgSRC) {
                  mtlReader.setImageSrc(relPath, imgSRC);
                }
              });
            });

            // Create pipeline from obj
            Object.keys(fileContents.obj).forEach((objFilePath) => {
              const mtlFilePath = objFilePath.replace(/\.obj$/, '.mtl');
              const objReader = fileContents.obj[objFilePath];
              const mtlReader = fileContents.mtl[mtlFilePath];

              const size = objReader.getNumberOfOutputPorts();
              for (let i = 0; i < size; i++) {
                const source = objReader.getOutputData(i);
                const mapper = vtkMapper.newInstance();
                const actor = vtkActor.newInstance();
                const name = source.get('name').name;

                actor.setMapper(mapper);
                mapper.setInputData(source);
                renderer.addActor(actor);

                if (mtlReader && name) {
                  mtlReader.applyMaterialToActor(name, actor);
                }
              }
            });
            renderer.resetCamera();
            renderWindow.render();
          }

          zip.forEach((relativePath, zipEntry) => {
            if (relativePath.match(/\.obj$/i)) {
              workLoad++;
              zipEntry.async('string').then((txt) => {
                const reader = vtkOBJReader.newInstance({ splitMode: 'usemtl' });
                reader.parse(txt);
                fileContents.obj[relativePath] = reader;
                workLoad--;
                done();
              });
            }
            if (relativePath.match(/\.mtl$/i)) {
              workLoad++;
              zipEntry.async('string').then((txt) => {
                const reader = vtkMTLReader.newInstance();
                reader.parse(txt);
                fileContents.mtl[relativePath] = reader;
                workLoad--;
                done();
              });
            }
            if (relativePath.match(/\.jpg$/i) || relativePath.match(/\.png$/i)) {
              workLoad++;
              zipEntry.async('base64').then((txt) => {
                const ext = relativePath.slice(-3).toLowerCase();
                fileContents.img[relativePath] = `data:image/${ext};base64,${txt}`;
                workLoad--;
                done();
              });
            }
          });
        });
    }
  }
}

export function initLocalFileLoader(container) {
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
      const ext = files[0].name.split('.').slice(-1)[0];
      load(myContainer, { file: files[0], ext });
    }
  }

  fileSelector.onchange = handleFile;
}

// File loader only
initLocalFileLoader();
