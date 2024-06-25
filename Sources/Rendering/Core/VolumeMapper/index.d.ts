import vtkPiecewiseFunction from '../../../Common/DataModel/PiecewiseFunction';
import { Bounds, Range, Extent } from '../../../types';
import vtkAbstractMapper3D, {
  IAbstractMapper3DInitialValues,
} from '../AbstractMapper3D';
import { BlendMode, FilterMode } from './Constants';

/**
 *
 */
export interface IVolumeMapperInitialValues
  extends IAbstractMapper3DInitialValues {
  anisotropy?: number;
  autoAdjustSampleDistances?: boolean;
  averageIPScalarRange?: Range;
  blendMode?: BlendMode;
  bounds?: Bounds;
  computeNormalFromOpacity?: boolean;
  getVolumeShadowSamplingDistFactor?: number;
  globalIlluminationReach?: number;
  imageSampleDistance?: number;
  localAmbientOcclusion?: boolean;
  maximumSamplesPerRay?: number;
  sampleDistance?: number;
  LAOKernelRadius?: number;
  LAOKernelSize?: number;
}

export interface vtkVolumeMapper extends vtkAbstractMapper3D {
  /**
   * Get the bounds for this mapper as [xmin, xmax, ymin, ymax,zmin, zmax].
   * @return {Bounds} The bounds for the mapper.
   */
  getBounds(): Bounds;

  /**
   *
   */
  getBlendMode(): BlendMode;

  /**
   *
   */
  getBlendModeAsString(): string;

  /**
   * Get the distance between samples used for rendering
   * @default 1.0
   */
  getSampleDistance(): number;

  /**
   * Sampling distance in the XY image dimensions.
   * Default value of 1 meaning 1 ray cast per pixel. If set to 0.5, 4 rays will be cast per pixel.
   * If set to 2.0, 1 ray will be cast for every 4 (2 by 2) pixels. T
   * @default 1.0
   */
  getImageSampleDistance(): number;

  /**
   *
   * @default 1000
   */
  getMaximumSamplesPerRay(): number;

  /**
   *
   * @default true
   */
  getAutoAdjustSampleDistances(): boolean;

  /**
   * Get at what scale the quality is reduced when interacting for the first time with the volume
   * It should should be set before any call to render for this volume
   * The higher the scale is, the lower the quality of rendering is during interaction
   * @default 1
   */
  getInitialInteractionScale(): number;

  /**
   * Get by how much the sample distance should be increased when interacting
   * This feature is only implemented in the OpenGL volume mapper
   * @default 1
   */
  getInteractionSampleDistanceFactor(): number;

  /**
   *
   */
  getAverageIPScalarRange(): Range;

  /**
   *
   */
  getAverageIPScalarRangeByReference(): Range;

  /**
   * Get the blending coefficient that interpolates between surface and volume rendering
   * @default 0.0
   */
  getVolumetricScatteringBlending(): number;

  /**
   * Get the global illumination reach of volume shadow
   * @default 0.0
   */
  getGlobalIlluminationReach(): number;

  /**
   * Get the multipler for volume shadow sampling distance
   * @default 5.0
   */
  getVolumeShadowSamplingDistFactor(): number;

  /**
   * Get anisotropy of volume shadow scatter
   * @default 0.0
   */
  getAnisotropy(): number;

  /**
   * Get local ambient occlusion flag
   * @default false
   */
  getLocalAmbientOcclusion(): boolean;

  /**
   * Get kernel size for local ambient occlusion
   * @default 15
   */
  getLAOKernelSize(): number;

  /**
   * Get kernel radius for local ambient occlusion
   * @default 7
   */
  getLAOKernelRadius(): number;

  /**
   *
   * @param x
   * @param y
   */
  setAverageIPScalarRange(x: number, y: number): boolean;

  /**
   *
   * @param {Range} averageIPScalarRange
   */
  setAverageIPScalarRangeFrom(averageIPScalarRange: Range): boolean;

  /**
   * Set blend mode to COMPOSITE_BLEND
   * @param {BlendMode} blendMode
   */
  setBlendMode(blendMode: BlendMode): void;

  /**
   * Set blend mode to COMPOSITE_BLEND
   */
  setBlendModeToComposite(): void;

  /**
   * Set blend mode to MAXIMUM_INTENSITY_BLEND
   */
  setBlendModeToMaximumIntensity(): void;

  /**
   * Set blend mode to MINIMUM_INTENSITY_BLEND
   */
  setBlendModeToMinimumIntensity(): void;

  /**
   * Set blend mode to AVERAGE_INTENSITY_BLEND
   */
  setBlendModeToAverageIntensity(): void;

  /**
   * Set blend mode to RADON_TRANSFORM_BLEND
   */
  setBlendModeToRadonTransform(): void;

  /**
   * Get the distance between samples used for rendering
   * @param sampleDistance
   */
  setSampleDistance(sampleDistance: number): boolean;

  /**
   *
   * @param imageSampleDistance
   */
  setImageSampleDistance(imageSampleDistance: number): boolean;

  /**
   *
   * @param maximumSamplesPerRay
   */
  setMaximumSamplesPerRay(maximumSamplesPerRay: number): boolean;

  /**
   *
   * @param autoAdjustSampleDistances
   */
  setAutoAdjustSampleDistances(autoAdjustSampleDistances: boolean): boolean;

  /**
   *
   * @param initialInteractionScale
   */
  setInitialInteractionScale(initialInteractionScale: number): boolean;

  /**
   *
   * @param interactionSampleDistanceFactor
   */
  setInteractionSampleDistanceFactor(
    interactionSampleDistanceFactor: number
  ): boolean;

  /**
   * Set the normal computation to be dependent on the transfer function.
   * By default, the mapper relies on the scalar gradient for computing normals at sample locations
   * for lighting calculations. This is an approximation and can lead to inaccurate results.
   * When enabled, this property makes the mapper compute normals based on the accumulated opacity
   * at sample locations. This can generate a more accurate representation of edge structures in the
   * data but adds an overhead and drops frame rate.
   * @param computeNormalFromOpacity
   */
  setComputeNormalFromOpacity(computeNormalFromOpacity: boolean): boolean;

  /**
   * Set the blending coefficient that determines the interpolation between surface and volume rendering.
   * Default value of 0.0 means shadow effect is computed with phong model.
   * Value of 1.0 means shadow is created by volume occlusion.
   * @param volumeScatterBlendCoef
   */
  setVolumetricScatteringBlending(volumeScatterBlendCoef: number): void;

  /**
   * Set the global illumination reach of volume shadow. This function is only effective when volumeScatterBlendCoef is greater than 0.
   * Default value of 0.0 means only the neighboring voxel is considered when creating global shadow.
   * Value of 1.0 means the shadow ray traverses through the entire volume.
   * @param globalIlluminationReach
   */
  setGlobalIlluminationReach(globalIlluminationReach: number): void;

  /**
   * Set the multipler for volume shadow sampling distance. This function is only effective when volumeScatterBlendCoef is greater than 0.
   * For VSSampleDistanceFactor >= 1.0, volume shadow sampling distance = VSSampleDistanceFactor * SampleDistance.
   * @param VSSampleDistanceFactor
   */
  setVolumeShadowSamplingDistFactor(VSSampleDistanceFactor: number): void;

  /**
   * Set anisotropy of volume shadow scatter. This function is only effective when volumeScatterBlendCoef is greater than 0.
   * Default value of 0.0 means light scatters uniformly in all directions.
   * Value of -1.0 means light scatters backward, value of 1.0 means light scatters forward.
   * @param anisotropy
   */
  setAnisotropy(anisotropy: number): void;

  /**
   * Set whether to turn on local ambient occlusion (LAO). LAO is only effective if shading is on and volumeScatterBlendCoef is set to 0.
   * LAO effect is added to ambient lighting, so the ambient component of the actor needs to be great than 0.
   * @param localAmbientOcclusion
   */
  setLocalAmbientOcclusion(localAmbientOcclusion: boolean): void;

  /**
   * Set kernel size for local ambient occlusion. It specifies the number of rays that are randomly sampled in the hemisphere.
   * Value is clipped between 1 and 32.
   * @param LAOKernelSize
   */
  setLAOKernelSize(LAOKernelSize: number): void;

  /**
   * Set kernel radius for local ambient occlusion. It specifies the number of samples that are considered on each random ray.
   * Value must be greater than or equal to 1.
   * @param LAOKernelRadius
   */
  setLAOKernelRadius(LAOKernelRadius: number): void;

  /**
   * Set kernel size for local ambient occlusion. It specifies the number of rays that are randomly sampled in the hemisphere.
   * Value is clipped between 1 and 32.
   * @param LAOKernelSize
   */
  setLAOKernelSize(LAOKernelSize: number): void;

  /**
   * Set kernel radius for local ambient occlusion. It specifies the number of samples that are considered on each random ray.
   * Value must be greater than or equal to 1.
   * @param LAOKernelRadius
   */
  setLAOKernelRadius(LAOKernelRadius: number): void;

  /**
   * Tells the mapper to only update the specified extents.
   *
   * If there are zero extents, the mapper updates the entire volume texture.
   * Otherwise, the mapper will only update the texture by the specified extents
   * during the next render call.
   *
   * This array is cleared after a successful render.
   * @param extents
   */
  setUpdatedExtents(extents: Extent[]): boolean;

  /**
   * Retrieves the updated extents.
   *
   * This array is cleared after every successful render.
   */
  getUpdatedExtents(): Extent[];

  /**
   *
   */
  update(): void;
}

/**
 * Create an absorption transfer function to set to the mapper when blend mode is RADON.
 * The transfer function is a linear ramp between the lowest material with absorption and
 * the material with maximum absorption. Voxel values lower than the lowest material with
 * absorption will have no absorption associated. Voxel values higher than the maximum
 * absorbent material will have the same absorption than the max absorbent material.
 * The associated color transfer function is typically black to white between 0 and 1.
 * An alternative is to create your own transfer function with HU/absorption pairs. e.g.
 * const ofun = vtkPiecewiseFunction.newInstance();
 * ofun.addPointLong(-1000,0, 1, 1); // air, "1, 1)" to flatten the function
 * ofun.addPoint(-10, 0.01); // fat
 * ofun.addPoint(-10, 0.015); // water
 * ofun.addPointLong(1000, 0.03, 1, 1); // bone
 * ofun.addPoint(3000, 1); // silver
 * @static
 * @param {number} firstAbsorbentMaterialHounsfieldValue: Define minimum voxel value (in hounsfield unit) with non zero absorption (e.g. water (0), fat(-10)...).
 * Any voxel value lower than this parameter will have no absorption (absorption === 0)
 * @param {number} firstAbsorbentMaterialAbsorption: Absorption attributed to voxels with firstAbsorbentMaterialHounsfieldValue (e.g. 0 or 0.01)
 * @param {number} maxAbsorbentMaterialHounsfieldValue: Define maximum voxel value (in hounsfield unit) with increasing absorption (e.g. bone (1000))
 * @param {number} maxAbsorbentMaterialAbsorption: Absorption attributed to voxels >= maxAbsorbentMaterialHounsfieldValue (e.g. 0.03)
 * @param {vtkPiecewiseFunction} outputTransferFunction: To provide optionally to avoid instantiating a new transfer function each time.
 * @return {vtkPiecewiseFunction} the created absorption transfer function to set on VolumeMapper scalarOpacity.
 */
export function createRadonTransferFunction(
  firstAbsorbentMaterialHounsfieldValue: number,
  firstAbsorbentMaterialAbsorption: number,
  maxAbsorbentMaterialHounsfieldValue: number,
  maxAbsorbentMaterialAbsorption: number,
  outputTransferFunction?: vtkPiecewiseFunction
): vtkPiecewiseFunction;

/**
 * Method use to decorate a given object (publicAPI+model) with vtkVolumeMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IVolumeMapperInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IVolumeMapperInitialValues
): void;

/**
 * Method use to create a new instance of vtkVolumeMapper
 */
export function newInstance(
  initialValues?: IVolumeMapperInitialValues
): vtkVolumeMapper;

/**
 * vtkVolumeMapper inherits from vtkMapper.
 * A volume mapper that performs ray casting on the GPU using fragment programs.
 */
export declare const vtkVolumeMapper: {
  newInstance: typeof newInstance;
  extend: typeof extend;
  BlendMode: typeof BlendMode;
  FilterMode: typeof FilterMode;
};
export default vtkVolumeMapper;
