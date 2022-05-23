import macro from 'vtk.js/Sources/macros';
import ImageHelper from 'vtk.js/Sources/Common/Core/ImageHelper';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';

import { strFromU8, unzipSync } from 'fflate';

// ----------------------------------------------------------------------------
// vtkSkyboxReader methods
// ----------------------------------------------------------------------------

function vtkSkyboxReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkSkyboxReader');

  // Internal method to fetch Array
  function fetchData(url, option = {}) {
    const { compression, progressCallback } = model;
    return model.dataAccessHelper.fetchBinary(url, {
      compression,
      progressCallback,
    });
  }

  // Set DataSet url
  publicAPI.setUrl = (url, option = {}) => {
    model.url = url;

    // Fetch metadata
    return publicAPI.loadData(option);
  };

  // Fetch the actual data arrays
  publicAPI.loadData = (option = {}) =>
    fetchData(model.url, option).then(publicAPI.parseAsArrayBuffer);

  publicAPI.parseAsArrayBuffer = (content) => {
    if (!content) {
      return false;
    }
    model.textures = {};
    model.busy = true;
    publicAPI.invokeBusy(model.busy);
    model.dataMapping = {};
    const imageReady = [];

    // Finish data processing
    function workDone() {
      for (let i = 0; i < model.positions.length; i++) {
        const key = model.positions[i];
        const images = model.dataMapping[key];
        if (!model.textures[key]) {
          model.textures[key] = vtkTexture.newInstance({ interpolate: true });
        }
        if (images) {
          const texture = model.textures[key];

          for (let idx = 0; idx < 6; idx++) {
            const { fileName, transform } = model.faceMapping[idx];
            const readyIndex = imageReady.indexOf(`${key}/${fileName}`);

            if (readyIndex !== -1) {
              texture.setInputData(
                ImageHelper.imageToImageData(images[fileName], transform),
                idx
              );

              // Free image
              URL.revokeObjectURL(images[fileName].src);
              delete images[fileName];

              // Don't process again
              imageReady.splice(readyIndex, 1);
            }
          }
        }
      }

      model.busy = false;
      publicAPI.modified();
      publicAPI.invokeBusy(model.busy);
    }

    const decompressedFiles = unzipSync(new Uint8Array(content));
    const pending = [];
    // Find root index.json
    Object.entries(decompressedFiles).forEach(([relativePath, fileData]) => {
      if (relativePath.match(/index.json$/)) {
        const txt = strFromU8(fileData);
        const config = JSON.parse(txt);
        if (config.skybox && config.skybox.faceMapping) {
          model.faceMapping = config.skybox.faceMapping;
        }
        if (
          config.metadata &&
          config.metadata.skybox &&
          config.metadata.skybox.faceMapping
        ) {
          model.faceMapping = config.metadata.skybox.faceMapping;
        }
      }
      if (relativePath.match(/\.jpg$/)) {
        const pathTokens = relativePath.split('/');
        const fileName = pathTokens.pop();
        const key = pathTokens.pop();
        if (!model.dataMapping[key]) {
          model.dataMapping[key] = {};
        }
        const blob = new Blob([fileData.buffer]);
        const img = new Image();
        const readyKey = `${key}/${fileName}`;
        model.dataMapping[key][fileName] = img;
        pending.push(
          new Promise((resolve) => {
            img.onload = () => {
              imageReady.push(readyKey);
              resolve();
            };
          })
        );
        img.src = URL.createObjectURL(blob);
      }
    });

    model.positions = Object.keys(model.dataMapping);
    model.position = model.positions[0];

    Promise.all(pending).then(() => {
      workDone();
    });

    return publicAPI.getReadyPromise();
  };

  publicAPI.requestData = (inData, outData) => {
    outData[0] = model.textures[model.position];
  };

  publicAPI.setPosition = (name) => {
    if (model.positions.indexOf(name) !== -1 && name !== model.position) {
      model.position = name;
      publicAPI.modified();
    }
  };

  publicAPI.getReadyPromise = () => {
    if (!model.busy) {
      return Promise.resolve(publicAPI);
    }
    return new Promise((resolve, reject) => {
      const subscription = publicAPI.onBusy((isBusy) => {
        if (!isBusy) {
          subscription.unsubscribe();
          resolve(publicAPI);
        }
      });
    });
  };

  // return Busy state
  publicAPI.isBusy = () => model.busy;
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // url: null,
  busy: false,
  // everything must be flipped in Y due to canvas
  // versus vtk ordering
  faceMapping: [
    { fileName: 'right.jpg', transform: { flipY: true } },
    { fileName: 'left.jpg', transform: { flipY: true } },
    { fileName: 'up.jpg', transform: { flipY: true } },
    { fileName: 'down.jpg', transform: { flipY: true } },
    { fileName: 'back.jpg', transform: { flipY: true } },
    { fileName: 'front.jpg', transform: { flipY: true } },
  ],
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['url', 'positions', 'position']);
  macro.setGet(publicAPI, model, ['faceMapping']);
  macro.event(publicAPI, model, 'busy');
  macro.algo(publicAPI, model, 0, 6);

  // Object methods
  vtkSkyboxReader(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkSkyboxReader');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
