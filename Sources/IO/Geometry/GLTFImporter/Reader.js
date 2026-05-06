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
  handleKHRMaterialsAnisotropy,
  handleKHRMaterialsClearcoat,
  handleKHRMaterialsEmissiveStrength,
  handleKHRMaterialsIor,
  handleKHRMaterialsIridescence,
  handleKHRMaterialsPbrSpecularGlossiness,
  handleKHRMaterialsSheen,
  handleKHRMaterialsDiffuseTransmission,
  handleKHRMaterialsDispersion,
  handleKHRMaterialsSpecular,
  handleKHRMaterialsTransmission,
  handleKHRMaterialsUnlit,
  handleKHRMaterialsVariants,
  handleKHRMaterialsVolume,
  handleKHRTextureTransform,
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
  for (const [attributeName] of attrs) {
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
      case SEMANTIC_ATTRIBUTE_MAP.JOINTS_0: {
        const joints = primitive.attributes.joint.value;
        pointData.addArray(
          vtkDataArray.newInstance({
            name: 'JOINTS_0',
            values: joints,
            numberOfComponents: primitive.attributes.joint.components,
          })
        );
        break;
      }
      case SEMANTIC_ATTRIBUTE_MAP.WEIGHTS_0: {
        const weights = primitive.attributes.weight.value;
        pointData.addArray(
          vtkDataArray.newInstance({
            name: 'WEIGHTS_0',
            values: weights,
            numberOfComponents: primitive.attributes.weight.components,
          })
        );
        break;
      }
      default:
        vtkWarningMacro(`Unhandled attribute: ${attributeName}`);
    }
  }

  const buildConnectivityFromIndices = (indices, mode) => {
    switch (mode) {
      case MODES.GL_POINTS: {
        const out = new Uint32Array(indices.length * 2);
        for (let i = 0, j = 0; i < indices.length; i++, j += 2) {
          out[j] = 1;
          out[j + 1] = indices[i];
        }
        return out;
      }
      case MODES.GL_LINES: {
        const pairCount = Math.floor(indices.length / 2);
        const out = new Uint32Array(pairCount * 3);
        for (let i = 0, j = 0; i + 1 < indices.length; i += 2, j += 3) {
          out[j] = 2;
          out[j + 1] = indices[i];
          out[j + 2] = indices[i + 1];
        }
        return out;
      }
      case MODES.GL_LINE_STRIP: {
        const segCount = Math.max(0, indices.length - 1);
        const out = new Uint32Array(segCount * 3);
        for (let i = 0, j = 0; i + 1 < indices.length; i++, j += 3) {
          out[j] = 2;
          out[j + 1] = indices[i];
          out[j + 2] = indices[i + 1];
        }
        return out;
      }
      case MODES.GL_LINE_LOOP: {
        const segCount = indices.length;
        const out = new Uint32Array(segCount * 3);
        for (let i = 0, j = 0; i < indices.length; i++, j += 3) {
          out[j] = 2;
          out[j + 1] = indices[i];
          out[j + 2] = indices[(i + 1) % indices.length];
        }
        return out;
      }
      case MODES.GL_TRIANGLE_STRIP: {
        const triCount = Math.max(0, indices.length - 2);
        const out = new Uint32Array(triCount * 4);
        for (let i = 0, j = 0; i + 2 < indices.length; i++, j += 4) {
          out[j] = 3;
          if (i % 2 === 0) {
            out[j + 1] = indices[i];
            out[j + 2] = indices[i + 1];
          } else {
            out[j + 1] = indices[i + 1];
            out[j + 2] = indices[i];
          }
          out[j + 3] = indices[i + 2];
        }
        return out;
      }
      case MODES.GL_TRIANGLE_FAN: {
        const triCount = Math.max(0, indices.length - 2);
        const out = new Uint32Array(triCount * 4);
        for (let i = 1, j = 0; i + 1 < indices.length; i++, j += 4) {
          out[j] = 3;
          out[j + 1] = indices[0];
          out[j + 2] = indices[i];
          out[j + 3] = indices[i + 1];
        }
        return out;
      }
      case MODES.GL_TRIANGLES:
      default: {
        const triCount = Math.floor(indices.length / 3);
        const out = new Uint32Array(triCount * 4);
        for (let i = 0, j = 0; i + 2 < indices.length; i += 3, j += 4) {
          out[j] = 3;
          out[j + 1] = indices[i];
          out[j + 2] = indices[i + 1];
          out[j + 3] = indices[i + 2];
        }
        return out;
      }
    }
  };

  const buildConnectivityFromPointCount = (numPoints, mode) => {
    switch (mode) {
      case MODES.GL_POINTS: {
        const out = new Uint32Array(numPoints * 2);
        for (let i = 0, j = 0; i < numPoints; i++, j += 2) {
          out[j] = 1;
          out[j + 1] = i;
        }
        return out;
      }
      case MODES.GL_LINES: {
        const pairCount = Math.floor(numPoints / 2);
        const out = new Uint32Array(pairCount * 3);
        for (let i = 0, j = 0; i + 1 < numPoints; i += 2, j += 3) {
          out[j] = 2;
          out[j + 1] = i;
          out[j + 2] = i + 1;
        }
        return out;
      }
      case MODES.GL_LINE_STRIP: {
        const segCount = Math.max(0, numPoints - 1);
        const out = new Uint32Array(segCount * 3);
        for (let i = 0, j = 0; i + 1 < numPoints; i++, j += 3) {
          out[j] = 2;
          out[j + 1] = i;
          out[j + 2] = i + 1;
        }
        return out;
      }
      case MODES.GL_LINE_LOOP: {
        const out = new Uint32Array(numPoints * 3);
        for (let i = 0, j = 0; i < numPoints; i++, j += 3) {
          out[j] = 2;
          out[j + 1] = i;
          out[j + 2] = (i + 1) % numPoints;
        }
        return out;
      }
      case MODES.GL_TRIANGLE_STRIP: {
        const triCount = Math.max(0, numPoints - 2);
        const out = new Uint32Array(triCount * 4);
        for (let i = 0, j = 0; i + 2 < numPoints; i++, j += 4) {
          out[j] = 3;
          if (i % 2 === 0) {
            out[j + 1] = i;
            out[j + 2] = i + 1;
          } else {
            out[j + 1] = i + 1;
            out[j + 2] = i;
          }
          out[j + 3] = i + 2;
        }
        return out;
      }
      case MODES.GL_TRIANGLE_FAN: {
        const triCount = Math.max(0, numPoints - 2);
        const out = new Uint32Array(triCount * 4);
        for (let i = 1, j = 0; i + 1 < numPoints; i++, j += 4) {
          out[j] = 3;
          out[j + 1] = 0;
          out[j + 2] = i;
          out[j + 3] = i + 1;
        }
        return out;
      }
      case MODES.GL_TRIANGLES:
      default: {
        const triCount = Math.floor(numPoints / 3);
        const out = new Uint32Array(triCount * 4);
        for (let i = 0, j = 0; i + 2 < numPoints; i += 3, j += 4) {
          out[j] = 3;
          out[j + 1] = i;
          out[j + 2] = i + 1;
          out[j + 3] = i + 2;
        }
        return out;
      }
    }
  };

  // Handle indices if available
  const mode = primitive.mode ?? MODES.GL_TRIANGLES;
  const connectivity =
    primitive.indices != null
      ? buildConnectivityFromIndices(primitive.indices.value, mode)
      : buildConnectivityFromPointCount(
          polyData.getPoints().getNumberOfPoints(),
          mode
        );
  cells.setData(connectivity);

  const effectiveMode = primitive.mode ?? MODES.GL_TRIANGLES;
  switch (effectiveMode) {
    case MODES.GL_TRIANGLES:
    case MODES.GL_TRIANGLE_FAN:
    case MODES.GL_TRIANGLE_STRIP:
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
async function createPropertyFromGLTFMaterial(
  model,
  material,
  actor,
  options = {}
) {
  const { resetToDefaults = true } = options;
  let metallicFactor = 1.0;
  let roughnessFactor = 1.0;
  const emissiveFactor = material.emissiveFactor;

  const property = actor.getProperty();
  const texturePromises = {
    diffuse: null,
    rm: null,
    ao: null,
    emissive: null,
    normal: null,
  };

  const loadTextureRef = async (texRef) => {
    if (!texRef?.texture) return null;
    const tex = texRef.texture;
    const sampler = tex.sampler;
    const img = await loadImage(tex.source);
    return createVTKTextureFromGLTFTexture(img, sampler, texRef.extensions);
  };

  if (resetToDefaults) {
    // Reset PBR properties to defaults (critical for variant switching)
    property.setMetallic(0);
    property.setRoughness(0.6);
    property.setEmission(1);
    property.setBaseIOR(1.45);
    property.setNormalStrength(1);
    property.setDiffuseColor(1, 1, 1);
    property.setOpacity(1);
    property.setAnisotropy(0);
    property.setAnisotropyRotation(0);
    property.setCoatStrength(0);
    property.setCoatRoughness(0);
    property.setCoatColor(1, 1, 1);
    property.setCoatF0(0.04);
    property.setCoatNormalStrength(1);
    property.setEmissiveStrength(1);
    property.setTransmissionFactor(0);
    property.setAlphaCutoff(0);
    property.setThicknessFactor(0);
    property.setAttenuationDistance(Infinity);
    property.setAttenuationColor(1, 1, 1);
    property.setIridescenceFactor(0);
    property.setIridescenceIOR(1.3);
    property.setIridescenceThicknessMinimum(100);
    property.setIridescenceThicknessMaximum(400);
    property.setSheenColorFactor(0, 0, 0);
    property.setSheenRoughnessFactor(0);
    property.setDiffuseTransmissionFactor(0);
    property.setDiffuseTransmissionColorFactor(1, 1, 1);
    property.setDispersion(0);
    property.setSpecularFactor(1.0);
    property.setSpecularColorFactor(1, 1, 1);
    property.setTextureTransforms({});
    // Clear textures
    property.setDiffuseTexture(null);
    property.setORMTexture(null);
    property.setRMTexture(null);
    property.setAmbientOcclusionTexture(null);
    property.setEmissionTexture(null);
    property.setNormalTexture(null);
    property.setAnisotropyTexture(null);
    property.setCoatTexture(null);
    property.setCoatRoughnessTexture(null);
    property.setCoatNormalTexture(null);
    property.setTransmissionTexture(null);
    property.setThicknessTexture(null);
    property.setIridescenceTexture(null);
    property.setIridescenceThicknessTexture(null);
    property.setSheenColorTexture(null);
    property.setSheenRoughnessTexture(null);
    property.setDiffuseTransmissionTexture(null);
    property.setDiffuseTransmissionColorTexture(null);
    property.setSpecularTexture(null);
    property.setSpecularColorTexture(null);
    property.setBackfaceCulling(false);
  }

  const pbr = material.pbrMetallicRoughness;

  if (pbr != null) {
    if (pbr.metallicFactor != null) {
      metallicFactor = pbr.metallicFactor;
    }
    if (pbr.roughnessFactor != null) {
      roughnessFactor = pbr.roughnessFactor;
    }

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

      // Apply texture transform from KHR_texture_transform
      if (extensions?.KHR_texture_transform) {
        handleKHRTextureTransform(
          extensions.KHR_texture_transform,
          property,
          'diffuse'
        );
      } else if (pbr.baseColorTexture.texCoord != null) {
        property.setTextureTransform('diffuse', {
          texCoord: pbr.baseColorTexture.texCoord,
        });
      }

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

      texturePromises.diffuse = loadTextureRef(pbr.baseColorTexture);
    }

    // Handle metallic-roughness texture (metallicRoughnessTexture)
    if (pbr.metallicRoughnessTexture) {
      const extensions = pbr.metallicRoughnessTexture.extensions;
      const tex = pbr.metallicRoughnessTexture.texture;
      if (extensions?.KHR_texture_transform) {
        handleKHRTextureTransform(
          extensions.KHR_texture_transform,
          property,
          'rm'
        );
      } else if (pbr.metallicRoughnessTexture.texCoord != null) {
        property.setTextureTransform('rm', {
          texCoord: pbr.metallicRoughnessTexture.texCoord,
        });
      }
      texturePromises.rm = loadTextureRef(pbr.metallicRoughnessTexture);
    }

    // Handle ambient occlusion texture (occlusionTexture)
    if (material.occlusionTexture) {
      const extensions = material.occlusionTexture.extensions;
      const tex = material.occlusionTexture.texture;
      if (extensions?.KHR_texture_transform) {
        handleKHRTextureTransform(
          extensions.KHR_texture_transform,
          property,
          'ao'
        );
      } else if (material.occlusionTexture.texCoord != null) {
        property.setTextureTransform('ao', {
          texCoord: material.occlusionTexture.texCoord,
        });
      }
      texturePromises.ao = loadTextureRef(material.occlusionTexture);
      property.setOcclusionStrength(material.occlusionTexture.strength ?? 1.0);
    }

    // Handle emissive texture (emissiveTexture)
    if (material.emissiveTexture) {
      const extensions = material.emissiveTexture.extensions;
      const tex = material.emissiveTexture.texture;
      if (extensions?.KHR_texture_transform) {
        handleKHRTextureTransform(
          extensions.KHR_texture_transform,
          property,
          'emission'
        );
      } else if (material.emissiveTexture.texCoord != null) {
        property.setTextureTransform('emission', {
          texCoord: material.emissiveTexture.texCoord,
        });
      }
      texturePromises.emissive = loadTextureRef(material.emissiveTexture);

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
      if (extensions?.KHR_texture_transform) {
        handleKHRTextureTransform(
          extensions.KHR_texture_transform,
          property,
          'normal'
        );
      } else if (material.normalTexture.texCoord != null) {
        property.setTextureTransform('normal', {
          texCoord: material.normalTexture.texCoord,
        });
      }
      texturePromises.normal = loadTextureRef(material.normalTexture);

      if (material.normalTexture.scale != null) {
        property.setNormalStrength(material.normalTexture.scale);
      }
    }

    const [diffuseTex, rmTex, aoTex, emissiveTex, normalTex] =
      await Promise.all([
        texturePromises.diffuse,
        texturePromises.rm,
        texturePromises.ao,
        texturePromises.emissive,
        texturePromises.normal,
      ]);

    if (diffuseTex) {
      property.setDiffuseTexture(diffuseTex);
    }
    if (rmTex) {
      property.setRMTexture(rmTex);
    }
    if (aoTex) {
      property.setAmbientOcclusionTexture(aoTex);
    }
    if (emissiveTex) {
      property.setEmissionTexture(emissiveTex);
    }
    if (normalTex) {
      property.setNormalTexture(normalTex);
    }
  }

  // Alpha mode
  if (material.alphaMode === ALPHA_MODE.MASK) {
    property.setAlphaCutoff(material.alphaCutoff ?? 0.5);
    property.setAlphaMode(1); // MASK
  } else if (material.alphaMode === ALPHA_MODE.BLEND) {
    property.setAlphaMode(2); // BLEND
  } else {
    property.setAlphaMode(0); // OPAQUE (default)
  }

  // Material extensions
  if (material.extensions != null) {
    const extensionsNames = Object.keys(material.extensions);
    const extensionPromises = [];
    for (const extensionName of extensionsNames) {
      const extension = material.extensions[extensionName];
      switch (extensionName) {
        case 'KHR_materials_unlit':
          handleKHRMaterialsUnlit(extension, property);
          break;
        case 'KHR_materials_ior':
          handleKHRMaterialsIor(extension, property);
          break;
        case 'KHR_materials_specular':
          extensionPromises.push(
            handleKHRMaterialsSpecular(extension, property, loadTextureRef)
          );
          break;
        case 'KHR_materials_pbrSpecularGlossiness':
          extensionPromises.push(
            handleKHRMaterialsPbrSpecularGlossiness(
              extension,
              property,
              loadTextureRef
            )
          );
          break;
        case 'KHR_materials_clearcoat':
          extensionPromises.push(
            handleKHRMaterialsClearcoat(extension, property, loadTextureRef)
          );
          break;
        case 'KHR_materials_anisotropy':
          extensionPromises.push(
            handleKHRMaterialsAnisotropy(extension, property, loadTextureRef)
          );
          break;
        case 'KHR_materials_emissive_strength':
          handleKHRMaterialsEmissiveStrength(extension, property);
          break;
        case 'KHR_materials_transmission':
          extensionPromises.push(
            handleKHRMaterialsTransmission(extension, property, loadTextureRef)
          );
          break;
        case 'KHR_materials_volume':
          extensionPromises.push(
            handleKHRMaterialsVolume(extension, property, loadTextureRef)
          );
          break;
        case 'KHR_materials_iridescence':
          extensionPromises.push(
            handleKHRMaterialsIridescence(extension, property, loadTextureRef)
          );
          break;
        case 'KHR_materials_sheen':
          extensionPromises.push(
            handleKHRMaterialsSheen(extension, property, loadTextureRef)
          );
          break;
        case 'KHR_materials_diffuse_transmission':
          extensionPromises.push(
            handleKHRMaterialsDiffuseTransmission(
              extension,
              property,
              loadTextureRef
            )
          );
          break;
        case 'KHR_materials_dispersion':
          handleKHRMaterialsDispersion(extension, property);
          break;
        default:
          vtkWarningMacro(`Unhandled extension: ${extensionName}`);
      }
    }
    await Promise.all(extensionPromises);
  }

  // Reset translucency (may be re-enabled below for BLEND/transmission)
  actor.setForceTranslucent(false);

  // BLEND mode uses translucent pass; MASK stays opaque with alpha cutoff
  if (material.alphaMode === ALPHA_MODE.BLEND) {
    actor.setForceTranslucent(true);
  }

  // Transmission requires translucent rendering
  if (material.extensions?.KHR_materials_transmission?.transmissionFactor > 0) {
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
async function createActorFromGTLFPrimitive(
  model,
  primitive,
  worldMatrix,
  nodeId
) {
  const actor = vtkActor.newInstance();
  const mapper = vtkMapper.newInstance();
  mapper.setColorModeToDirectScalars();
  mapper.setInterpolateScalarsBeforeMapping(true);

  actor.setMapper(mapper);
  actor.setUserMatrix(worldMatrix);

  const polydata = await createPolyDataFromGLTFMesh(primitive);
  mapper.setInputData(polydata);

  // Store morph target data for animation
  if (primitive.targets && primitive.targets.length > 0 && model.morphTargets) {
    const basePositions = polydata.getPoints().getData().slice();
    const targets = primitive.targets.map((target) => ({
      position: target.POSITION ? target.POSITION.value : null,
      normal: target.NORMAL ? target.NORMAL.value : null,
    }));
    model.morphTargets.set(`${nodeId}_${primitive.name}`, {
      basePositions,
      targets,
      polydata,
      numVertices: basePositions.length / 3,
    });
  }

  // Support for materials
  if (primitive.material != null) {
    await createPropertyFromGLTFMaterial(model, primitive.material, actor);

    // Track material index → property for animation pointer support
    if (model.materialProperties) {
      const matId = primitive.material.id || '';
      const match = matId.match(/material-(\d+)/);
      if (match) {
        const matIdx = parseInt(match[1], 10);
        const key = `mat_${matIdx}`;
        if (!model.materialProperties.has(key)) {
          model.materialProperties.set(key, []);
        }
        model.materialProperties.get(key).push(actor.getProperty());
      }
    }
  }

  if (primitive.extensions != null) {
    handlePrimitiveExtensions(
      `${nodeId}_${primitive.name}`,
      primitive.extensions,
      model
    );
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

  // Store per-node transform metadata for animation & hierarchy propagation
  if (model.nodeTransforms) {
    model.nodeTransforms.set(node.id, {
      localMatrix: mat4.clone(node.transform),
      worldMatrix: mat4.clone(worldMatrix),
      parentMatrix: mat4.clone(parentMatrix),
      translation: node.translation ? [...node.translation] : [0, 0, 0],
      rotation: node.rotation ? [...node.rotation] : [0, 0, 0, 1],
      scale: node.scale ? [...node.scale] : [1, 1, 1],
    });
  }

  // Store node hierarchy (parent → children) for animation propagation
  if (model.nodeChildren) {
    const childIds = (node.children || []).map((c) => c.id);
    model.nodeChildren.set(node.id, childIds);
  }

  // Create actor for the current node
  if (node.mesh != null) {
    const nodeActor = await createActorFromGTLFNode(worldMatrix);
    if (node.skin) {
      nodeActor.setUserMatrix(mat4.create());
    }
    if (parentActor) {
      nodeActor.setParentProp(parentActor);
    }
    model.actors.set(`${node.id}`, nodeActor);

    await Promise.all(
      node.mesh.primitives.map(async (primitive, i) => {
        const actor = await createActorFromGTLFPrimitive(
          model,
          primitive,
          worldMatrix,
          node.id
        );
        if (node.skin) {
          actor.setUserMatrix(mat4.create());
        }
        actor.setParentProp(nodeActor);
        model.actors.set(`${node.id}_${primitive.name}`, actor);
      })
    );

    // Store skin data for skinned meshes
    if (node.skin && model.skins) {
      const skin = node.skin;
      const jointNodeIds = (skin.joints || []).map((j) => j.id);
      // Parse inverseBindMatrices into array of mat4
      const ibmData = skin.inverseBindMatrices?.value;
      const inverseBindMatrices = [];
      if (ibmData) {
        for (let j = 0; j < jointNodeIds.length; j++) {
          const m = new Float32Array(16);
          for (let k = 0; k < 16; k++) {
            m[k] = ibmData[j * 16 + k];
          }
          inverseBindMatrices.push(m);
        }
      } else {
        // Default to identity if no inverseBindMatrices
        for (let j = 0; j < jointNodeIds.length; j++) {
          inverseBindMatrices.push(mat4.create());
        }
      }
      model.skins.set(node.id, {
        skinId: skin.id,
        jointNodeIds,
        inverseBindMatrices,
        skeletonRoot: skin.skeleton?.id || null,
      });
    }
  }

  // Handle KHRLightsPunctual extension
  if (node.extensions?.KHR_lights_punctual) {
    const light = handleKHRLightsPunctual(
      node.extensions.KHR_lights_punctual,
      node.transform,
      model
    );
    if (light && node.id) {
      if (!model.nodeLights) model.nodeLights = new Map();
      model.nodeLights.set(node.id, light);
    }
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
      case 'KHR_lights_punctual':
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
