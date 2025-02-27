import macro from 'vtk.js/Sources/macros';
import * as vtkMath from 'vtk.js/Sources/Common/Core/Math';
import vtkDracoReader from 'vtk.js/Sources/IO/Geometry/DracoReader';
import vtkLight from 'vtk.js/Sources/Rendering/Core/Light';

import { MIN_LIGHT_ATTENUATION } from 'vtk.js/Sources/IO/Geometry/GLTFImporter/Constants';

const { vtkWarningMacro } = macro;

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
 * @param {object} extension - The KHR_materials_specular extension object.
 * @param {vtkProperty} property - The vtkProperty instance to update.
 */
export function handleKHRMaterialsSpecular(extension, property) {
  property.setSpecular(extension.specularFactor);
  property.setSpecularColor(extension.specularColorFactor);
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

  const l = vtkLight.newInstance({
    color: color || [1, 1, 1],
    intensity: intensity || 1.0,
  });

  // Apply the global transform to the light
  l.setTransformMatrix(transformMatrix);

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
