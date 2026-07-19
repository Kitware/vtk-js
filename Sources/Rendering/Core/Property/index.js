import macro from 'vtk.js/Sources/macros';
import Constants from 'vtk.js/Sources/Rendering/Core/Property/Constants';

const { Representation, Interpolation } = Constants;

function notImplemented(method) {
  return () => macro.vtkErrorMacro(`vtkProperty::${method} - NOT IMPLEMENTED`);
}

// ----------------------------------------------------------------------------
// vtkProperty methods
// ----------------------------------------------------------------------------

function vtkProperty(publicAPI, model) {
  // Set our className
  model.classHierarchy.push('vtkProperty');

  publicAPI.setColor = (r, g, b) => {
    if (Array.isArray(r)) {
      if (
        model.color[0] !== r[0] ||
        model.color[1] !== r[1] ||
        model.color[2] !== r[2]
      ) {
        model.color[0] = r[0];
        model.color[1] = r[1];
        model.color[2] = r[2];
        publicAPI.modified();
      }
    } else if (
      model.color[0] !== r ||
      model.color[1] !== g ||
      model.color[2] !== b
    ) {
      model.color[0] = r;
      model.color[1] = g;
      model.color[2] = b;
      publicAPI.modified();
    }

    publicAPI.setDiffuseColor(model.color);
    publicAPI.setAmbientColor(model.color);
    publicAPI.setSpecularColor(model.color);
  };

  publicAPI.computeCompositeColor = notImplemented('ComputeCompositeColor');
  publicAPI.getColor = () => {
    // Inline computeCompositeColor
    let norm = 0.0;
    if (model.ambient + model.diffuse + model.specular > 0) {
      norm = 1.0 / (model.ambient + model.diffuse + model.specular);
    }

    for (let i = 0; i < 3; i++) {
      model.color[i] =
        norm *
        (model.ambient * model.ambientColor[i] +
          model.diffuse * model.diffuseColor[i] +
          model.specular * model.specularColor[i]);
    }

    return [].concat(model.color);
  };

  publicAPI.addShaderVariable = notImplemented('AddShaderVariable');

  publicAPI.setInterpolationToFlat = () =>
    publicAPI.setInterpolation(Interpolation.FLAT);
  publicAPI.setInterpolationToGouraud = () =>
    publicAPI.setInterpolation(Interpolation.GOURAUD);
  publicAPI.setInterpolationToPhong = () =>
    publicAPI.setInterpolation(Interpolation.PHONG);
  publicAPI.setInterpolationToPBR = () =>
    publicAPI.setInterpolation(Interpolation.PBR);
  publicAPI.getInterpolationAsString = () =>
    macro.enumToString(Interpolation, model.interpolation);

  publicAPI.setRepresentationToWireframe = () =>
    publicAPI.setRepresentation(Representation.WIREFRAME);
  publicAPI.setRepresentationToSurface = () =>
    publicAPI.setRepresentation(Representation.SURFACE);
  publicAPI.setRepresentationToPoints = () =>
    publicAPI.setRepresentation(Representation.POINTS);
  publicAPI.getRepresentationAsString = () =>
    macro.enumToString(Representation, model.representation);
}

// ----------------------------------------------------------------------------
// Object factory
// ----------------------------------------------------------------------------

const DEFAULT_VALUES = {
  color: [1, 1, 1],
  ambientColor: [1, 1, 1],
  diffuseColor: [1, 1, 1],
  specularColor: [1, 1, 1],
  edgeColor: [0, 0, 0],

  ambient: 0,
  diffuse: 1,
  metallic: 0,
  roughness: 0.6,
  normalStrength: 1,
  emission: 1,
  baseIOR: 1.45,
  specular: 0,
  specularPower: 1,
  opacity: 1,
  edgeOpacity: 1,
  interpolation: Interpolation.GOURAUD,
  representation: Representation.SURFACE,
  edgeVisibility: false,
  backfaceCulling: false,
  frontfaceCulling: false,
  pointSize: 1,
  lineWidth: 1,
  lighting: true,

  anisotropy: 0,
  anisotropyRotation: 0,
  coatStrength: 0,
  coatRoughness: 0,
  coatColor: [1, 1, 1],
  coatF0: 0.04,
  coatNormalStrength: 1,
  displacementFactor: 1,
  emissiveStrength: 1,
  occlusionStrength: 1,
  transmissionFactor: 0,
  alphaCutoff: 0,
  alphaMode: 0, // 0=OPAQUE, 1=MASK, 2=BLEND
  thicknessFactor: 0,
  attenuationDistance: Infinity,
  attenuationColor: [1, 1, 1],

  // Iridescence (KHR_materials_iridescence)
  iridescenceFactor: 0,
  iridescenceIOR: 1.3,
  iridescenceThicknessMinimum: 100,
  iridescenceThicknessMaximum: 400,

  // Sheen (KHR_materials_sheen)
  sheenColorFactor: [0, 0, 0],
  sheenRoughnessFactor: 0,

  // Diffuse Transmission (KHR_materials_diffuse_transmission)
  diffuseTransmissionFactor: 0,
  diffuseTransmissionColorFactor: [1, 1, 1],

  // Dispersion (KHR_materials_dispersion)
  dispersion: 0,

  // Specular (KHR_materials_specular)
  specularFactor: 1.0,
  specularColorFactor: [1, 1, 1],

  // Texture transforms (KHR_texture_transform) — per-texture map
  textureTransforms: {},

  shading: false,
  materialName: null,

  ORMTexture: null,
  RMTexture: null,
  anisotropyTexture: null,
  coatTexture: null,
  coatRoughnessTexture: null,
  coatNormalTexture: null,
  displacementTexture: null,
  transmissionTexture: null,
  thicknessTexture: null,
  iridescenceTexture: null,
  iridescenceThicknessTexture: null,
  sheenColorTexture: null,
  sheenRoughnessTexture: null,
  diffuseTransmissionTexture: null,
  diffuseTransmissionColorTexture: null,
  specularTexture: null,
  specularColorTexture: null,
};

// ----------------------------------------------------------------------------

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  // Build VTK API
  macro.obj(publicAPI, model);

  macro.setGet(publicAPI, model, [
    'lighting',
    'interpolation',
    'ambient',
    'diffuse',
    'metallic',
    'roughness',
    'normalStrength',
    'emission',
    'baseIOR',
    'specular',
    'specularPower',
    'opacity',
    'edgeOpacity',
    'edgeVisibility',
    'lineWidth',
    'pointSize',
    'backfaceCulling',
    'frontfaceCulling',
    'representation',
    'diffuseTexture',
    'metallicTexture',
    'roughnessTexture',
    'normalTexture',
    'ambientOcclusionTexture',
    'emissionTexture',
    'anisotropy',
    'anisotropyRotation',
    'coatStrength',
    'coatRoughness',
    'coatF0',
    'coatNormalStrength',
    'displacementFactor',
    'emissiveStrength',
    'occlusionStrength',
    'transmissionFactor',
    'alphaCutoff',
    'alphaMode',
    'thicknessFactor',
    'attenuationDistance',
    'iridescenceFactor',
    'iridescenceIOR',
    'iridescenceThicknessMinimum',
    'iridescenceThicknessMaximum',
    'sheenRoughnessFactor',
    'diffuseTransmissionFactor',
    'dispersion',
    'ORMTexture',
    'RMTexture',
    'anisotropyTexture',
    'coatTexture',
    'coatRoughnessTexture',
    'coatNormalTexture',
    'displacementTexture',
    'transmissionTexture',
    'thicknessTexture',
    'iridescenceTexture',
    'iridescenceThicknessTexture',
    'sheenColorTexture',
    'sheenRoughnessTexture',
    'diffuseTransmissionTexture',
    'diffuseTransmissionColorTexture',
    'specularFactor',
    'specularTexture',
    'specularColorTexture',
  ]);
  macro.setGetArray(
    publicAPI,
    model,
    [
      'ambientColor',
      'specularColor',
      'diffuseColor',
      'edgeColor',
      'coatColor',
      'attenuationColor',
      'sheenColorFactor',
      'diffuseTransmissionColorFactor',
      'specularColorFactor',
    ],
    3
  );

  // Per-texture transform methods
  publicAPI.setTextureTransform = (key, transform) => {
    if (!model.textureTransforms) model.textureTransforms = {};
    model.textureTransforms[key] = { ...transform };
    publicAPI.modified();
  };
  publicAPI.setTextureTransforms = (transforms) => {
    model.textureTransforms = transforms || {};
    publicAPI.modified();
  };
  publicAPI.getTextureTransform = (key) =>
    model.textureTransforms?.[key] || null;
  publicAPI.getTextureTransforms = () => model.textureTransforms || {};

  // Object methods
  vtkProperty(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkProperty');

// ----------------------------------------------------------------------------

export default { newInstance, extend, ...Constants };
