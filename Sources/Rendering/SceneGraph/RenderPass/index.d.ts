import { vtkObject } from "../../../interfaces";
import vtkViewNode from "../ViewNode";

/**
 * 
 */
export interface IRenderPassInitialValues {
	delegates: Array<any>;
	preDelegateOperations: Array<any>;
	postDelegateOperations: Array<any>;
}

export interface vtkRenderPass extends vtkObject {

	/**
	 * 
	 */
	getCurrentOperation(): string;

	/**
	 * 
	 */
	getCurrentParent(): any;

	/**
	 * 
	 */
	getDelegates(): any;

	/**
	 * 
	 */
	getOperation(): void;

	/**
	 * 
	 */
	getPostDelegateOperations(): any;

	/**
	 * 
	 */
	getPreDelegateOperations(): any;

	/**
	 * 
	 */
	getTraverseOperation(): string;

	/**
	 * 
	 * @param {String} val 
	 */
	setCurrentOperation(val: string): void;

	/**
	 * 
	 * @param currentParent 
	 */
	setCurrentParent(currentParent: any): boolean;

	/**
	 * 
	 * @param delegates 
	 */
	setDelegates(delegates: any): boolean;

	/**
	 * 
	 * @param postDelegateOperations 
	 */
	setPostDelegateOperations(postDelegateOperations: any): boolean;

	/**
	 * 
	 * @param preDelegateOperations 
	 */
	setPreDelegateOperations(preDelegateOperations: any): boolean;

	/**
	 * by default this class will traverse all of its
	 * preDelegateOperations, then call its delegate render passes
	 * the traverse all of its postDelegateOperations
	 * any of those three arrays can be empty
	 * @param viewNode 
	 * @param parent 
	 */
	traverse(viewNode: vtkViewNode, parent: any): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkRenderPass characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IRenderPassInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IRenderPassInitialValues): void;

/**
 * Method used to create a new instance of vtkRenderPass.
 * @param {IRenderPassInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IRenderPassInitialValues): vtkRenderPass;

/**
 * vtkRenderPass is a deferred class with a simple deferred method Render.
 */
export declare const vtkRenderPass: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkRenderPass;
