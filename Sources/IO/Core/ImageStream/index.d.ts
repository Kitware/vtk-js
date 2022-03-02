import { vtkObject } from "../../../interfaces";
import { Size } from "../../../types";
import vtkViewStream from './ViewStream';

/**
 *
 */
export interface IImageStreamInitialValues {
	viewStreams?: any[],
	serverAnimationFPS?: number,
}

// Return type of wslink/src/WebsocketConnection, getSession() method.
type WebsocketSession = any;

export interface vtkImageStream extends vtkObject {

	/**
	 *
	 */
	connect(session: WebsocketSession): void;

	/**
	 *
	 * @param {String} [viewId] The ID of the view.
	 * @param {Size} [size] The size of the view.
	 */
	createViewStream(viewId?: string, size?: Size): vtkViewStream;

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
