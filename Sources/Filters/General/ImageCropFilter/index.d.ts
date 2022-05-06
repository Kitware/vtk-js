import { vtkAlgorithm, vtkObject } from "../../../interfaces";

type CroppingPlanes = number[];

/**
 *
 */
export interface IImageCropFilterInitialValues {
	croppingPlanes?: CroppingPlanes;
}

type vtkImageCropFilterBase = vtkObject & vtkAlgorithm;

export interface vtkImageCropFilter extends vtkImageCropFilterBase {

	/**
	 * Get The cropping planes, in IJK space.
	 * @default [0, 0, 0, 0, 0, 0].
	 */
	getCroppingPlanes(): CroppingPlanes;

	/**
	 * Get The cropping planes, in IJK space.
	 * @default [0, 0, 0, 0, 0, 0].
	 */
	getCroppingPlanesByReference(): CroppingPlanes;

	/**
	 *
	 */
	isResetAvailable(): boolean;

	/**
	 *
	 */
	reset(): void;

	/**
	 *
	 * @param inData
	 * @param outData
	 */
	requestData(inData: any, outData: any): void;

	/**
	 *
	 * @param croppingPlanes
	 */
	setCroppingPlanes(croppingPlanes: CroppingPlanes): boolean;

	/**
	 *
	 * @param croppingPlanes
	 */
	setCroppingPlanesFrom(croppingPlanes: CroppingPlanes): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkImageCropFilter characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IImageCropFilterInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IImageCropFilterInitialValues): void;

/**
 * Method used to create a new instance of vtkImageCropFilter
 * @param {IImageCropFilterInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IImageCropFilterInitialValues): vtkImageCropFilter;


/**
 * The vtkImageCropFilter will crop a vtkImageData. This will only crop against
 * IJK-aligned planes. 
 * 
 * Note this is slow on large datasets due to CPU-bound
 * cropping.
 */
export declare const vtkImageCropFilter: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkImageCropFilter;
