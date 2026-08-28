import { EventHandler, vtkObject, vtkSubscription } from '../../../interfaces';
import { Nullable } from '../../../types';
import vtkRenderPass from '../RenderPass';
import vtkViewNodeFactory from '../ViewNodeFactory';

/**
 * The traversal passes a view node supports, in traversal order.
 */
declare const PASS_TYPES: readonly string[];

/**
 *
 */
export interface IViewNodeInitialValues {
  parent?: null;
  renderable?: null;
  myFactory?: null;
  children?: Array<any>;
  visited?: boolean;
}

export interface vtkViewNode extends vtkObject {
  /**
   * Add a child view node to this node, created from the renderable given as argument
   * If the node creation fails or the argument is falsy, returns undefined
   * Otherwise, returns the newly created node or the existing node
   * @param dobj
   */
  addMissingNode(dobj: any): vtkViewNode | undefined;

  /**
   * Removes a child view node
   * If the node is not found, returns false
   * Otherwise, removes the node from the children list and returns true
   * @param dobj
   */
  removeNode(dobj: any): boolean;

  /**
   *
   * @param dataObjs
   */
  addMissingNodes(dataObjs: any): void;

  /**
   * Adopt child nodes that have no renderable of their own, so that a node can
   * delegate passes to a helper.
   * @param children
   */
  addMissingChildren(children: vtkViewNode[]): void;

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
  createViewNode(dataObj: any): vtkViewNode | null;

  /**
   *
   */
  getChildren(): vtkViewNode[];

  /**
   *
   */
  getChildrenByReference(): vtkViewNode[];

  /**
   * Find the first parent/grandparent of the desired type
   * @param type
   */
  getFirstAncestorOfType(type: any): vtkViewNode | null;

  /**
   * Find the last parent/grandparent of the desired type
   * @param type
   */
  getLastAncestorOfType(type: any): vtkViewNode | null;

  /**
   *
   */
  getMyFactory(): Nullable<vtkViewNodeFactory>;

  /**
   *
   */
  getParent(): Nullable<vtkViewNode>;

  /**
   * Get The data object (thing to be rendered).
   */
  getRenderable(): Nullable<vtkObject>;

  /**
   * Returns the view node that corresponding to the provided object
   * Will return NULL if a match is not found in self or descendents
   * @param dataObject
   * @param [hint] the previously found node (for optimization)
   */
  getViewNodeFor(dataObject: any, hint?: any): vtkViewNode | undefined;

  /**
   *
   */
  getVisited(): boolean;

  invokeEvent(...args: unknown[]): void;
  onEvent(cb: EventHandler, priority?: number): vtkSubscription;

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
  setMyFactory(myFactory: Nullable<vtkViewNodeFactory>): boolean;

  /**
   *
   * @param parent
   */
  setParent(parent: Nullable<vtkViewNode>): boolean;

  /**
   *
   * @param renderable
   */
  setRenderable(renderable: Nullable<vtkObject>): boolean;

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
declare function extend(
  publicAPI: object,
  model: object,
  initialValues?: IViewNodeInitialValues
): void;

/**
 * Method used to create a new instance of vtkViewNode.
 * @param {IViewNodeInitialValues} [initialValues] for pre-setting some of its content
 */
declare function newInstance(
  initialValues?: IViewNodeInitialValues
): vtkViewNode;

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
  newInstance: typeof newInstance;
  extend: typeof extend;
  // constants
  PASS_TYPES: typeof PASS_TYPES;
};
export default vtkViewNode;
