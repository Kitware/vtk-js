import { ColorMixPreset } from 'vtk.js/Sources/Rendering/Core/VolumeProperty/Constants';

export const ApiSpecificPresets = {
  [ColorMixPreset.ADDITING]: `
  float opacity0 = goFactor.x * pwfValue0;
  float opacity1 = goFactor.y * pwfValue1;
  float opacitySum = clamp(opacity0 + opacity1, 0.0, 1.0);
  if (opacitySum == 0.0) {
    return vec4(0.0);
  }
  #if vtkLightComplexity > 0
    applyLighting(tColor0, normal0);
    applyLighting(tColor1, normal1);
  #endif
  vec3 mixedColor = mix(tColor0, tColor1, opacity1 / opacitySum);
  return vec4(mixedColor, opacitySum);
`,
};

export default { ApiSpecificPresets };
