import macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';

import vtkActor from 'vtk.js/Sources/Rendering/Core/Actor';
import vtkCamera from 'vtk.js/Sources/Rendering/Core/Camera';
import vtkDataArray from 'vtk.js/Sources/Common/Core/DataArray';
import vtkPolyData from 'vtk.js/Sources/Common/DataModel/PolyData';
import vtkMapper from 'vtk.js/Sources/Rendering/Core/Mapper';
import vtkCellArray from 'vtk.js/Sources/Common/Core/CellArray';
import vtkTransform from 'vtk.js/Sources/Common/Transform/Transform';
import GLTFParser from 'vtk.js/Sources/IO/Geometry/GLTFImporter/Parser';
import {
  ALPHA_MODE,
  MODES,
  SEMANTIC_ATTRIBUTE_MAP,
} from 'vtk.js/Sources/IO/Geometry/GLTFImporter/Constants';
import {
  createVTKTextureFromGLTFTexture,
  loadImage,
} from 'vtk.js/Sources/IO/Geometry/GLTFImporter/Utils';
import {
  handleKHRDracoMeshCompression,
  handleKHRLightsPunctual,
  handleKHRMaterialsIor,
  handleKHRMaterialsSpecular,
  handleKHRMaterialsUnlit,
  handleKHRMaterialsVariants,
} from 'vtk.js/Sources/IO/Geometry/GLTFImporter/Extensions';

import { mat4, quat, vec3 } from 'gl-matrix';

const { vtkWarningMacro, vtkDebugMacro } = macro;

/**
 * Parses a GLTF objects
 * @param {Object} gltf - The GLTF object to parse
 * @returns {glTF} The parsed GLTF object
 */
async function parseGLTF(gltf, options) {
  const parser = new GLTFParser(gltf, options);
  const tree = await parser.parse();
  return tree;
}

/**
 * Creates VTK polydata from a GLTF mesh primitive
 * @param {GLTFPrimitive} primitive - The GLTF mesh primitive
 * @returns {vtkPolyData} The created VTK polydata
 */
async function createPolyDataFromGLTFMesh(primitive) {
  if (!primitive || !primitive.attributes) {
    vtkWarningMacro('Primitive has no position data, skipping');
    return null;
  }

  if (primitive.extensions?.KHR_draco_mesh_compression) {
    return handleKHRDracoMeshCompression(
      primitive.extensions.KHR_draco_mesh_compression
    );
  }

  const polyData = vtkPolyData.newInstance();
  const cells = vtkCellArray.newInstance();
  const pointData = polyData.getPointData();

  const attrs = Object.entries(primitive.attributes);
  attrs.forEach(async ([attributeName, accessor]) => {
    switch (attributeName) {
      case SEMANTIC_ATTRIBUTE_MAP.POSITION: {
        const position = primitive.attributes.position.value;
        polyData
          .getPoints()
          .setData(position, primitive.attributes.position.component);
        break;
      }
      case SEMANTIC_ATTRIBUTE_MAP.NORMAL: {
        const normals = primitive.attributes.normal.value;
        pointData.setNormals(
          vtkDataArray.newInstance({
            name: 'Normals',
            values: normals,
            numberOfComponents: primitive.attributes.normal.components,
          })
        );
        break;
      }
      case SEMANTIC_ATTRIBUTE_MAP.COLOR_0: {
        const color = primitive.attributes.color.value;
        pointData.setScalars(
          vtkDataArray.newInstance({
            name: 'Scalars',
            values: color,
            numberOfComponents: primitive.attributes.color.components,
          })
        );
        break;
      }
      case SEMANTIC_ATTRIBUTE_MAP.TEXCOORD_0: {
        const tcoords0 = primitive.attributes.texcoord0.value;
        const da = vtkDataArray.newInstance({
          name: 'TEXCOORD_0',
          values: tcoords0,
          numberOfComponents: primitive.attributes.texcoord0.components,
        });
        pointData.addArray(da);
        pointData.setActiveTCoords(da.getName());
        break;
      }
      case SEMANTIC_ATTRIBUTE_MAP.TEXCOORD_1: {
        const tcoords = primitive.attributes.texcoord1.value;
        const dac = vtkDataArray.newInstance({
          name: 'TEXCOORD_1',
          values: tcoords,
          numberOfComponents: primitive.attributes.texcoord1.components,
        });
        pointData.addArray(dac);
        break;
      }
      case SEMANTIC_ATTRIBUTE_MAP.TANGENT: {
        const tangent = primitive.attributes.tangent.value;
        const dat = vtkDataArray.newInstance({
          name: 'Tangents',
          values: tangent,
          numberOfComponents: primitive.attributes.tangent.components,
        });
        pointData.addArray(dat);
        break;
      }
      default:
        vtkWarningMacro(`Unhandled attribute: ${attributeName}`);
    }
  });

  // Handle indices if available
  if (primitive.indices != null) {
    const indices = primitive.indices.value;
    const nCells = indices.length - 2;
    switch (primitive.mode) {
      case MODES.GL_LINE_STRIP:
      case MODES.GL_TRIANGLE_STRIP:
      case MODES.GL_LINE_LOOP:
        vtkWarningMacro('GL_LINE_LOOP not implemented');
        break;
      default:
        cells.allocate((4 * indices.length) / 3);
        for (let cellId = 0; cellId < nCells; cellId += 3) {
          const cell = indices.slice(cellId, cellId + 3);
          cells.insertNextCell(cell);
        }
    }
  }

  switch (primitive.mode) {
    case MODES.GL_TRIANGLES:
    case MODES.GL_TRIANGLE_FAN:
      polyData.setPolys(cells);
      break;
    case MODES.GL_LINES:
    case MODES.GL_LINE_STRIP:
    case MODES.GL_LINE_LOOP:
      polyData.setLines(cells);
      break;
    case MODES.GL_POINTS:
      polyData.setVerts(cells);
      break;
    case MODES.GL_TRIANGLE_STRIP:
      polyData.setStrips(cells);
      break;
    default:
      cells.delete();
      vtkWarningMacro('Invalid primitive draw mode. Ignoring connectivity.');
  }

  return polyData;
}

/**
 * Creates a VTK property from a GLTF material
 * @param {object} model - The vtk model object
 * @param {GLTFMaterial} material - The GLTF material
 * @param {vtkActor} actor - The VTK actor
 */
async function createPropertyFromGLTFMaterial(model, material, actor) {
  let metallicFactor = 1.0;
  let roughnessFactor = 1.0;
  const emissiveFactor = material.emissiveFactor;

  const property = actor.getProperty();
  const pbr = material.pbrMetallicRoughness;

  if (pbr != null) {
    if (
      !pbr?.metallicFactor ||
      pbr?.metallicFactor <= 0 ||
      pbr?.metallicFactor >= 1
    ) {
      vtkDebugMacro(
        'Invalid material.pbrMetallicRoughness.metallicFactor value. Using default value instead.'
      );
    } else metallicFactor = pbr.metallicFactor;
    if (
      !pbr?.roughnessFactor ||
      pbr?.roughnessFactor <= 0 ||
      pbr?.roughnessFactor >= 1
    ) {
      vtkDebugMacro(
        'Invalid material.pbrMetallicRoughness.roughnessFactor value. Using default value instead.'
      );
    } else roughnessFactor = pbr.roughnessFactor;

    const color = pbr.baseColorFactor;

    if (color != null) {
      property.setDiffuseColor(color[0], color[1], color[2]);
      property.setOpacity(color[3]);
    }

    property.setMetallic(metallicFactor);
    property.setRoughness(roughnessFactor);
    property.setEmission(emissiveFactor);

    if (pbr.baseColorTexture) {
      const extensions = pbr.baseColorTexture.extensions;
      const tex = pbr.baseColorTexture.texture;

      if (tex.extensions != null) {
        const extensionsNames = Object.keys(tex.extensions);
        extensionsNames.forEach((extensionName) => {
          // TODO: Handle KHR_texture_basisu extension
          // const extension = tex.extensions[extensionName];
          switch (extensionName) {
            default:
              vtkWarningMacro(`Unhandled extension: ${extensionName}`);
          }
        });
      }

      const sampler = tex.sampler;
      const image = await loadImage(tex.source);
      const diffuseTex = createVTKTextureFromGLTFTexture(
        image,
        sampler,
        extensions
      );

      property.setDiffuseTexture(diffuseTex);
    }

    // Handle metallic-roughness texture (metallicRoughnessTexture)
    if (pbr.metallicRoughnessTexture) {
      const extensions = pbr.metallicRoughnessTexture.extensions;
      const tex = pbr.metallicRoughnessTexture.texture;
      const sampler = tex.sampler;
      const rmImage = await loadImage(tex.source);
      const rmTex = createVTKTextureFromGLTFTexture(
        rmImage,
        sampler,
        extensions
      );
      property.setRMTexture(rmTex);
    }

    // Handle ambient occlusion texture (occlusionTexture)
    if (material.occlusionTexture) {
      const extensions = material.occlusionTexture.extensions;
      const tex = material.occlusionTexture.texture;
      const sampler = tex.sampler;
      const aoImage = await loadImage(tex.source);
      const aoTex = createVTKTextureFromGLTFTexture(
        aoImage,
        sampler,
        extensions
      );
      property.setAmbientOcclusionTexture(aoTex);
    }

    // Handle emissive texture (emissiveTexture)
    if (material.emissiveTexture) {
      const extensions = material.emissiveTexture.extensions;
      const tex = material.emissiveTexture.texture;
      const sampler = tex.sampler;
      const emissiveImage = await loadImage(tex.source);
      const emissiveTex = createVTKTextureFromGLTFTexture(
        emissiveImage,
        sampler,
        extensions
      );
      property.setEmissionTexture(emissiveTex);

      // Handle mutiple Uvs
      if (material.emissiveTexture.texCoord != null) {
        const pd = actor.getMapper().getInputData().getPointData();
        pd.setActiveTCoords(`TEXCOORD_${material.emissiveTexture.texCoord}`);
      }
    }

    // Handle normal texture (normalTexture)
    if (material.normalTexture) {
      const extensions = material.normalTexture.extensions;
      const tex = material.normalTexture.texture;
      const sampler = tex.sampler;
      const normalImage = await loadImage(tex.source);
      const normalTex = createVTKTextureFromGLTFTexture(
        normalImage,
        sampler,
        extensions
      );
      property.setNormalTexture(normalTex);

      if (material.normalTexture.scale != null) {
        property.setNormalStrength(material.normalTexture.scale);
      }
    }
  }

  // Material extensions
  if (material.extensions != null) {
    const extensionsNames = Object.keys(material.extensions);
    extensionsNames.forEach((extensionName) => {
      const extension = material.extensions[extensionName];
      switch (extensionName) {
        case 'KHR_materials_unlit':
          handleKHRMaterialsUnlit(extension, property);
          break;
        case 'KHR_materials_ior':
          handleKHRMaterialsIor(extension, property);
          break;
        case 'KHR_materials_specular':
          handleKHRMaterialsSpecular(extension, property);
          break;
        default:
          vtkWarningMacro(`Unhandled extension: ${extensionName}`);
      }
    });
  }

  if (material.alphaMode !== ALPHA_MODE.OPAQUE) {
    actor.setForceTranslucent(true);
  }

  property.setBackfaceCulling(!material.doubleSided);
}

/**
 * Handles primitive extensions
 * @param {string} nodeId The GLTF node id
 * @param {*} extensions The extensions object
 * @param {*} model The vtk model object
 */
function handlePrimitiveExtensions(nodeId, extensions, model) {
  const extensionsNames = Object.keys(extensions);
  extensionsNames.forEach((extensionName) => {
    const extension = extensions[extensionName];
    switch (extensionName) {
      case 'KHR_materials_variants':
        model.variantMappings.set(nodeId, extension.mappings);
        break;
      case 'KHR_draco_mesh_compression':
        break;
      default:
        vtkWarningMacro(`Unhandled extension: ${extensionName}`);
    }
  });
}

/**
 * Creates a VTK actor from a GLTF mesh
 * @param {GLTFMesh} mesh - The GLTF mesh
 * @returns {vtkActor} The created VTK actor
 */
async function createActorFromGTLFNode(worldMatrix) {
  const actor = vtkActor.newInstance();
  const mapper = vtkMapper.newInstance();
  mapper.setColorModeToDirectScalars();
  mapper.setInterpolateScalarsBeforeMapping(true);
  actor.setMapper(mapper);
  actor.setUserMatrix(worldMatrix);

  const polydata = vtkPolyData.newInstance();
  mapper.setInputData(polydata);
  return actor;
}

/**
 * Creates a VTK actor from a GLTF mesh
 * @param {GLTFMesh} mesh - The GLTF mesh
 * @returns {vtkActor} The created VTK actor
 */
async function createActorFromGTLFPrimitive(model, primitive, worldMatrix) {
  const actor = vtkActor.newInstance();
  const mapper = vtkMapper.newInstance();
  mapper.setColorModeToDirectScalars();
  mapper.setInterpolateScalarsBeforeMapping(true);

  actor.setMapper(mapper);
  actor.setUserMatrix(worldMatrix);

  const polydata = await createPolyDataFromGLTFMesh(primitive);
  mapper.setInputData(polydata);

  // Support for materials
  if (primitive.material != null) {
    await createPropertyFromGLTFMaterial(model, primitive.material, actor);
  }

  if (primitive.extensions != null) {
    handlePrimitiveExtensions(`${primitive.name}`, primitive.extensions, model);
  }

  return actor;
}

/**
 * Creates a GLTF animation object
 * @param {GLTFAnimation} animation
 * @returns
 */
function createGLTFAnimation(animation) {
  vtkDebugMacro('Creating animation:', animation);
  return {
    name: animation.name,
    channels: animation.channels,
    samplers: animation.samplers,
    getChannelByTargetNode(nodeIndex) {
      return this.channels.filter(
        (channel) => channel.target.node === nodeIndex
      );
    },
  };
}

/**
 * Gets the transformation matrix for a GLTF node
 * @param {GLTFNode} node - The GLTF node
 * @returns {mat4} The transformation matrix
 */
function getTransformationMatrix(node) {
  // TRS
  const translation = node.translation ?? vec3.create();
  const rotation = node.rotation ?? quat.create();
  const scale = node.scale ?? vec3.fromValues(1.0, 1.0, 1.0);

  const matrix =
    node.matrix != null
      ? mat4.clone(node.matrix)
      : mat4.fromRotationTranslationScale(
          mat4.create(),
          rotation,
          translation,
          scale
        );
  return matrix;
}

/**
 * Processes a GLTF node
 * @param {GLTFnode} node - The GLTF node
 * @param {object} model The model object
 * @param {vtkActor} parentActor The parent actor
 * @param {mat4} parentMatrix The parent matrix
 */
async function processNode(
  node,
  model,
  parentActor = null,
  parentMatrix = mat4.create()
) {
  node.transform = getTransformationMatrix(node);
  const worldMatrix = mat4.multiply(
    mat4.create(),
    parentMatrix,
    node.transform
  );

  // Create actor for the current node
  if (node.mesh != null) {
    const nodeActor = await createActorFromGTLFNode(worldMatrix);
    if (parentActor) {
      nodeActor.setParentProp(parentActor);
    }
    model.actors.set(`${node.id}`, nodeActor);

    await Promise.all(
      node.mesh.primitives.map(async (primitive, i) => {
        const actor = await createActorFromGTLFPrimitive(
          model,
          primitive,
          worldMatrix
        );
        actor.setParentProp(nodeActor);
        model.actors.set(`${node.id}_${primitive.name}`, actor);
      })
    );
  }

  // Handle KHRLightsPunctual extension
  if (node.extensions?.KHR_lights_punctual) {
    handleKHRLightsPunctual(
      node.extensions.KHR_lights_punctual,
      node.transform,
      model
    );
  }

  if (
    node.children &&
    Array.isArray(node.children) &&
    node.children.length > 0
  ) {
    await Promise.all(
      node.children.map(async (child) => {
        const parent = model.actors.get(node.id);
        await processNode(child, model, parent, worldMatrix);
      })
    );
  }
}

/**
 * Creates VTK actors from a GLTF object
 * @param {glTF} glTF - The GLTF object
 * @param {number} sceneId - The scene index to create actors for
 * @returns {vtkActor[]} The created VTK actors
 */
async function createVTKObjects(model) {
  model.animations = model.glTFTree.animations?.map(createGLTFAnimation);

  const extensionsNames = Object.keys(model.glTFTree?.extensions || []);
  extensionsNames.forEach((extensionName) => {
    const extension = model.glTFTree.extensions[extensionName];
    switch (extensionName) {
      case 'KHR_materials_variants':
        handleKHRMaterialsVariants(extension, model);
        break;
      case 'KHR_draco_mesh_compression':
        break;
      default:
        vtkWarningMacro(`Unhandled extension: ${extensionName}`);
    }
  });

  // Get the sceneId to process
  const sceneId = model.sceneId ?? model.glTFTree.scene;
  if (model.glTFTree.scenes?.length && model.glTFTree.scenes[sceneId]?.nodes) {
    await Promise.all(
      model.glTFTree.scenes[sceneId].nodes.map(async (node) => {
        if (node) {
          await processNode(node, model);
        } else {
          vtkWarningMacro(`Node not found in glTF.nodes`);
        }
      })
    );
  } else {
    vtkWarningMacro('No valid scenes found in the glTF data');
  }
}

/**
 * Sets up the camera for a vtk renderer based on the bounds of the given actors.
 *
 * @param {GLTCamera} camera - The GLTF camera object
 */
function GLTFCameraToVTKCamera(glTFCamera) {
  const camera = vtkCamera.newInstance();
  if (glTFCamera.type === 'perspective') {
    const { yfov, znear, zfar } = glTFCamera.perspective;
    camera.setClippingRange(znear, zfar);
    camera.setParallelProjection(false);
    camera.setViewAngle(vtkMath.degreesFromRadians(yfov));
  } else if (glTFCamera.type === 'orthographic') {
    const { ymag, znear, zfar } = glTFCamera.orthographic;
    camera.setClippingRange(znear, zfar);
    camera.setParallelProjection(true);
    camera.setParallelScale(ymag);
  } else {
    throw new Error('Unsupported camera type');
  }

  return camera;
}

/**
 *
 * @param {vtkCamera} camera
 * @param {*} transformMatrix
 */
function applyTransformToCamera(camera, transformMatrix) {
  if (!camera || !transformMatrix) {
    return;
  }

  // At identity, camera position is origin, +y up, -z view direction
  const position = [0, 0, 0];
  const viewUp = [0, 1, 0];
  const focus = [0, 0, -1];

  const t = vtkTransform.newInstance();
  t.setMatrix(transformMatrix);

  // Transform position
  t.transformPoint(position, position);
  t.transformPoints(viewUp, viewUp);
  t.transformPoints(focus, focus);

  focus[0] += position[0];
  focus[1] += position[1];
  focus[2] += position[2];

  // Apply the transformed values to the camera
  camera.setPosition(position);
  camera.setFocalPoint(focus);
  camera.setViewUp(viewUp);
}

export {
  applyTransformToCamera,
  createPropertyFromGLTFMaterial,
  parseGLTF,
  createVTKObjects,
  GLTFCameraToVTKCamera,
};
