import { Bounds, Range } from "../../../types";
import vtkAbstractMapper, { IAbstractMapperInitialValues } from "../AbstractMapper";
import { BlendMode, FilterMode } from "./Constants";

/**
 * 
 */
interface IVolumeMapperInitialValues extends IAbstractMapperInitialValues {
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
	 */
	update(): void;
}


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
