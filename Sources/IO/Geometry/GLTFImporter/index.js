import macro from 'vtk.js/Sources/macros';
import { mat4, vec3 } from 'gl-matrix';

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
import { BINARY_HEADER_MAGIC } from 'vtk.js/Sources/IO/Geometry/GLTFImporter/Constants';
import {
  parseSkeletalAnimationFromGLTF,
  parseNodeAnimationsFromGLTF,
  parsePointerAnimationsFromGLTF,
} from 'vtk.js/Sources/IO/Geometry/GLTFImporter/Animation';
import { clearImageCaches } from 'vtk.js/Sources/IO/Geometry/GLTFImporter/Utils';

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
    const path = `${url}`.replace(/\\/g, '/').split('/');
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
      const jsonText = new TextDecoder('utf-8').decode(new Uint8Array(content));
      glTF.json = JSON.parse(jsonText);
    }

    if (glTF.json.asset === undefined || glTF.json.asset.version[0] < 2) {
      vtkErrorMacro('Unsupported asset. glTF versions >=2.0 are supported.');
      return;
    }

    model.glTFTree = await parseGLTF(glTF, options);

    model.actors = new Map();
    model.cameras = new Map();
    model.lights = new Map();
    model.nodeLights = new Map(); // Store nodeId → vtkLight for animated lights
    model.animations = [];
    model.variants = [];
    model.variantMappings = new Map();
    model.nodeTransforms = new Map();
    model.nodeChildren = new Map();
    model.skins = new Map();
    model.skeletons = [];
    model.animationClips = [];
    model.nodeAnimations = []; // Store node transform animations
    model.morphTargets = new Map(); // Store morph target data per actor
    model.materialProperties = new Map(); // Store material index → [vtkProperty]
    model.pointerAnimations = []; // Store KHR_animation_pointer animations

    await createVTKObjects(model);

    const skeletalData = parseSkeletalAnimationFromGLTF(model.glTFTree);
    model.skeletons = skeletalData.skeletons;
    model.animationClips = skeletalData.animationClips;

    // Parse node transform animations (non-skeletal)
    model.nodeAnimations = parseNodeAnimationsFromGLTF(model.glTFTree);

    // Parse KHR_animation_pointer animations (texture transforms, etc.)
    model.pointerAnimations = parsePointerAnimationsFromGLTF(model.glTFTree);

    // Emit skeletal data events
    for (const skeletalInfo of model.skeletons) {
      publicAPI.invokeSkeletonLoaded({
        skeleton: skeletalInfo.skeleton,
        gltfSkinIndex: skeletalInfo.gltfSkinIndex,
      });
    }

    for (const clip of model.animationClips) {
      publicAPI.invokeAnimationClipLoaded({ clip });
    }

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
    vtkDebugMacro(
      'importAnimations() is deprecated - use getSkeletons() and getAnimationClips()'
    );
  };

  publicAPI.importLights = () => {
    // Set up lights
    model.lights?.forEach((light) => {
      model.renderer.addLight(light);
    });
  };

  publicAPI.setCamera = (cameraId) => {
    const camera = model.cameras.get(cameraId);

    if (!camera) {
      vtkErrorMacro(`Camera ${cameraId} not found`);
      return;
    }
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

  /**
   * Get parsed skeletons from glTF
   * @return {Array} Array of { skeleton, gltfSkinIndex }
   */
  publicAPI.getSkeletons = () => model.skeletons || [];

  /**
   * Get parsed animation clips from glTF
   * @return {Array} Array of vtkAnimationClip
   */
  publicAPI.getAnimationClips = () => model.animationClips || [];

  /**
   * Get animation clip by name
   * @param {string} name
   * @return {vtkAnimationClip}
   */
  publicAPI.getAnimationClipByName = (name) =>
    (model.animationClips || []).find((clip) => clip.getName() === name) ||
    null;

  /**
   * Get all animation clip names
   * @return {Array<string>}
   */
  publicAPI.getAnimationClipNames = () =>
    (model.animationClips || []).map((clip) => clip.getName());

  /**
   * Get parsed node transform animations (non-skeletal)
   * @return {Array} Array of node animation objects with evaluate(time) method
   */
  publicAPI.getNodeAnimations = () => model.nodeAnimations || [];

  /**
   * Get parsed KHR_animation_pointer animations
   * @return {Array} Array of pointer animation objects with evaluate(time) method
   */
  publicAPI.getPointerAnimations = () => model.pointerAnimations || [];

  /**
   * Compute axis-aligned bounding box for the scene using glTF accessor
   * min/max metadata transformed by node world matrices.
   * Based on the Khronos glTF-Sample-Renderer approach.
   * @param {number} [sceneIndex=0] Scene index to compute bounds for
   * @return {number[]|null} [xmin, xmax, ymin, ymax, zmin, zmax] or null
   */
  publicAPI.getSceneBounds = (sceneIndex = 0) => {
    if (!model.glTFTree || !model.scenes) return null;

    const scene = model.scenes[sceneIndex];
    if (!scene) return null;

    const outMin = [
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      Number.POSITIVE_INFINITY,
    ];
    const outMax = [
      Number.NEGATIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
    ];

    // Traverse all nodes in the scene
    const traverseNode = (node, parentMatrix) => {
      if (!node) return;

      // Get this node's world matrix from stored transforms
      const nodeInfo = model.nodeTransforms?.get(node.id);
      const worldMatrix = nodeInfo
        ? nodeInfo.worldMatrix
        : parentMatrix || mat4.create();

      // If node has a mesh, compute bounds from primitive accessors
      if (node.mesh && node.mesh.primitives) {
        for (const primitive of node.mesh.primitives) {
          const posAccessor = primitive.attributes?.position;
          if (!posAccessor || !posAccessor.min || !posAccessor.max) continue;

          const aMin = posAccessor.min;
          const aMax = posAccessor.max;

          // Build 8 corners of the bounding box
          const corners = [
            vec3.fromValues(aMin[0], aMin[1], aMin[2]),
            vec3.fromValues(aMin[0], aMin[1], aMax[2]),
            vec3.fromValues(aMin[0], aMax[1], aMin[2]),
            vec3.fromValues(aMin[0], aMax[1], aMax[2]),
            vec3.fromValues(aMax[0], aMin[1], aMin[2]),
            vec3.fromValues(aMax[0], aMin[1], aMax[2]),
            vec3.fromValues(aMax[0], aMax[1], aMin[2]),
            vec3.fromValues(aMax[0], aMax[1], aMax[2]),
          ];

          // Transform corners by world matrix
          for (const corner of corners) {
            vec3.transformMat4(corner, corner, worldMatrix);
            for (let c = 0; c < 3; c++) {
              outMin[c] = Math.min(outMin[c], corner[c]);
              outMax[c] = Math.max(outMax[c], corner[c]);
            }
          }
        }
      }

      // Recurse into children
      if (node.children) {
        for (const child of node.children) {
          traverseNode(child, worldMatrix);
        }
      }
    };

    if (scene.nodes) {
      for (const node of scene.nodes) {
        traverseNode(node, mat4.create());
      }
    }

    // Check if we found any valid bounds
    if (outMin[0] > outMax[0]) return null;

    // Return as [xmin, xmax, ymin, ymax, zmin, zmax] for vtk
    return [outMin[0], outMax[0], outMin[1], outMax[1], outMin[2], outMax[2]];
  };

  publicAPI.releaseGraphicsResources = () => {
    if (model.renderer) {
      model.actors?.forEach((actor) => {
        model.renderer.removeActor(actor);
        actor.delete?.();
      });
      model.lights?.forEach((light) => {
        model.renderer.removeLight(light);
        light.delete?.();
      });
    }

    model.actors?.clear?.();
    model.cameras?.clear?.();
    model.lights?.clear?.();
    model.nodeLights?.clear?.();
    model.variantMappings?.clear?.();
    model.nodeTransforms?.clear?.();
    model.nodeChildren?.clear?.();
    model.skins?.clear?.();
    model.morphTargets?.clear?.();
    model.materialProperties?.clear?.();
    model.pointerAnimations = [];
    model.nodeAnimations = [];
    model.animationClips = [];
    model.skeletons = [];
    model.animations = [];
    model.scenes = [];
    model.glTFTree = null;
    model.parseData = null;
    clearImageCaches();
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
    'variants',
    'variantMappings',
    'skeletons',
    'animationClips',
    'nodeAnimations',
    'nodeTransforms',
    'nodeChildren',
    'skins',
    'morphTargets',
    'materialProperties',
    'pointerAnimations',
    'nodeLights',
  ]);
  macro.set(publicAPI, model, ['renderer', 'dracoDecoder']);
  macro.event(publicAPI, model, 'ready');
  macro.event(publicAPI, model, 'skeletonLoaded');
  macro.event(publicAPI, model, 'animationClipLoaded');

  // vtkGLTFImporter methods
  vtkGLTFImporter(publicAPI, model);
  publicAPI.delete = macro.chain(
    () => publicAPI.releaseGraphicsResources(),
    publicAPI.delete
  );

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
