import { vtkObject } from "../../../interfaces";
import { Size } from "../../../types";


/**
 *
 */
export interface IImageStreamInitialValues {
	viewStreams?: any[],
	serverAnimationFPS?: number,
}


export interface vtkImageStream extends vtkObject {

	/**
	 * 
	 */
	connect(): void;

	/**
	 * 
	 * @param {Number} [viewId] The ID of the view.
	 * @param {Size} [size] The size of the view. 
	 */
	createViewStream(viewId?: number, size?: Size): any;

	/**
	 * 
	 */
	delete(): void;

	/**
	 * 
	 */
	disconnect(): void;

	/**
	 * 
	 */
	getProtocol(): any;

	/**
	 * 
	 */
	getServerAnimationFPS(): number;

	/**
	 * 
	 */
	registerViewStream(): void;

	/**
	 * 
	 * @param serverAnimationFPS 
	 */
	setServerAnimationFPS(serverAnimationFPS: number): boolean;

	/**
	 * 
	 */
	unregisterViewStream(): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkImageStream characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IImageStreamInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IImageStreamInitialValues): void;

/**
 * Method used to create a new instance of vtkImageStream
 * @param {IImageStreamInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IImageStreamInitialValues): vtkImageStream;

/**
 * vtkImageStream.
 */
export declare const vtkImageStream: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkImageStream;
