import macro from 'vtk.js/Sources/macro';
import ImageHelper from 'vtk.js/Sources/Common/Core/ImageHelper';
import vtkTexture from 'vtk.js/Sources/Rendering/Core/Texture';

import JSZip from 'jszip';

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
    model.busy = true;
    publicAPI.invokeBusy(model.busy);
    model.dataMapping = {};
    let workCount = 0;

    function workDone() {
      workCount--;

      // Finish data processing
      if (workCount === 0) {
        model.textures = {};
        for (let i = 0; i < model.positions.length; i++) {
          const key = model.positions[i];
          const images = model.dataMapping[key];
          const texture = vtkTexture.newInstance({ interpolate: true });
          for (let idx = 0; idx < 6; idx++) {
            const { fileName, transform } = model.faceMapping[idx];
            texture.setInputData(
              ImageHelper.imageToImageData(images[fileName], transform),
              idx
            );
          }
          model.textures[key] = texture;
        }

        model.busy = false;
        publicAPI.modified();
        publicAPI.invokeBusy(model.busy);
      }
    }

    const zip = new JSZip();
    zip.loadAsync(content).then(() => {
      // Find root index.json
      zip.forEach((relativePath, zipEntry) => {
        if (relativePath.match(/index.json$/)) {
          workCount++;
          zipEntry.async('text').then((txt) => {
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
            workDone();
          });
        }
        if (relativePath.match(/\.jpg$/)) {
          workCount++;
          const pathTokens = relativePath.split('/');
          const fileName = pathTokens.pop();
          const key = pathTokens.pop();
          if (!model.dataMapping[key]) {
            model.dataMapping[key] = {};
          }
          zipEntry.async('base64').then((txt) => {
            const img = new Image();
            model.dataMapping[key][fileName] = img;
            img.onload = workDone;
            img.src = `data:image/jpg;base64,${txt}`;
          });
        }
      });
      model.positions = Object.keys(model.dataMapping);
      model.position = model.positions[0];
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
  faceMapping: [
    { fileName: 'f.jpg', transform: { flipX: true } },
    { fileName: 'b.jpg', transform: { flipX: true } },
    { fileName: 'u.jpg', transform: { flipX: true, rotate: 90 } },
    { fileName: 'd.jpg', transform: { flipX: true, rotate: -90 } },
    { fileName: 'r.jpg', transform: { flipX: true } },
    { fileName: 'l.jpg', transform: { flipX: true } },
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
