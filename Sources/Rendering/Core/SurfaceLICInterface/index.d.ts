import { vtkObject } from '../../../interfaces';
import { RGBColor } from '../../../types';
import { ColorMode, ContrastEnhanceMode, NoiseType } from './Constants';

export interface ISurfaceLICInterfaceInitialValues {
  enableLIC?: boolean;
  numberOfSteps?: number;
  stepSize?: number;
  transformVectors?: boolean;
  normalizeVectors?: boolean;
  maskOnSurface?: boolean;
  maskThreshold?: number;
  maskColor?: RGBColor;
  maskIntensity?: number;
  enhancedLIC?: boolean;
  enhanceContrast?: ContrastEnhanceMode;
  lowLICContrastEnhancementFactor?: number;
  highLICContrastEnhancementFactor?: number;
  lowColorContrastEnhancementFactor?: number;
  highColorContrastEnhancementFactor?: number;
  antiAlias?: number;
  colorMode?: ColorMode;
  LICIntensity?: number;
  mapModeBias?: number;
  noiseTextureSize?: number;
  noiseTextureType?: NoiseType;
  noiseGrainSize?: number;
  noiseImpulseProbability?: number;
  noiseImpulseBackgroundValue?: number;
  noiseGeneratorSeed?: number;
  minNoiseValue?: number;
  maxNoiseValue?: number;
  numberOfNoiseLevels?: number;
  shadersNeedBuilding?: boolean;
  reallocateTextures?: boolean;
  rebuildNoiseTexture?: boolean;
  viewPortScale?: number;
}

export interface vtkSurfaceLICInterface extends vtkObject {
  getEnableLIC(): boolean;
  setEnableLIC(enableLIC: boolean): boolean;

  /**
   * Number of integration steps taken on each side of a seed.
   */
  getNumberOfSteps(): number;
  setNumberOfSteps(numberOfSteps: number): boolean;

  getStepSize(): number;
  setStepSize(stepSize: number): boolean;

  getNormalizeVectors(): boolean;
  setNormalizeVectors(normalizeVectors: boolean): boolean;

  getTransformVectors(): boolean;
  setTransformVectors(transformVectors: boolean): boolean;

  getMaskOnSurface(): boolean;
  setMaskOnSurface(maskOnSurface: boolean): boolean;

  getMaskThreshold(): number;
  setMaskThreshold(maskThreshold: number): boolean;

  getMaskColor(): RGBColor;
  setMaskColor(maskColor: RGBColor): boolean;

  getMaskIntensity(): number;
  setMaskIntensity(maskIntensity: number): boolean;

  getEnhancedLIC(): boolean;
  setEnhancedLIC(enhancedLIC: boolean): boolean;

  getEnhanceContrast(): ContrastEnhanceMode;
  setEnhanceContrast(enhanceContrast: ContrastEnhanceMode): boolean;

  getLowLICContrastEnhancementFactor(): number;
  setLowLICContrastEnhancementFactor(
    lowLICContrastEnhancementFactor: number
  ): boolean;

  getHighLICContrastEnhancementFactor(): number;
  setHighLICContrastEnhancementFactor(
    highLICContrastEnhancementFactor: number
  ): boolean;

  getLowColorContrastEnhancementFactor(): number;
  setLowColorContrastEnhancementFactor(
    lowColorContrastEnhancementFactor: number
  ): boolean;

  getHighColorContrastEnhancementFactor(): number;
  setHighColorContrastEnhancementFactor(
    highColorContrastEnhancementFactor: number
  ): boolean;

  getAntiAlias(): number;
  setAntiAlias(antiAlias: number): boolean;

  getColorMode(): ColorMode;
  setColorMode(colorMode: ColorMode): boolean;

  getLICIntensity(): number;
  setLICIntensity(LICIntensity: number): boolean;

  getMapModeBias(): number;
  setMapModeBias(mapModeBias: number): boolean;

  getNoiseTextureSize(): number;
  setNoiseTextureSize(noiseTextureSize: number): boolean;

  getNoiseTextureType(): NoiseType;
  setNoiseTextureType(noiseTextureType: NoiseType): boolean;

  getNoiseGrainSize(): number;
  setNoiseGrainSize(noiseGrainSize: number): boolean;

  getMinNoiseValue(): number;
  setMinNoiseValue(minNoiseValue: number): boolean;

  getMaxNoiseValue(): number;
  setMaxNoiseValue(maxNoiseValue: number): boolean;

  getNumberOfNoiseLevels(): number;
  setNumberOfNoiseLevels(numberOfNoiseLevels: number): boolean;

  getNoiseImpulseProbability(): number;
  setNoiseImpulseProbability(noiseImpulseProbability: number): boolean;

  getNoiseImpulseBackgroundValue(): number;
  setNoiseImpulseBackgroundValue(noiseImpulseBackgroundValue: number): boolean;

  getNoiseGeneratorSeed(): number;
  setNoiseGeneratorSeed(noiseGeneratorSeed: number): boolean;

  getViewPortScale(): number;
  setViewPortScale(viewPortScale: number): boolean;

  getRebuildNoiseTexture(): boolean;
  setRebuildNoiseTexture(rebuildNoiseTexture: boolean): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with
 * vtkSurfaceLICInterface characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ISurfaceLICInterfaceInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: ISurfaceLICInterfaceInitialValues
): void;

/**
 * Method used to create a new instance of vtkSurfaceLICInterface.
 * @param {ISurfaceLICInterfaceInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: ISurfaceLICInterfaceInitialValues
): vtkSurfaceLICInterface;

/**
 * vtkSurfaceLICInterface is a parameter holder for the Line Integral
 * Convolution surface rendering. It carries the LIC integration, masking,
 * contrast enhancement and noise texture settings that the API specific
 * mapper implementations read.
 */
export declare const vtkSurfaceLICInterface: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkSurfaceLICInterface;
