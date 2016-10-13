/* global XMLHttpRequest */

import * as macro from '../../../macro';
import vtkActor from '../../../../Sources/Rendering/Core/Actor';
import vtkMapper from '../../../../Sources/Rendering/Core/Mapper';
import vtkHttpDataSetReader from '../../../../Sources/IO/Core/HttpDataSetReader';

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

function loadJSON(url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onreadystatechange = (e) => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200 || xhr.status === 0) {
          const data = JSON.parse(xhr.responseText);
          resolve(data);
        } else {
          reject(xhr, e);
        }
      }
    };

    // Make request
    xhr.open('GET', url, true);
    xhr.responseType = 'text';
    xhr.send();
  });
}

function loadHttpDataSetReader(item, model, publicAPI) {
  const reader = vtkHttpDataSetReader.newInstance({ fetchGzip: model.fetchGzip });
  const actor = vtkActor.newInstance();
  model.renderer.addActor(actor);
  const mapper = vtkMapper.newInstance();
  actor.setMapper(mapper);
  mapper.setInputConnection(reader.getOutputPort());

  reader
    .setUrl([model.baseURL, item.httpDataSetReader.url].join('/'))
    .then(() => {
      reader.loadData().then(() => {
        publicAPI.invokeReady();
      });
    });

  if (item.actor) {
    actor.set(item.actor);
  }

  if (item.property) {
    actor.getProperty().set(item.property);
  }

  if (item.mapper) {
    if (item.mapper.colorByArrayName) {
      reader.enableArray(item.mapper.colorByArrayName, item.mapper.colorByArrayName);
      reader.loadData();
    }

    mapper.set(item.mapper);
  }

  if (item.lookupTable) {
    mapper.getLookupTable().set(item.lookupTable);
    mapper.getLookupTable().build();
  }
}

const TYPE_MAPPING = {
  httpDataSetReader: loadHttpDataSetReader,
};

// ----------------------------------------------------------------------------
// vtkHttpSceneLoader methods
// ----------------------------------------------------------------------------

export function vtkHttpSceneLoader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkHttpSceneLoader');

  const originalSceneParameters = {};

  function setCameraParameters(params) {
    const camera = model.renderer.getActiveCamera();
    if (camera) {
      camera.set(params);
    } else {
      console.log('No active camera to update');
    }
  }

  publicAPI.update = () => {
    if (!model.renderer) {
      console.log('No renderer provided, skip update process');
      return;
    }

    loadJSON(model.url)
      .then(
        (data) => {
          if (data.background) {
            model.renderer.setBackground(...data.background);
          }
          if (data.camera) {
            originalSceneParameters.camera = data.camera;
            setCameraParameters(data.camera);
          }
          if (data.scene) {
            data.scene.forEach((item) => {
              const builder = TYPE_MAPPING[item.type];
              if (builder) {
                builder(item, model, publicAPI);
              }
            });
          }
        },
        (error) => {
          console.log('Error fetching scene', error);
        });
  };

  publicAPI.resetScene = () => {
    if ('camera' in originalSceneParameters) {
      setCameraParameters(originalSceneParameters.camera);
    }
  };

  // Set DataSet url
  publicAPI.setUrl = (url) => {
    if (url.indexOf('index.json') === -1) {
      model.baseURL = url;
      model.url = `${url}/index.json`;
    } else {
      model.url = url;

      // Remove the file in the URL
      const path = url.split('/');
      path.pop();
      model.baseURL = path.join('/');
    }

    // Fetch data
    return publicAPI.update();
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  fetchGzip: false,
  url: null,
  baseURL: null,
};

// ----------------------------------------------------------------------------


export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, [
    'fetchGzip',
    'url',
    'baseURL',
  ]);
  macro.setGet(publicAPI, model, [
    'renderer',
  ]);
  macro.event(publicAPI, model, 'ready');

  // Object methods
  vtkHttpSceneLoader(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend);

// ----------------------------------------------------------------------------

export default { newInstance, extend };
