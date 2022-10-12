import { vtkObject } from "../../../interfaces";
import vtkPiecewiseFunction from "../../../Common/DataModel/PiecewiseFunction";
import { Bounds, Range, Vector3 } from "../../../types";
import vtkAbstractMapper, { IAbstractMapperInitialValues } from "../AbstractMapper";
import { BlendMode, FilterMode } from "./Constants";

/**
 * 
 */
export interface IVolumeMapperInitialValues extends IAbstractMapperInitialValues {
	bounds?: Bounds;
	blendMode?: BlendMode;
	sampleDistance?: number;
	imageSampleDistance?: number;
	maximumSamplesPerRay?: number;
	autoAdjustSampleDistances?: boolean;
	averageIPScalarRange?: Range;
}

export interface vtkVolumeMapper extends vtkAbstractMapper {

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
	outputTransferFunction?: vtkPiecewiseFunction): vtkPiecewiseFunction;

/**
 * Method use to decorate a given object (publicAPI+model) with vtkVolumeMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IVolumeMapperInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IVolumeMapperInitialValues): void;

/**
 * Method use to create a new instance of vtkVolumeMapper 
 */
export function newInstance(initialValues?: IVolumeMapperInitialValues): vtkVolumeMapper;

/**
 *
 */
export interface ISliceHelperInitialValues {
	thickness?: number;
	origin?: Vector3;
	normal?: Vector3;
}

/**
 * Helper class to perform MPR.
 */

 export interface vtkSliceHelper extends vtkObject {
  /**
   * Update the mapper from the slice helper parameters.
   */
   update(): void;

  /**
   * Get the distance between clip planes
   */
   getThickness(): number;

  /**
   * Get the origin of the MPR
   */
   getOrigin(): Vector3;

  /**
   * Get the orientation of the MPR
   */
   getNormal(): Vector3;

  /**
   * Set the distance between clip planes
   */
   setThickness(thickness: number): boolean;

  /**
   * Set the origin of the MPR
   */
   setOrigin(origin: Vector3): boolean;

  /**
   * Set the orientation of the MPR
   */
   setNormal(normal: Vector3): boolean;

}

/** 
 * vtkVolumeMapper inherits from vtkMapper.
 * A volume mapper that performs ray casting on the GPU using fragment programs.
 */
export declare const vtkVolumeMapper: {
	newInstance: typeof newInstance;
	extend: typeof extend;
	BlendMode: typeof BlendMode;
	FilterMode: typeof FilterMode;
	vtkSliceHelper: vtkSliceHelper,
};
export default vtkVolumeMapper;

/**
 * Method use to decorate a given object (publicAPI+model) with vtkVolumeMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IVolumeMapperInitialValues} [initialValues] (default: {})
 */
 export function extendSliceHelper(publicAPI: object, model: object, initialValues?: IVolumeMapperInitialValues): void;

 /**
  * Method use to create a new instance of vtkVolumeMapper 
  */
 export function newInstanceSliceHelper(initialValues?: IVolumeMapperInitialValues): vtkVolumeMapper;
 
export declare const vtkSliceHelper: {
	newInstance: typeof newInstanceSliceHelper,
	extend: typeof extendSliceHelper,
};
