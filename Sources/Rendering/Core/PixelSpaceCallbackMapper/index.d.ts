import vtkCamera from "../Camera";
import vtkMapper, { IMapperInitialValues } from "../Mapper";

/**
 * 
 */
export interface IPixelSpaceCallbackMapperInitialValues extends IMapperInitialValues {
	callback?: any,
	useZValues?: boolean;
}

interface IWindowSize {
	usize: number;
	vsize: number;
}

export interface vtkPixelSpaceCallbackMapper extends vtkMapper {

	/**
	 * 
	 */
	getCallback(): any;

	/**
	 * 
	 */
	getUseZValues(): boolean
	
	/**
	 * 
	 * @param dataset 
	 * @param camera 
	 * @param aspect 
	 * @param windowSize 
	 * @param depthValues 
	 */
	invokeCallback(dataset: any, camera: vtkCamera, aspect: number, windowSize: IWindowSize, depthValues: number[]): void;

	/**
	 * Set the callback function the mapper will call, during the rendering
	 * process, with the screen coords of the points in dataset. The callback
	 * function will have the following parameters:
	 * 
	 * // An array of 4-component arrays, in the index-order of the datasets points
	 * 
	 * coords: [
	 *   [screenx, screeny, screenz, zBufValue],
	 *   ...
	 * ]

	 * // The active camera of the renderer, in case you may need to compute alternate
	 * // depth values for your dataset points.  Using the sphere mapper in your
	 * // application code is one example where this may be useful, so that you can
	 * // account for that mapper's radius when doing depth checks.
	 * 
	 * camera: vtkCamera

	 * // The aspect ratio of the render view and depthBuffer
	 * aspect: float

	 * // A Uint8Array of size width * height * 4, where the zbuffer values are
	 * // encoded in the red and green components of each pixel.  This will only
	 * // be non-null after you call setUseZValues(true) on the mapper before
	 * // rendering.
	 * 
	 * depthBuffer: Uint8Array
	 * 
	 * @param callback 
	 */
	setCallback(callback: () => any): boolean
	

	/**
 	 * Set whether or not this mapper should capture the zbuffer during 
	 * rendering. Useful for allowing depth checks in the application code.
	 * @param useZValues 
	 */
	setUseZValues(useZValues: boolean): boolean
}


/**
 * Method use to decorate a given object (publicAPI+model) with vtkPixelSpaceCallbackMapper characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IPixelSpaceCallbackMapperInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IPixelSpaceCallbackMapperInitialValues): void;

/**
 * Method use to create a new instance of vtkPixelSpaceCallbackMapper
 * @param {IPixelSpaceCallbackMapperInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IPixelSpaceCallbackMapperInitialValues): vtkPixelSpaceCallbackMapper;


/** 
 * vtkPixelSpaceCallbackMapper iterates over the points of its input dataset,
 * using the transforms from the active camera to compute the screen coordinates
 * of each point.
 */
export declare const vtkPixelSpaceCallbackMapper: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkPixelSpaceCallbackMapper;
