import macro from 'vtk.js/Sources/macros';

import {
  ColorMode,
  ContrastEnhanceMode,
  NoiseType,
} from 'vtk.js/Sources/Rendering/Core/SurfaceLICInterface/Constants';

function vtkSurfaceLICInterface(publicAPI, model) {
  model.classHierarchy.push('vtkSurfaceLICInterface');
}

const DEFAULT_VALUES = {
  enableLIC: false,
  nuberOfSteps: 40,
  stepSize: 0.25,
  transformVectors: true,
  normalizeVectors: true,
  maskOnSurface: false,
  maskThreshold: 0.0,
  maskColor: [0.0, 0.0, 0.0],
  maskIntensity: 0.0,
  enhancedLIC: true,

  enhanceContrast: ContrastEnhanceMode.NONE,

  lowLICContrastEnhancementFactor: 0.0,
  highLICContrastEnhancementFactor: 0.0,
  lowColorContrastEnhancementFactor: 0.0,
  highColorContrastEnhancementFactor: 0.0,

  antiAlias: 0,
  colorMode: ColorMode.BLEND,
  LICIntensity: 1.0,
  mapModeBias: 0.0,

  noiseTextureSize: 200,
  noiseTextureType: NoiseType.GAUSSIAN,
  noiseGrainSize: 8,
  noiseImpulseProbability: 0.1,
  noiseImpulseBackgroundValue: 0.0,
  noiseGeneratorSeed: 0,

  minNoiseValue: 0.0,
  maxNoiseValue: 1.0,
  numberOfNoiseLevels: 2,

  shadersNeedBuilding: true,
  reallocateTextures: true,
  rebuildNoiseTexture: false,

  viewPortScale: 1.0,
};

export function extend(publicAPI, model, initialValues = {}) {
  Object.assign(model, DEFAULT_VALUES, initialValues);

  macro.obj(publicAPI, model);

  macro.setGet(publicAPI, model, [
    'enableLIC',
    'numberOfSteps',
    'stepSize',
    'normalizeVectors',
    'transformVectors',
    'maskOnSurface',
    'maskThreshold',
    'maskColor',
    'maskIntensity',
    'enhancedLIC',
    'enhanceContrast',
    'lowLICContrastEnhancementFactor',
    'highLICContrastEnhancementFactor',
    'lowColorContrastEnhancementFactor',
    'highColorContrastEnhancementFactor',
    'antiAlias',
    'colorMode',
    'LICIntensity',
    'mapModeBias',

    'noiseTextureSize',
    'noiseTextureType',
    'noiseGrainSize',
    'minNoiseValue',
    'maxNoiseValue',
    'numberOfNoiseLevels',
    'noiseImpulseProbability',
    'noiseImpulseBackgroundValue',
    'noiseGeneratorSeed',
    'viewPortScale',
    'rebuildNoiseTexture',
  ]);

  // Object methods
  vtkSurfaceLICInterface(publicAPI, model);
}

// ----------------------------------------------------------------------------

export const newInstance = macro.newInstance(extend, 'vtkSurfaceLICInterface');

// ----------------------------------------------------------------------------

export default { newInstance, extend };
