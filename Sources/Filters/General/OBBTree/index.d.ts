import { mat4 } from 'gl-matrix';
import vtkMatrixBuilder from '../../../Common/Core/MatrixBuilder';
import vtkPolyData from '../../../Common/DataModel/PolyData';
import { vtkObject } from '../../../interfaces';
import { Nullable, Vector3 } from '../../../types';
import vtkOBBNode from './OBBNode';

type Transform = ReturnType<typeof vtkMatrixBuilder.buildFromRadian>;

/**
 * Called for every pair of intersecting leaf nodes found by intersectWithOBBTree.
 * Returning a negative number stops the traversal.
 */
export type OnIntersectCallback = (
  nodeA: vtkOBBNode,
  nodeB: vtkOBBNode,
  XformBtoA: Nullable<mat4>
) => number;

/**
 * Accumulator handed to findTriangleIntersections.
 */
export interface ITriangleIntersectionInfo {
  /**
   * The tree the triangles of the second node belong to.
   */
  obbTree1: vtkOBBTree;
  /**
   * Polydata the intersection points and lines are appended to.
   */
  intersectionLines: vtkPolyData;
}

/**
 *
 */
export interface IOBBTreeInitialValues {
  tolerance?: number;
  automatic?: boolean;
  numberOfCellsPerNode?: number;
  dataset?: vtkPolyData;
  tree?: vtkOBBNode;
  level?: number;
  maxLevel?: number;
  retainCellLists?: number;
}

export interface vtkOBBTree extends vtkObject {
  /**
   * Build the OBB tree of the current dataset. The tree is discarded and
   * rebuilt on every call.
   */
  buildLocator(): void;

  /**
   * Compute the oriented bounding box of a dataset without building a tree.
   * The results are written into the arrays passed in.
   * @param {vtkPolyData} input
   * @param {Vector3} corner corner the axes originate from
   * @param {Vector3} max longest axis
   * @param {Vector3} mid middle axis
   * @param {Vector3} min shortest axis
   * @param {Vector3} size extent of the box along each axis
   */
  computeOBBFromDataset(
    input: vtkPolyData,
    corner: Vector3,
    max: Vector3,
    mid: Vector3,
    min: Vector3,
    size: Vector3
  ): void;

  /**
   * Copy the settings and the tree of another OBB tree into this one.
   * @param {vtkOBBTree} tree
   */
  deepCopy(tree: vtkOBBTree): void;

  /**
   * Test whether two nodes are disjoint, `nodeB` being optionally transformed
   * into the space of `nodeA` by `XformBtoA`. Returns 0 when the boxes overlap
   * and the number of the separating axis test that succeeded otherwise.
   * @param {vtkOBBNode} nodeA
   * @param {vtkOBBNode} nodeB
   * @param {mat4} [XformBtoA] assumed to be orthogonal
   */
  disjointOBBNodes(
    nodeA: Nullable<vtkOBBNode>,
    nodeB: Nullable<vtkOBBNode>,
    XformBtoA?: Nullable<mat4>
  ): number;

  /**
   * Intersect the triangles of two leaf nodes and append the resulting
   * segments to `info.intersectionLines`. Returns the number of intersection
   * lines found.
   * @param {ITriangleIntersectionInfo} info
   * @param {vtkOBBNode} node0 leaf of this tree
   * @param {vtkOBBNode} node1 leaf of `info.obbTree1`
   * @param {mat4} [transform]
   */
  findTriangleIntersections(
    info: ITriangleIntersectionInfo,
    node0: vtkOBBNode,
    node1: vtkOBBNode,
    transform?: Nullable<mat4>
  ): number;

  /**
   * Create a polygonal representation of the boxes at the given level. When
   * `level` is negative the leaf nodes are gathered instead. Returns null when
   * the tree has not been built.
   * @param {Number} level
   */
  generateRepresentation(level: number): Nullable<vtkPolyData>;

  /**
   * Get whether the number of cells per node is computed from the dataset.
   */
  getAutomatic(): boolean;

  /**
   * Get the dataset the tree is built from.
   */
  getDataset(): Nullable<vtkPolyData>;

  /**
   * Get the depth reached by the last call to buildLocator.
   */
  getLevel(): number;

  /**
   * Get the maximum depth of the tree.
   */
  getMaxLevel(): number;

  /**
   * Get the number of cells below which a node is not split any further.
   */
  getNumberOfCellsPerNode(): number;

  /**
   * Get whether the cell lists of the non-leaf nodes are kept.
   */
  getRetainCellLists(): number;

  /**
   * Get the tolerance used by the separating axis tests.
   */
  getTolerance(): number;

  /**
   * Get the root node of the tree.
   */
  getTree(): Nullable<vtkOBBNode>;

  /**
   * Traverse this tree against `obbTreeB` and call `onIntersect` for every pair
   * of intersecting leaf nodes. `obbTreeB` is optionally transformed into the
   * space of this tree by `XformBtoA`. Returns the accumulated absolute value
   * of the callback results.
   * @param {vtkOBBTree} obbTreeB
   * @param {mat4} [XformBtoA]
   * @param {OnIntersectCallback} [onIntersect] (default: () => -1)
   */
  intersectWithOBBTree(
    obbTreeB: vtkOBBTree,
    XformBtoA?: Nullable<mat4>,
    onIntersect?: OnIntersectCallback
  ): number;

  /**
   * Set whether the number of cells per node is computed from the dataset.
   * @param {Boolean} automatic
   */
  setAutomatic(automatic: boolean): boolean;

  /**
   * Set the dataset the tree is built from.
   * @param {vtkPolyData} dataset
   */
  setDataset(dataset: vtkPolyData): boolean;

  /**
   * Set the depth of the tree.
   * @param {Number} level
   */
  setLevel(level: number): boolean;

  /**
   * Set the maximum depth of the tree.
   * @param {Number} maxLevel
   */
  setMaxLevel(maxLevel: number): boolean;

  /**
   * Set the number of cells below which a node is not split any further.
   * @param {Number} numberOfCellsPerNode
   */
  setNumberOfCellsPerNode(numberOfCellsPerNode: number): boolean;

  /**
   * Set whether the cell lists of the non-leaf nodes are kept.
   * @param {Number} retainCellLists
   */
  setRetainCellLists(retainCellLists: number): boolean;

  /**
   * Set the tolerance used by the separating axis tests.
   * @param {Number} tolerance
   */
  setTolerance(tolerance: number): boolean;

  /**
   * Set the root node of the tree.
   * @param {vtkOBBNode} tree
   */
  setTree(tree: Nullable<vtkOBBNode>): boolean;

  /**
   * Test whether a triangle intersects a node, the triangle being optionally
   * transformed into the space of the node by `XformBtoA`. Returns 1 when they
   * overlap and 0 otherwise.
   * @param {vtkOBBNode} nodeA
   * @param {Vector3} p0
   * @param {Vector3} p1
   * @param {Vector3} p2
   * @param {mat4} [XformBtoA] assumed to be orthogonal
   */
  triangleIntersectsNode(
    nodeA: vtkOBBNode,
    p0: Vector3,
    p1: Vector3,
    p2: Vector3,
    XformBtoA?: Nullable<mat4>
  ): number;

  /**
   * Apply a transform to every node of the tree in place.
   * @param {Transform} transform a vtkMatrixBuilder transform
   */
  transform(transform: Transform): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkOBBTree characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IOBBTreeInitialValues} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IOBBTreeInitialValues
): void;

/**
 * Method used to create a new instance of vtkOBBTree
 * @param {IOBBTreeInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IOBBTreeInitialValues): vtkOBBTree;

/**
 * vtkOBBTree - generate an oriented bounding box hierarchy for a dataset
 *
 * vtkOBBTree builds a tree of oriented bounding boxes over the cells of a
 * vtkPolyData. Each node holds the box of a subset of the cells, split in two
 * along its longest axis until the leaves hold no more than
 * numberOfCellsPerNode cells or the maximum level is reached. The tree can then
 * be tested against another OBB tree to find intersecting cells.
 */
export declare const vtkOBBTree: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};
export default vtkOBBTree;
