import vtkActor, { IActorInitialValues } from "../Actor";

export interface ISkyboxInitialValues extends IActorInitialValues {
	format?: string;
}

export interface vtkSkybox extends vtkActor {

	/**
	 * 
	 */
	getFromat(): string;

	/**
	 * 
	 */
	getIsOpaque(): boolean;

	/**
	 * 
	 */
	getSupportsSelection(): boolean;

	/**
	 * 
	 */
	hasTranslucentPolygonalGeometry(): boolean;

	/**
	 * 
	 * @param format 
	 */
	setFromat(format: string): boolean;
}

/**
 * Method use to decorate a given object (publicAPI+model) with vtkSkybox characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ISkyboxInitialValues} [initialValues] (default: {})
 */
 export function extend(publicAPI: object, model: object, initialValues?: ISkyboxInitialValues): void;

 /**
  * Method use to create a new instance of vtkSkybox 
  */
 export function newInstance(initialValues?: ISkyboxInitialValues): vtkSkybox;
 
 /** 
  * 
  */
 export declare const vtkSkybox: {
	 newInstance: typeof newInstance,
	 extend: typeof extend,
 };
 export default vtkSkybox;
