import { Bounds, Nullable, Vector3 } from '../../../types';
import vtkPoints from '../../Core/Points';
import vtkIncrementalOctreeNode from '../IncrementalOctreeNode';
import vtkAbstractPointLocator, {
  IAbstractPointLocatorInitialValues,
} from '../AbstractPointLocator';

/**
 *
 */
export interface IIncrementalOctreePointLocatorInitialValues extends IAbstractPointLocatorInitialValues {
  fudgeFactor?: number;
  octreeMaxDimSize?: number;
  buildCubicOctree?: boolean;
  maxPointsPerLeaf?: number;
  insertTolerance2?: number;
  locatorPoints?: vtkPoints;
  octreeRootNode?: vtkIncrementalOctreeNode;
  numberOfNodes?: number;
}

/**
 * A point index paired with the squared distance to the query point. The index
 * is -1 when no point was found.
 */
export type PointIdAndDistance2 = [number, number];

/**
 * The index of an already inserted point (-1 when the point is new) together
 * with the leaf node that does or would contain it.
 */
export interface IInsertedPointResult {
  pointIdx: number;
  leafContainer: vtkIncrementalOctreeNode;
}

export interface IInsertUniquePointResult {
  success: boolean;
  idx: number;
}

type vtkIncrementalOctreePointLocatorBase = vtkAbstractPointLocator;

export interface vtkIncrementalOctreePointLocator extends vtkIncrementalOctreePointLocatorBase {
  /**
   * Delete the octree search structure and release the points being located.
   */
  freeSearchStructure(): void;

  /**
   * Given a leaf node, find the closest point it stores to the given point.
   *
   * @param {vtkIncrementalOctreeNode} leafNode
   * @param {Vector3} point
   * @returns {PointIdAndDistance2}
   */
  findClosestPointInLeafNode(
    leafNode: vtkIncrementalOctreeNode,
    point: Vector3
  ): PointIdAndDistance2;

  /**
   * Find the closest point within a squared radius of the given point, skipping
   * maskNode. refDist2 bounds the sub-trees that are worth descending into.
   *
   * @param {Vector3} point
   * @param {Number} radius2 the squared search radius
   * @param {vtkIncrementalOctreeNode} maskNode a node to exclude from the search
   * @param {Number} minDist2 the initial upper bound on the squared distance;
   * the search stops descending once it cannot improve on it
   * @param {Number} refDist2
   * @returns {PointIdAndDistance2}
   */
  findClosestPointInSphere(
    point: Vector3,
    radius2: number,
    maskNode: vtkIncrementalOctreeNode,
    minDist2: number,
    refDist2: number
  ): PointIdAndDistance2;

  /**
   * Same as findClosestPointInSphere, using the octree extent as the reference
   * distance.
   *
   * @param {Vector3} point
   * @param {Number} radius2 the squared search radius
   * @param {vtkIncrementalOctreeNode} maskNode a node to exclude from the search
   * @returns {PointIdAndDistance2}
   */
  findClosestPointInSphereWithTolerance(
    point: Vector3,
    radius2: number,
    maskNode: vtkIncrementalOctreeNode
  ): PointIdAndDistance2;

  /**
   * Find, in a leaf node, a point with exactly the same coordinates as the
   * given one, reading the locator points as 32-bit floats.
   *
   * @param {vtkIncrementalOctreeNode} leafNode
   * @param {Vector3} point
   * @returns {Number} the point index, or -1 when there is no duplicate
   */
  findDuplicateFloatTypePointInVisitedLeafNode(
    leafNode: vtkIncrementalOctreeNode,
    point: Vector3
  ): number;

  /**
   * Find, in a leaf node, a point with exactly the same coordinates as the
   * given one, reading the locator points as 64-bit floats.
   *
   * @param {vtkIncrementalOctreeNode} leafNode
   * @param {Vector3} point
   * @returns {Number} the point index, or -1 when there is no duplicate
   */
  findDuplicateDoubleTypePointInVisitedLeafNode(
    leafNode: vtkIncrementalOctreeNode,
    point: Vector3
  ): number;

  /**
   * Find, in a leaf node, a point with exactly the same coordinates as the
   * given one, dispatching on the data type of the locator points.
   *
   * @param {vtkIncrementalOctreeNode} leafNode
   * @param {Vector3} point
   * @returns {Number} the point index, or -1 when there is no duplicate
   */
  findDuplicatePointInLeafNode(
    leafNode: vtkIncrementalOctreeNode,
    point: Vector3
  ): number;

  /**
   * Initialize the octree with an empty root node covering the given bounds and
   * take ownership of the points object used for insertion.
   *
   * @param {vtkPoints} points
   * @param {Bounds} bounds
   * @param {Number} [estNumPts] (default: 0)
   * @returns {Boolean} false when no valid points object was given
   */
  initPointInsertion(
    points: vtkPoints,
    bounds: Bounds,
    estNumPts?: number
  ): boolean;

  /**
   * Insert a point at the given index, without checking for duplicates.
   * initPointInsertion must have been called first.
   *
   * @param {Number} ptId
   * @param {Vector3} x
   */
  insertPoint(ptId: number, x: Vector3): void;

  /**
   * Append a point, without checking for duplicates. initPointInsertion must
   * have been called first.
   *
   * @param {Vector3} x
   * @returns {Number} the index of the inserted point
   */
  insertNextPoint(x: Vector3): number;

  /**
   * Insert a point only if no point already lies within the insertion
   * tolerance of it.
   *
   * @param {Vector3} point
   * @returns {IInsertUniquePointResult} success is false when a point was
   * already there, in which case idx is that existing point's index
   */
  insertUniquePoint(point: Vector3): IInsertUniquePointResult;

  /**
   * Determine whether a point is already present, dispatching on whether the
   * insertion tolerance is zero.
   *
   * @param {Vector3} x
   * @returns {IInsertedPointResult}
   */
  isInsertedPoint(
    x: Vector3,
    leafContainer?: vtkIncrementalOctreeNode
  ): IInsertedPointResult;

  /**
   * Determine whether a point with exactly these coordinates is already
   * present in the leaf node that contains it.
   *
   * @param {Vector3} x
   * @returns {IInsertedPointResult}
   */
  isInsertedPointForZeroTolerance(x: Vector3): IInsertedPointResult;

  /**
   * Determine whether a point lies within the insertion tolerance of an
   * already inserted point.
   *
   * @param {Vector3} x
   * @returns {IInsertedPointResult}
   */
  isInsertedPointForNonZeroTolerance(x: Vector3): IInsertedPointResult;

  /**
   * Get whether the octree root is inflated to a cube so that every octant is
   * a cube too.
   * @default false
   */
  getBuildCubicOctree(): boolean;

  /**
   * Get the padding applied to the lower bounds of the octree root.
   * @default 0
   */
  getFudgeFactor(): number;

  /**
   * Get the squared insertion tolerance, i.e. the square of the tolerance.
   * @default 0.000001
   */
  getInsertTolerance2(): number;

  /**
   * Get the points into which insertion writes.
   */
  getLocatorPoints(): Nullable<vtkPoints>;

  /**
   * Get the maximum number of points a leaf node may hold before it is
   * sub-divided.
   * @default 128
   */
  getMaxPointsPerLeaf(): number;

  /**
   * Get the number of nodes currently in the octree.
   * @default 0
   */
  getNumberOfNodes(): number;

  /**
   * Get the largest side length of the octree root node.
   * @default 0
   */
  getOctreeMaxDimSize(): number;

  /**
   * Get the root node of the octree.
   */
  getOctreeRootNode(): Nullable<vtkIncrementalOctreeNode>;

  /**
   * Set whether the octree root is inflated to a cube so that every octant is
   * a cube too. Must be set before initPointInsertion.
   *
   * @param {Boolean} buildCubicOctree
   */
  setBuildCubicOctree(buildCubicOctree: boolean): boolean;

  /**
   * Set the padding applied to the lower bounds of the octree root.
   *
   * @param {Number} fudgeFactor
   */
  setFudgeFactor(fudgeFactor: number): boolean;

  /**
   * Set the squared insertion tolerance. initPointInsertion recomputes it from
   * the locator tolerance.
   *
   * @param {Number} insertTolerance2
   */
  setInsertTolerance2(insertTolerance2: number): boolean;

  /**
   * Set the points into which insertion writes.
   *
   * @param {vtkPoints} locatorPoints
   */
  setLocatorPoints(locatorPoints: vtkPoints): boolean;

  /**
   * Set the maximum number of points a leaf node may hold before it is
   * sub-divided.
   *
   * @param {Number} maxPointsPerLeaf
   */
  setMaxPointsPerLeaf(maxPointsPerLeaf: number): boolean;

  /**
   * Set the number of nodes in the octree.
   *
   * @param {Number} numberOfNodes
   */
  setNumberOfNodes(numberOfNodes: number): boolean;

  /**
   * Set the largest side length of the octree root node.
   *
   * @param {Number} octreeMaxDimSize
   */
  setOctreeMaxDimSize(octreeMaxDimSize: number): boolean;

  /**
   * Set the root node of the octree.
   *
   * @param {vtkIncrementalOctreeNode} octreeRootNode
   */
  setOctreeRootNode(octreeRootNode: vtkIncrementalOctreeNode): boolean;
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

/**
 * Method use to decorate a given object (publicAPI+model) with vtkIncrementalOctreePointLocator characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {object} [initialValues] (default: {})
 */
export function extend(
  publicAPI: object,
  model: object,
  initialValues?: IIncrementalOctreePointLocatorInitialValues
): void;

// ----------------------------------------------------------------------------

/**
 * Method use to create a new instance of vtkIncrementalOctreePointLocator
 * @param {IIncrementalOctreePointLocatorInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
  initialValues?: IIncrementalOctreePointLocatorInitialValues
): vtkIncrementalOctreePointLocator;

/**
 * vtkIncrementalOctreePointLocator
 */
export declare const vtkIncrementalOctreePointLocator: {
  newInstance: typeof newInstance;
  extend: typeof extend;
};

export default vtkIncrementalOctreePointLocator;
