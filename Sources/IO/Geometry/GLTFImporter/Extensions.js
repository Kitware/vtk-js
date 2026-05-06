import macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkDracoReader from 'vtk.js/Sources/IO/Geometry/DracoReader';
import vtkLight from 'vtk.js/Sources/Rendering/Core/Light';

import { MIN_LIGHT_ATTENUATION } from 'vtk.js/Sources/IO/Geometry/GLTFImporter/Constants';

const { vtkWarningMacro } = macro;

/**
 * Parses KHR_texture_transform from a glTF textureInfo and stores it on the property.
 */
function parseTexTransform(texInfo, property, key) {
  if (texInfo?.extensions?.KHR_texture_transform) {
    // eslint-disable-next-line no-use-before-define
    handleKHRTextureTransform(
      texInfo.extensions.KHR_texture_transform,
      property,
      key
    );
  }
}

/**
 * Handles the KHR_materials_unlit extension.
 *
 * @param {object} extension - The KHR_materials_unlit extension object.
 * @param {vtkProperty} property - The vtkProperty instance to update.
 */
export function handleKHRMaterialsUnlit(extension, property) {
  property.setLighting(true);
}

/**
 * Handles the KHR_materials_ior extension.
 *
 * @param {object} extension - The KHR_materials_unlit extension object.
 * @param {vtkProperty} property - The vtkProperty instance to update.
 */
export function handleKHRMaterialsIor(extension, property) {
  property.setBaseIOR(extension.ior);
}

/**
 * Handles the KHR_materials_specular extension.
 * Modifies dielectric F0 reflectance and specular weight.
 *
 * @param {object} extension - The KHR_materials_specular extension object.
 * @param {vtkProperty} property - The vtkProperty instance to update.
 * @param {Function} loadTexture - Async function to load a texture.
 */
export async function handleKHRMaterialsSpecular(
  extension,
  property,
  loadTexture
) {
  if (extension.specularFactor != null) {
    property.setSpecularFactor(extension.specularFactor);
  }
  if (extension.specularColorFactor != null) {
    property.setSpecularColorFactor(
      extension.specularColorFactor[0],
      extension.specularColorFactor[1],
      extension.specularColorFactor[2]
    );
  }
  if (extension.specularTexture) {
    const tex = await loadTexture(extension.specularTexture);
    if (tex) property.setSpecularTexture(tex);
    parseTexTransform(extension.specularTexture, property, 'specular');
  }
  if (extension.specularColorTexture) {
    const tex = await loadTexture(extension.specularColorTexture);
    if (tex) property.setSpecularColorTexture(tex);
    parseTexTransform(
      extension.specularColorTexture,
      property,
      'specularColor'
    );
  }
}

/**
 * Handles the KHR_materials_pbrSpecularGlossiness extension.
 * Maps the legacy specular-glossiness workflow onto VTK's PBR material model.
 *
 * @param {object} extension - The KHR_materials_pbrSpecularGlossiness extension object.
 * @param {vtkProperty} property - The vtkProperty instance to update.
 * @param {Function} loadTexture - Async function to load a texture.
 */
export async function handleKHRMaterialsPbrSpecularGlossiness(
  extension,
  property,
  loadTexture
) {
  const diffuseFactor = extension.diffuseFactor || [1, 1, 1, 1];
  const specularFactor = extension.specularFactor || [1, 1, 1];
  const glossinessFactor =
    extension.glossinessFactor != null ? extension.glossinessFactor : 1;

  property.setMetallic(0);
  property.setRoughness(1 - glossinessFactor);
  property.setDiffuseColor(
    diffuseFactor[0],
    diffuseFactor[1],
    diffuseFactor[2]
  );
  property.setOpacity(diffuseFactor[3]);

  // KHR_materials_specular multiplies dielectric F0 by specularColorFactor.
  // Convert the specular-glossiness F0 color into that factor space.
  const dielectricF0 = 0.04;
  property.setSpecularColorFactor(
    specularFactor[0] / dielectricF0,
    specularFactor[1] / dielectricF0,
    specularFactor[2] / dielectricF0
  );

  if (extension.diffuseTexture && loadTexture) {
    parseTexTransform(extension.diffuseTexture, property, 'diffuse');
    const tex = await loadTexture(extension.diffuseTexture);
    if (tex) {
      property.setDiffuseTexture(tex);
    }
  }

  if (extension.specularGlossinessTexture && loadTexture) {
    parseTexTransform(
      extension.specularGlossinessTexture,
      property,
      'specularColor'
    );
    const tex = await loadTexture(extension.specularGlossinessTexture);
    if (tex) {
      property.setSpecularColorTexture(tex);
    }
  }
}

/**
 * Handles the KHR_lights_punctual extension.
 *
 * @param {object} extension - The KHR_lights_punctual extension object.
 * @param {vtkRenderer} renderer - The vtkRenderer instance to add the light to.
 */
export function handleKHRLightsPunctual(extension, transformMatrix, model) {
  const { light } = extension;

  const { color, intensity, range, spot, type } = light;

  // glTF uses physically-based light units. The WebGPU renderer multiplies intensity by PI
  // for energy conservation. To pass through the raw glTF value to the PBR shader correctly,
  // we divide by PI here (renderer will multiply it back).
  const rawIntensity = intensity || 1.0;
  const normIntensity = rawIntensity / Math.PI;

  const l = vtkLight.newInstance({
    color: color || [1, 1, 1],
    intensity: normIntensity,
  });

  // Extract position from the transform matrix (column 3)
  if (transformMatrix) {
    const pos = [transformMatrix[12], transformMatrix[13], transformMatrix[14]];
    l.setPosition(...pos);

    // glTF lights point along -Z in local space.
    // Extract the -Z direction from the rotation part of the transform matrix.
    const dir = [
      -transformMatrix[8],
      -transformMatrix[9],
      -transformMatrix[10],
    ];
    vtkMath.normalize(dir);
    // Set focal point = position + direction so getDirection() returns correct vector
    l.setFocalPoint(pos[0] + dir[0], pos[1] + dir[1], pos[2] + dir[2]);
  }

  // Handle range
  if (range > 0) {
    // Set quadratic values to get attenuation(range) ~= MIN_LIGHT_ATTENUATION
    l.setAttenuationValues(1, 0, 1.0 / (range * range * MIN_LIGHT_ATTENUATION));
  }

  switch (type) {
    case 'directional':
      l.setPositional(false);
      break;
    case 'point':
      l.setPositional(true);
      l.setConeAngle(90);
      break;
    case 'spot':
      l.setPositional(true);
      l.setConeAngle(vtkMath.radiansFromDegrees(spot.outerConeAngle));
      break;
    default:
      vtkWarningMacro(`Unsupported light type: ${type}`);
  }

  model.lights.set(light.name, l);
  return l;
}

/**
 * Handles the KHR_draco_mesh_compression extension.
 *
 * @param {object} extension - The KHR_draco_mesh_compression extension object.
 */
export function handleKHRDracoMeshCompression(extension) {
  const reader = vtkDracoReader.newInstance();
  reader.parse(extension.bufferView);
  return reader.getOutputData();
}

/**
 * Handles the KHR_materials_variants extension.
 *
 * @param {object} extension - The KHR_materials_variants extension object.
 * @param {object} model - The model object to update with variant information.
 */
export function handleKHRMaterialsVariants(extension, model) {
  model.variants = extension.variants.map((v) => v.name);
}

/**
 * Handles the KHR_materials_clearcoat extension.
 * Sets clearcoat strength, roughness, and optionally loads textures.
 *
 * @param {object} extension - The KHR_materials_clearcoat extension object.
 * @param {vtkProperty} property - The vtkProperty instance to update.
 * @param {Function} loadTexture - Async function to load a texture.
 */
export async function handleKHRMaterialsClearcoat(
  extension,
  property,
  loadTexture
) {
  if (extension.clearcoatFactor != null) {
    property.setCoatStrength(extension.clearcoatFactor);
  }
  if (extension.clearcoatTexture && loadTexture) {
    parseTexTransform(extension.clearcoatTexture, property, 'coat');
    const tex = await loadTexture(extension.clearcoatTexture);
    if (tex) {
      property.setCoatTexture(tex);
    }
  }
  if (extension.clearcoatRoughnessFactor != null) {
    property.setCoatRoughness(extension.clearcoatRoughnessFactor);
  }
  if (extension.clearcoatRoughnessTexture && loadTexture) {
    parseTexTransform(
      extension.clearcoatRoughnessTexture,
      property,
      'coatRoughness'
    );
    const tex = await loadTexture(extension.clearcoatRoughnessTexture);
    if (tex) {
      property.setCoatRoughnessTexture(tex);
    }
  }
  if (extension.clearcoatNormalTexture && loadTexture) {
    parseTexTransform(extension.clearcoatNormalTexture, property, 'coatNormal');
    const tex = await loadTexture(extension.clearcoatNormalTexture);
    if (tex) {
      property.setCoatNormalTexture(tex);
      if (extension.clearcoatNormalTexture.scale != null) {
        property.setCoatNormalStrength(extension.clearcoatNormalTexture.scale);
      }
    }
  }
}

/**
 * Handles the KHR_materials_anisotropy extension.
 * Sets anisotropy strength and rotation.
 *
 * @param {object} extension - The KHR_materials_anisotropy extension object.
 * @param {vtkProperty} property - The vtkProperty instance to update.
 * @param {Function} loadTexture - Async function to load a texture.
 */
export async function handleKHRMaterialsAnisotropy(
  extension,
  property,
  loadTexture
) {
  if (extension.anisotropyStrength != null) {
    property.setAnisotropy(extension.anisotropyStrength);
  }
  if (extension.anisotropyRotation != null) {
    // glTF stores rotation in radians, convert to [0..1] factor
    property.setAnisotropyRotation(
      extension.anisotropyRotation / (2.0 * Math.PI)
    );
  }
  if (extension.anisotropyTexture && loadTexture) {
    parseTexTransform(extension.anisotropyTexture, property, 'anisotropy');
    const tex = await loadTexture(extension.anisotropyTexture);
    if (tex) {
      property.setAnisotropyTexture(tex);
    }
  }
}

/**
 * Handles the KHR_materials_emissive_strength extension.
 * Scales emissive output beyond the default [0..1] range.
 *
 * @param {object} extension - The KHR_materials_emissive_strength extension object.
 * @param {vtkProperty} property - The vtkProperty instance to update.
 */
export function handleKHRMaterialsEmissiveStrength(extension, property) {
  if (extension.emissiveStrength != null) {
    property.setEmissiveStrength(extension.emissiveStrength);
  }
}

/**
 * Handles the KHR_materials_transmission extension.
 * Enables thin-surface transmission for translucent materials.
 *
 * @param {object} extension - The KHR_materials_transmission extension object.
 * @param {vtkProperty} property - The vtkProperty instance to update.
 * @param {Function} loadTexture - Async function to load a texture.
 */
export async function handleKHRMaterialsTransmission(
  extension,
  property,
  loadTexture
) {
  if (extension.transmissionFactor != null) {
    property.setTransmissionFactor(extension.transmissionFactor);
  }
  if (extension.transmissionTexture && loadTexture) {
    parseTexTransform(extension.transmissionTexture, property, 'transmission');
    const tex = await loadTexture(extension.transmissionTexture);
    if (tex) {
      property.setTransmissionTexture(tex);
    }
  }
}

/**
 * Handles the KHR_materials_volume extension.
 * Adds volumetric thickness and Beer-Lambert attenuation.
 *
 * @param {object} extension - The KHR_materials_volume extension object.
 * @param {vtkProperty} property - The vtkProperty instance to update.
 * @param {Function} loadTexture - Async function to load a texture.
 */
export async function handleKHRMaterialsVolume(
  extension,
  property,
  loadTexture
) {
  if (extension.thicknessFactor != null) {
    property.setThicknessFactor(extension.thicknessFactor);
  }
  if (extension.attenuationDistance != null) {
    property.setAttenuationDistance(extension.attenuationDistance);
  }
  if (extension.attenuationColor != null) {
    property.setAttenuationColor(
      extension.attenuationColor[0],
      extension.attenuationColor[1],
      extension.attenuationColor[2]
    );
  }
  if (extension.thicknessTexture && loadTexture) {
    parseTexTransform(extension.thicknessTexture, property, 'thickness');
    const tex = await loadTexture(extension.thicknessTexture);
    if (tex) {
      property.setThicknessTexture(tex);
    }
  }
}

/**
 * Handles the KHR_materials_iridescence extension.
 * Adds thin-film interference effect (rainbow sheen).
 *
 * @param {object} extension - The KHR_materials_iridescence extension object.
 * @param {vtkProperty} property - The vtkProperty instance to update.
 * @param {Function} loadTexture - Async function to load a texture.
 */
export async function handleKHRMaterialsIridescence(
  extension,
  property,
  loadTexture
) {
  if (extension.iridescenceFactor != null) {
    property.setIridescenceFactor(extension.iridescenceFactor);
  }
  if (extension.iridescenceIor != null) {
    property.setIridescenceIOR(extension.iridescenceIor);
  }
  if (extension.iridescenceThicknessMinimum != null) {
    property.setIridescenceThicknessMinimum(
      extension.iridescenceThicknessMinimum
    );
  }
  if (extension.iridescenceThicknessMaximum != null) {
    property.setIridescenceThicknessMaximum(
      extension.iridescenceThicknessMaximum
    );
  }
  if (extension.iridescenceTexture && loadTexture) {
    parseTexTransform(extension.iridescenceTexture, property, 'iridescence');
    const tex = await loadTexture(extension.iridescenceTexture);
    if (tex) {
      property.setIridescenceTexture(tex);
    }
  }
  if (extension.iridescenceThicknessTexture && loadTexture) {
    parseTexTransform(
      extension.iridescenceThicknessTexture,
      property,
      'iridescenceThickness'
    );
    const tex = await loadTexture(extension.iridescenceThicknessTexture);
    if (tex) {
      property.setIridescenceThicknessTexture(tex);
    }
  }
}

/**
 * Handles the KHR_texture_transform extension on a texture info.
 * Stores the transform on the property keyed by texture name.
 *
 * @param {object} transform - The KHR_texture_transform extension object.
 * @param {vtkProperty} property - The vtkProperty instance to update.
 * @param {string} textureKey - Key identifying which texture this transform applies to.
 */
export function handleKHRTextureTransform(transform, property, textureKey) {
  const t = {};
  if (transform.offset != null) t.offset = [...transform.offset];
  if (transform.rotation != null) t.rotation = transform.rotation;
  if (transform.scale != null) t.scale = [...transform.scale];
  if (transform.texCoord != null) t.texCoord = transform.texCoord;
  property.setTextureTransform(textureKey, t);
}

/**
 * Handles the KHR_materials_sheen extension.
 * Adds a velvet/fabric sheen layer.
 *
 * @param {object} extension - The KHR_materials_sheen extension object.
 * @param {vtkProperty} property - The vtkProperty instance to update.
 * @param {Function} loadTexture - Async function to load a texture.
 */
export async function handleKHRMaterialsSheen(
  extension,
  property,
  loadTexture
) {
  if (extension.sheenColorFactor != null) {
    property.setSheenColorFactor(
      extension.sheenColorFactor[0],
      extension.sheenColorFactor[1],
      extension.sheenColorFactor[2]
    );
  }
  if (extension.sheenRoughnessFactor != null) {
    property.setSheenRoughnessFactor(extension.sheenRoughnessFactor);
  }
  if (extension.sheenColorTexture && loadTexture) {
    parseTexTransform(extension.sheenColorTexture, property, 'sheenColor');
    const tex = await loadTexture(extension.sheenColorTexture);
    if (tex) {
      property.setSheenColorTexture(tex);
    }
  }
  if (extension.sheenRoughnessTexture && loadTexture) {
    parseTexTransform(
      extension.sheenRoughnessTexture,
      property,
      'sheenRoughness'
    );
    const tex = await loadTexture(extension.sheenRoughnessTexture);
    if (tex) {
      property.setSheenRoughnessTexture(tex);
    }
  }
}

/**
 * Handles the KHR_materials_diffuse_transmission extension.
 * Adds backlit diffuse transmission for thin surfaces like leaves.
 *
 * @param {object} extension - The extension object.
 * @param {vtkProperty} property - The vtkProperty instance to update.
 * @param {Function} loadTexture - Async function to load a texture.
 */
export async function handleKHRMaterialsDiffuseTransmission(
  extension,
  property,
  loadTexture
) {
  if (extension.diffuseTransmissionFactor != null) {
    property.setDiffuseTransmissionFactor(extension.diffuseTransmissionFactor);
  }
  if (extension.diffuseTransmissionColorFactor != null) {
    property.setDiffuseTransmissionColorFactor(
      extension.diffuseTransmissionColorFactor[0],
      extension.diffuseTransmissionColorFactor[1],
      extension.diffuseTransmissionColorFactor[2]
    );
  }
  if (extension.diffuseTransmissionTexture && loadTexture) {
    parseTexTransform(
      extension.diffuseTransmissionTexture,
      property,
      'diffuseTransmission'
    );
    const tex = await loadTexture(extension.diffuseTransmissionTexture);
    if (tex) {
      property.setDiffuseTransmissionTexture(tex);
    }
  }
  if (extension.diffuseTransmissionColorTexture && loadTexture) {
    parseTexTransform(
      extension.diffuseTransmissionColorTexture,
      property,
      'diffuseTransmissionColor'
    );
    const tex = await loadTexture(extension.diffuseTransmissionColorTexture);
    if (tex) {
      property.setDiffuseTransmissionColorTexture(tex);
    }
  }
}

/**
 * Handles the KHR_materials_dispersion extension.
 * Adds chromatic aberration to transmission.
 *
 * @param {object} extension - The extension object.
 * @param {vtkProperty} property - The vtkProperty instance to update.
 */
export function handleKHRMaterialsDispersion(extension, property) {
  if (extension.dispersion != null) {
    property.setDispersion(extension.dispersion);
  }
}
