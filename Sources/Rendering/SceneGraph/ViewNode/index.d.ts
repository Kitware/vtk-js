import { vtkObject } from "../../../interfaces";
import vtkRenderPass from "../RenderPass";

export enum PASS_TYPES {
	'Build',
	'Render'
}

/**
 * 
 */
export interface IViewNodeInitialValues {
	parent?: null,
	renderable?: null,
	myFactory?: null,
	children?: Array<any>;
	visited?: boolean;
}

export interface vtkViewNode extends vtkObject {

	/**
	 * 
	 * @param dobj 
	 */
	addMissingNode(dobj: any): void;

	/**
	 * 
	 * @param dataObjs 
	 */
	addMissingNodes(dataObjs: any): void;

	/**
	 * 
	 * @param {vtkRenderPass} renderPass 
	 * @param prepass 
	 */
	apply(renderPass: vtkRenderPass, prepass: boolean): void;

	/**
	 * Builds myself.
	 * @param prepass 
	 */
	build(prepass: any): void;

	/**
	 * 
	 * @param dataObj 
	 */
	createViewNode(dataObj: any): void;

	/**
	 * 
	 */
	getChildren(): any;

	/**
	 * 
	 */
	getChildrenByReference(): any;

	/**
	 * Find the first parent/grandparent of the desired type
	 * @param type 
	 */
	getFirstAncestorOfType(type: any): void;

	/**
	 * 
	 */
	getMyFactory(): any;

	/**
	 * 
	 */
	getParent(): any;

	/**
	 * Get The data object (thing to be rendered).
	 */
	getRenderable(): any;

	/**
	 * Returns the view node that corresponding to the provided object
	 * Will return NULL if a match is not found in self or descendents
	 * @param dataObject 
	 */
	getViewNodeFor(dataObject: any): any;

	/**
	 * 
	 */
	getVisited(): boolean;


	//invokeEvent
	//onEvent(callback: (instance: vtkObject) => any): vtkSubscription;

	/**
	 * 
	 */
	prepareNodes(): void;

	/**
	 * 
	 */
	removeUnusedNodes(): void;

	/**
	 * Makes calls to make self visible.
	 * @param prepass 
	 */
	render(prepass: any): void;

	/**
	 * 
	 * @param myFactory 
	 */
	setMyFactory(myFactory: any): boolean;

	/**
	 * 
	 * @param parent 
	 */
	setParent(parent: any): boolean;

	/**
	 * 
	 * @param renderable 
	 */
	setRenderable(renderable: any): boolean;

	/**
	 * 
	 * @param val 
	 */
	setVisited(val: boolean): void;

	/**
	 * Traverse this node with the specified pass. If you want to traverse your
	 * children in a specific order or way override this method
	 * @param {vtkRenderPass} renderPass 
	 */
	traverse(renderPass: vtkRenderPass): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkViewNode characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IViewNodeInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IViewNodeInitialValues): void;

/**
 * Method used to create a new instance of vtkViewNode.
 * @param {IViewNodeInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IViewNodeInitialValues): vtkViewNode;

/**
 * a node within a VTK scene graph
 * 
 * This is the superclass for all nodes within a VTK scene graph. It contains
 * the API for a node. It supports the essential operations such as graph
 * creation, state storage and traversal. Child classes adapt this to VTK's
 * major rendering classes. Grandchild classes adapt those to for APIs of
 * different rendering libraries.
 */
export declare const vtkViewNode: {
	newInstance: typeof newInstance,
	extend: typeof extend,
};
export default vtkViewNode;
