import { vtkObject } from '../../../interfaces';
import { Nullable, Vector3 } from '../../../types';

/**
 * The three axes of an oriented bounding box, ordered from longest to shortest.
 */
export type OBBAxes = [Vector3, Vector3, Vector3];

/**
 *
 */
export interface IOBBNodeInitialValues {
  corner?: Vector3;
  axes?: OBBAxes;
  cells?: number[];
}

export interface vtkOBBNode extends vtkObject {
  /**
   * Recursively copy `nodeSource`, and its children, into this node.
   * @param {vtkOBBNode} nodeSource
   */
  deepCopy(nodeSource: vtkOBBNode): void;

  /**
   * Get the three axes of the box.
   */
  getAxes(): OBBAxes;

  /**
   * Get the three axes of the box.
   */
  getAxesByReference(): OBBAxes;

  /**
   * Get one of the three axes of the box.
   * @param {Number} axis 0 for the longest axis, 2 for the shortest
   */
  getAxis(axis: number): Vector3;

  /**
   * Get the ids of the cells contained in this node.
   */
  getCells(): number[];

  /**
   * Get the corner of the box the axes originate from.
   */
  getCorner(): Vector3;

  /**
   * Get the corner of the box the axes originate from.
   */
  getCornerByReference(): Vector3;

  /**
   * Get the two children of this node, or null when it is a leaf.
   */
  getKids(): Nullable<[vtkOBBNode, vtkOBBNode]>;

  /**
   * Get the parent of this node, or null when it is the root.
   */
  getParent(): Nullable<vtkOBBNode>;

  /**
   * Set the three axes of the box.
   * @param {OBBAxes} axes
   */
  setAxes(axes: OBBAxes): boolean;

  /**
   * Set the three axes of the box.
   * @param {OBBAxes} axes
   */
  setAxesFrom(axes: OBBAxes): void;

  /**
   * Set the ids of the cells contained in this node.
   * @param {Number[]} cells
   */
  setCells(cells: number[]): boolean;

  /**
   * Set the corner of the box the axes originate from.
   * @param {Vector3} corner
   */
  setCorner(corner: Vector3): boolean;

  /**
   * Set the corner of the box the axes originate from.
   * @param {Number} x
   * @param {Number} y
   * @param {Number} z
   */
  setCorner(x: number, y: number, z: number): boolean;

  /**
   * Set the corner of the box the axes originate from.
   * @param {Vector3} corner
   */
  setCornerFrom(corner: Vector3): void;

  /**
   * Set the two children of this node.
   * @param {[vtkOBBNode, vtkOBBNode]} kids
   */
  setKids(kids: Nullable<[vtkOBBNode, vtkOBBNode]>): boolean;

  /**
   * Set the parent of this node.
   * @param {vtkOBBNode} parent
   */
  setParent(parent: Nullable<vtkOBBNode>): boolean;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkOBBNode characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOBBNodeInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IOBBNodeInitialValues
): void;

/**
 * Method used to create a new instance of vtkOBBNode
 * @param {IOBBNodeInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IOBBNodeInitialValues): vtkOBBNode;

/**
 * vtkOBBNode - a node of an oriented bounding box tree
 *
 * vtkOBBNode holds one oriented bounding box of a vtkOBBTree: the corner the
 * box originates from, its three axes ordered from longest to shortest, the
 * cells it contains, and the two children it was split into.
 */
export declare const vtkOBBNode: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkOBBNode;
