import { vtkAlgorithm, vtkObject } from "../../../interfaces";

/**
 * 
 */
export interface IImageSliceFilterInitialValues {
	sliceIndex?: number
}

type vtkImageSliceFilterBase = vtkObject & vtkAlgorithm;

export interface vtkImageSliceFilter extends vtkImageSliceFilterBase {

	/**
	 * 
	 */
	getOrientation(): any;

	/**
	 * 
	 * @default 0
	 */
	getSliceIndex(): number;

	/**
	 *
	 * @param inData 
	 * @param outData 
	 */
	requestData(inData: any, outData: any): void;

	 /**
	  * 
	  * @param orientation 
	  */
	setOrientation(orientation: any): boolean; 

	/**
	 * 
	 * @param sliceIndex 
	 */
	setSliceIndex(sliceIndex: number): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkImageSliceFilter characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IImageSliceFilterInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IImageSliceFilterInitialValues): void;

/**
 * Method used to create a new instance of vtkImageSliceFilter
 * @param {IImageSliceFilterInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IImageSliceFilterInitialValues): vtkImageSliceFilter;


/**
 *
 */
export declare const vtkImageSliceFilter: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkImageSliceFilter;
