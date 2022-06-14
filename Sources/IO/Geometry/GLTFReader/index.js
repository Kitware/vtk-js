/* eslint-disable no-debugger */

import BinaryHelper from 'vtk.js/Sources/IO/Core/BinaryHelper';
import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';

import macro from 'vtk.js/Sources/macros';

import GLTFSceneLoader from './SceneLoader';
import GLTFParser from './Parser';
// import { BINARY_HEADER_MAGIC, GLTFBinaryData } from './Decoder';

const { vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkGLTFReader methods
// ----------------------------------------------------------------------------

function vtkGLTFReader(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkGLTFReader');

  // Create default dataAccessHelper if not available
  if (!model.dataAccessHelper) {
    model.dataAccessHelper = DataAccessHelper.get('http');
  }

  // Internal method to fetch Array
  function fetchData(url, option = {}) {
    const { compression, progressCallback } = model;
    if (option.binary) {
      return model.dataAccessHelper.fetchBinary(url, {
        compression,
        progressCallback,
      });
    }
    return model.dataAccessHelper.fetchText(publicAPI, url, {
      compression,
      progressCallback,
    });
  }

  // function updateTimeStep(timestep) {}

  // Set DataSet url
  publicAPI.setUrl = (url, option = { binary: true }) => {
    model.url = url;

    // Remove the file in the URL
    const path = url.split('/');
    path.pop();
    model.baseURL = path.join('/');

    model.compression = option.compression;

    // Fetch metadata
    return publicAPI.loadData({
      progressCallback: option.progressCallback,
      binary: !!option.binary,
    });
  };

  // Fetch the actual data arrays
  publicAPI.loadData = (option = {}) => {
    const promise = fetchData(model.url, option);
    promise.then(publicAPI.parse);
    return promise;
  };

  publicAPI.parse = (content) => {
    if (typeof content === 'string') {
      publicAPI.parseAsText(content);
    } else {
      publicAPI.parseAsBinary(content);
    }
  };

  publicAPI.parseAsBinary = (content) => {
    if (!content) {
      return;
    }
    if (content !== model.parseData) {
      publicAPI.modified();
    } else {
      return;
    }

    const gltf = {};
    const promises = [];

    gltf.json = JSON.parse(BinaryHelper.arrayBufferToString(content));

    console.log(gltf.json);

    if (gltf.json.asset === undefined || gltf.json.asset.version[0] < 2) {
      vtkErrorMacro('Unsupported asset. glTF versions >=2.0 are supported.');
      return;
    }

    /* for glb use the baseUri to set the base uri */
    const options = {
      baseUri: 'http://127.0.0.1:8080/Data/gltf/Cube/',
    };
    const parser = new GLTFParser(gltf, options);

    // Populate buffers
    // Create an external buffers array to hold binary data
    const buffers = gltf.json.buffers || [];
    gltf.buffers = new Array(buffers.length).fill(null);
    promises.push(parser.loadBuffers());

    // Populate images
    const images = gltf.json.images || [];
    gltf.images = new Array(images.length).fill({});
    promises.push(parser.loadImages());

    Promise.all(promises)
      .then((res) => {
        model.parseData = parser.parse();
        console.log(model.parseData);
        const scene = new GLTFSceneLoader(model.parseData, 0, model.renderer);
        scene.load();
      })
      .then(() => {
        publicAPI.invokeReady();
      });
  };

  publicAPI.parseAsText = (content) => {
    if (!content) {
      return;
    }
    if (content !== model.parseData) {
      publicAPI.modified();
    } else {
      return;
    }

    model.parseData = content;
  };

  publicAPI.requestData = (inData, outData) => {
    publicAPI.parse(model.parseData);
  };
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  // baseURL: null,
  // dataAccessHelper: null,
  // url: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);
  macro.get(publicAPI, model, ['url', 'baseURL']);
  macro.setGet(publicAPI, model, ['renderer']);
  macro.event(publicAPI, model, 'ready');

  // vtkGLTFReader methods
  vtkGLTFReader(publicAPI, model);

  // To support destructuring
  if (!model.compression) {
    model.compression = null;
  }
  if (!model.progressCallback) {
    model.progressCallback = null;
  }
}
// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkGLTFReader');

// ----------------------------------------------------------------------------

export default {
  extend,
  newInstance,
};
