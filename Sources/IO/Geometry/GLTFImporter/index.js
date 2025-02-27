import macro from 'vtk.js/Sources/macros';

import BinaryHelper from 'vtk.js/Sources/IO/Core/BinaryHelper';
import DataAccessHelper from 'vtk.js/Sources/IO/Core/DataAccessHelper';
import vtkDracoReader from 'vtk.js/Sources/IO/Geometry/DracoReader';
import {
  createVTKObjects,
  parseGLTF,
  GLTFCameraToVTKCamera,
  applyTransformToCamera,
  createPropertyFromGLTFMaterial,
} from 'vtk.js/Sources/IO/Geometry/GLTFImporter/Reader';
import parseGLB from 'vtk.js/Sources/IO/Geometry/GLTFImporter/Decoder';
import { createAnimationMixer } from 'vtk.js/Sources/IO/Geometry/GLTFImporter/Animations';
import { BINARY_HEADER_MAGIC } from 'vtk.js/Sources/IO/Geometry/GLTFImporter/Constants';

const { vtkDebugMacro, vtkErrorMacro } = macro;

// ----------------------------------------------------------------------------
// vtkGLTFImporter methods
// ----------------------------------------------------------------------------

function vtkGLTFImporter(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkGLTFImporter');

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

  // Set DataSet url
  publicAPI.setUrl = (url, option = { binary: true }) => {
    model.url = url;

    // Remove the file in the URL
    const path = url.split('/');
    path.pop();
    model.baseURL = path.join('/');

    model.compression = option.compression;
    model.sceneId = option.sceneId ? option.sceneId : 0;

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

  publicAPI.parseAsBinary = async (content) => {
    if (!content) {
      return;
    }
    if (content !== model.parseData) {
      publicAPI.modified();
    } else {
      return;
    }

    const glTF = {};
    const options = {
      baseUri: model.baseURL,
    };

    const magic = BinaryHelper.arrayBufferToString(
      new Uint8Array(content, 0, 4)
    );

    if (magic === BINARY_HEADER_MAGIC) {
      const { json, buffers } = parseGLB(content);
      vtkDebugMacro('Loaded GLB', json, buffers);
      glTF.glbBuffers = buffers;
      glTF.json = json;
    } else {
      glTF.json = JSON.parse(BinaryHelper.arrayBufferToString(content));
    }

    if (glTF.json.asset === undefined || glTF.json.asset.version[0] < 2) {
      vtkErrorMacro('Unsupported asset. glTF versions >=2.0 are supported.');
      return;
    }

    model.glTFTree = await parseGLTF(glTF, options);

    model.actors = new Map();
    model.cameras = new Map();
    model.lights = new Map();
    model.animations = [];
    model.variants = [];
    model.variantMappings = new Map();

    await createVTKObjects(model);

    model.scenes = model.glTFTree.scenes;

    publicAPI.invokeReady();
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

  publicAPI.setDracoDecoder = async (dracoDecoder) => {
    await vtkDracoReader.setDracoDecoder(dracoDecoder);
  };

  publicAPI.importActors = () => {
    // Add actors to renderer
    model.actors.forEach((actor) => model.renderer.addActor(actor));
  };

  publicAPI.importCameras = () => {
    // Set up camera
    model.glTFTree.cameras?.forEach((glTFcamera) => {
      const camera = GLTFCameraToVTKCamera(glTFcamera);
      model.cameras.set(glTFcamera.id, camera);
    });

    model.scenes.forEach((scene) => {
      scene.nodes.forEach((node) => {
        const camera = model.cameras.get(node.camera?.id);
        if (camera) {
          applyTransformToCamera(camera, node.transform);
        }
      });
    });
  };

  publicAPI.importAnimations = () => {
    // Set up animations
    if (model.glTFTree.animations?.length > 0) {
      model.animationMixer = createAnimationMixer(
        model.actors,
        model.glTFTree.accessors
      );
      model.glTFTree.animations.forEach((animation) => {
        model.animationMixer.addAnimation(animation);
      });
    }
    model.animations = model.glTFTree.animations || [];
  };

  publicAPI.importLights = () => {
    // Set up lights
    model.lights?.forEach((light) => {
      vtkDebugMacro('Adding light', light);
      model.renderer.addLight(light);
    });
  };

  publicAPI.setCamera = (cameraId) => {
    const camera = model.cameras.get(cameraId);

    if (!camera) {
      vtkErrorMacro(`Camera ${cameraId} not found`);
      return;
    }
    vtkDebugMacro('Setting camera', camera);
    model.renderer.setActiveCamera(camera);
  };

  publicAPI.switchToVariant = async (variantIndex) => {
    const promises = Array.from(model.actors).map(async ([nodeId, actor]) => {
      vtkDebugMacro('Switching to variant', variantIndex, 'for node', nodeId);
      const variantMappings = model.variantMappings.get(nodeId);

      if (variantMappings) {
        const mapping = variantMappings.find((m) =>
          m.variants.includes(variantIndex)
        );
        if (mapping) {
          const variantMaterial = model.glTFTree.materials[mapping.material];
          await createPropertyFromGLTFMaterial(model, variantMaterial, actor);
        }
      }
    });

    await Promise.all(promises);
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
  macro.get(publicAPI, model, [
    'url',
    'baseURL',
    'actors',
    'scenes',
    'cameras',
    'animations',
    'animationMixer',
    'variants',
    'variantMappings',
  ]);
  macro.set(publicAPI, model, ['renderer', 'dracoDecoder']);
  macro.event(publicAPI, model, 'ready');

  // vtkGLTFImporter methods
  vtkGLTFImporter(publicAPI, model);

  // To support destructuring
  if (!model.compression) {
    model.compression = null;
  }
  if (!model.progressCallback) {
    model.progressCallback = null;
  }
}
// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkGLTFImporter');

// ----------------------------------------------------------------------------

export default {
  extend,
  newInstance,
};
