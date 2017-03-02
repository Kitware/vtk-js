import macro                from 'vtk.js/Sources/macro';
import vtkActor             from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkMapper            from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkHttpDataSetReader from 'vtk.js/Sources/IO/Core/HttpDataSetReader';

import DataAccessHelper     from 'vtk.js/Sources/IO/Core/DataAccessHelper';

let itemCount = 1;

function applySettings(sceneItem, settings) {
  if (settings.actor) {
    sceneItem.actor.set(settings.actor);
  }

  if (settings.property) {
    sceneItem.actor.getProperty().set(settings.property);
  }

  if (settings.mapper) {
    if (settings.mapper.colorByArrayName) {
      sceneItem.source.enableArray(settings.mapper.colorByArrayName, settings.mapper.colorByArrayName);
      sceneItem.source.loadData();
    }

    sceneItem.mapper.set(settings.mapper);
  }

  if (settings.lookupTable) {
    sceneItem.mapper.getLookupTable().set(settings.lookupTable);
    sceneItem.mapper.getLookupTable().build();
  }
}

// ----------------------------------------------------------------------------
// Global methods
// ----------------------------------------------------------------------------

function loadHttpDataSetReader(item, model, publicAPI) {
  const source = vtkHttpDataSetReader.newInstance({ fetchGzip: model.fetchGzip, dataAccessHelper: model.dataAccessHelper });
  const actor = vtkActor.newInstance();
  const mapper = vtkMapper.newInstance();
  const sceneItem = {
    name: item.name || `Item ${itemCount++}`,
    source,
    mapper,
    actor,
    defaultSettings: item,
  };

  model.renderer.addActor(actor);
  actor.setMapper(mapper);
  mapper.setInputConnection(source.getOutputPort());

  source
    .setUrl([model.baseURL, item.httpDataSetReader.url].join('/'))
    .then(() => {
      source.loadData().then(() => {
        publicAPI.invokeReady();
      });
    });

  applySettings(sceneItem, item);
  model.scene.push(sceneItem);

  return sceneItem;
}

const TYPE_MAPPING = {
  httpDataSetReader: loadHttpDataSetReader,
};

// ----------------------------------------------------------------------------
// vtkHttpSceneLoader methods
// ----------------------------------------------------------------------------

export function vtkHttpSceneLoader(publicAPI, model) {
  const originalSceneParameters = {};

  // Set our className
  model.classHierarchy.push('vtkHttpSceneLoader');

  // Create scene container
  if (!model.scene) {
    model.scene = [];
  }

  function setCameraParameters(params) {
    const camera = model.renderer.getActiveCamera();
    if (camera) {
      camera.set(params);
    } else {
      vtkErrorMacro('No active camera to update');
    }
  }

  // Create default dataAccessHelper if not available
  if (!model.dataAccessHelper) {
    model.dataAccessHelper = DataAccessHelper.get('http');
  }

  publicAPI.update = () => {
    if (!model.renderer) {
      vtkWarningMacro('No renderer provided, skip update process');
      return;
    }

    model.dataAccessHelper.fetchJSON(publicAPI, model.url)
      .then(
        (data) => {
          if (data.fetchGzip !== undefined) {
            model.fetchGzip = data.fetchGzip;
          }
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
            global.scene = model.scene;
          }
        },
        (error) => {
          vtkErrorMacro(`Error fetching scene ${error}`);
        });
  };

  publicAPI.resetScene = () => {
    if (originalSceneParameters.camera) {
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
    'scene',
  ]);
  macro.setGet(publicAPI, model, [
    'renderer',
  ]);
  macro.event(publicAPI, model, 'ready');

  // Object methods
  vtkHttpSceneLoader(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkHttpSceneLoader');

// ----------------------------------------------------------------------------

export default { newInstance, extend, applySettings };
