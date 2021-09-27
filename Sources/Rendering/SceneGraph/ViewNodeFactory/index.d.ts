import { vtkObject } from "../../../interfaces";

/**
 * 
 */
export interface IViewNodeFactoryInitialValues {}

export interface vtkViewNodeFactory extends vtkObject {

	/**
	 * Creates and returns a vtkViewNode for the provided renderable.
	 * @param dataObject 
	 */
	createNode(dataObject: any): void;

	/**
	 * Give a function pointer to a class that will manufacture a vtkViewNode
	 * when given a class name string.
	 * @param className 
	 * @param func 
	 */
	registerOverride(className: any, func: any): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkViewNodeFactory characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IViewNodeFactoryInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IViewNodeFactoryInitialValues): void;

/**
 * Method used to create a new instance of vtkViewNodeFactory.
 * @param {IViewNodeFactoryInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IViewNodeFactoryInitialValues): vtkViewNodeFactory;

/**
 * factory that chooses vtkViewNodes to create
 * 
 * Class tells VTK which specific vtkViewNode subclass to make when it is asked
 * to make a vtkViewNode for a particular renderable. modules for different
 * rendering backends are expected to use this to customize the set of instances
 * for their own purposes
 */
export declare const vtkViewNodeFactory: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkViewNodeFactory;
