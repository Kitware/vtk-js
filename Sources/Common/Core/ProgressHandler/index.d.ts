import { vtkObject } from "../../../interfaces" ;

/**
 *
 */
export interface IProgressHandlerInitialValues {
	workCount?: number;
}

export interface vtkProgressHandler extends vtkObject {
	
	/**
	 * 
	 */
	getWorkCount(): number;

	/**
	 * 
	 */
	startWork(): void;
		
	/**
	 * 
	 */
	stopWork(): void;
		
	/**
	 * 
	 */
	isWorking(): boolean;
		
	/**
	 * 
	 * @param promise 
	 */
	wrapPromise(promise : any): Promise<any>;
		
	/**
	 * 
	 * @param fn 
	 */
	wrapPromiseFunction(fn : any): any;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkProgressHandler characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IProgressHandlerInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IProgressHandlerInitialValues): void;

/**
 * Method used to create a new instance of vtkProgressHandler
 * @param {IProgressHandlerInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IProgressHandlerInitialValues): vtkProgressHandler;

/**
 * vtkProgressHandler stores dataset topologies as an explicit connectivity table
 * listing the point ids that make up each cell.
 * 
 * @see vtkDataArray
 */
export declare const vtkProgressHandler: {
    newInstance: typeof newInstance;
    extend: typeof extend;
}
export default vtkProgressHandler;
