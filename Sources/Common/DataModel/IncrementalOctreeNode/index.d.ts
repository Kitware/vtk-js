import { vtkObject } from "../../../interfaces";
import { Bounds, Vector3 } from "../../../types";
import vtkPoints from "../../Core/Points";
/**
 *
 */
export interface IIncrementalOctreeNodeInitialValues {
	pointIdSet?: number[];
	minBounds?: Bounds;
	maxBounds?: Bounds;
	minDataBounds?: Bounds;
	maxDataBounds?: Bounds;
	parent?: vtkIncrementalOctreeNode;
	children?: vtkIncrementalOctreeNode[];
}

export interface vtkIncrementalOctreeNode extends vtkObject {
	/**
	 * Create a list object for storing point indices.
	 */
	createPointIdSet(): void;

	/**
	 * Set the spatial bounding box of the node. This function sets a default
	 * data bounding box.
	 *
	 * @param {Number} x1
	 * @param {Number} x2
	 * @param {Number} y1
	 * @param {Number} y2
	 * @param {Number} z1
	 * @param {Number} z2
	 */
	setBounds(
		x1: number,
		x2: number,
		y1: number,
		y2: number,
		z1: number,
		z2: number
	): void;

	/**
	 * Get the spatial bounding box of the node. The values are returned via
	 * an array in order of: x_min, x_max, y_min, y_max, z_min, z_max.
	 *
	 * @param {Bounds} bounds
	 */
	getBounds(bounds: Bounds): void;

	/**
	 * @param {Vector3} point
	 */
	getChildIndex(point: Vector3): number;
	
	/**
	 * @param {Vector3} point
	 */
	containsPoint(point: Vector3): boolean;
	
	/**
	 * @param {Vector3} point
	 */
	containsPointByData(point: Vector3): boolean;

	/**
	 * Given a point inserted to either this node (a leaf node) or a descendant
	 * leaf (of this node --- when this node is a non-leaf node), update the
	 * counter and the data bounding box for this node only. The data bounding box
	 * is considered only if updateData is non-zero. The returned value indicates
	 * whether (1) or not (0) the data bounding box is actually updated. Note that
	 * argument nHits must be 1 unless this node is updated with a number (nHits)
	 * of exactly duplicate points as a whole via a single call to this function.
	 *
	 * @param {Vector3} point
	 * @param {Number} nHits
	 * @param {Boolean} updateData
	 */
	updateCounterAndDataBounds(
		point: Vector3,
		nHits: number,
		updateData: boolean
	): boolean;

	/**
	 * Given a point inserted to either this node (a leaf node) or a descendant
	 * leaf (of this node --- when this node is a non-leaf node), update the
	 * counter and the data bounding box recursively bottom-up until a specified
	 * node. The data bounding box is considered only if updateData is non-zero.
	 * The returned value indicates whether (true) or not (false) the data bounding box
	 * is actually updated. Note that argument nHits must be 1 unless this node
	 * is updated with a number (nHits) of exactly duplicate points as a whole
	 * via a single call to this function.
	 *
	 * @param {Vector3} point
	 * @param {Number} nHits
	 * @param {Boolean} updateData
	 * @param {vtkIncrementalOctreeNode} endNode
	 */
	updateCounterAndDataBoundsRecursively(
		point: Vector3,
		nHits: number,
		updateData: boolean,
		endNode: vtkIncrementalOctreeNode
	): boolean;

	/**
	 * Given a point, determine whether (true) or not (false) it is an exact duplicate
	 * of all the points, if any, maintained in this node. In other words, to
	 * check if this given point and all existing points, if any, of this node
	 * are exactly duplicate with one another.
	 *
	 * @param {Vector3} point
	 */
	containsDuplicatePointsOnly(point: Vector3): boolean;

	/**
	 * Determine whether or not this node is a leaf.
	 */
	isLeaf(): boolean;

	/**
	 * Get the child at the given index i.
	 * i must be an int between 0 and 7.
	 *
	 * @param {Number} i
	 */
	getChild(i: number): vtkIncrementalOctreeNode;

	/**
	 * Given a number (>= threshold) of all exactly duplicate points (accessible
	 * via points and pntIds, but with exactly the same 3D coordinate) maintained
	 * in this leaf node and a point (absolutely not a duplicate any more, with
	 * pntIdx storing the index in points)) to be inserted to this node, separate
	 * all the duplicate points from this new point by means of usually recursive
	 * node sub-division such that the former points are inserted to a descendant
	 * leaf while the new point is inserted to a sibling of this descendant leaf.
	 * Argument ptMode specifies whether the point is not inserted at all but only
	 * the point index is provided upon 0, the point is inserted via vtkPoints::
	 * InsertPoint() upon 1, or this point is instead inserted through vtkPoints::
	 * InsertNextPoint() upon 2.
	 *
	 * @param {vtkPoints} points
	 * @param {Number[]} pntIds
	 * @param {Vector3} newPnt
	 * @param {Number} pntIdx
	 * @param {Number} maxPts
	 * @param {Number} ptMode
	 */
	separateExactlyDuplicatePointsFromNewInsertion(
		points: vtkPoints,
		pntIds: number[],
		newPnt: Vector3,
		pntIdx: number,
		maxPts: number,
		ptMode: number
	): void;

	/**
	 * Divide this LEAF node into eight child nodes as the number of points
	 * maintained by this leaf node has reached the threshold maxPts while
	 * another point newPnt is just going to be inserted to it. The available
	 * point-indices pntIds are distributed to the child nodes based on the
	 * point coordinates (available through points). Note that this function
	 * can incur recursive node-division to determine the specific leaf node
	 * for accepting the new point (with pntIdx storing the index in points)
	 * because the existing maxPts points may fall within only one of the eight
	 * child nodes to make a radically imbalanced layout within the node (to
	 * be divided). Argument ptMode specifies whether the point is not inserted
	 * at all but instead only the point index is provided upon 0, the point is
	 * inserted via vtkPoints.InsertPoint() upon 1, or the point is inserted by
	 * vtkPoints.InsertNextPoint() upon 2. The returned value of this function
	 * indicates whether pntIds needs to be destroyed (1) or just unregistered
	 * from this node as it has been attached to another node (0).
	 * numberOfNodes in the tree is updated with new created nodes
	 *
	 * @param {vtkPoints} points
	 * @param {Number[]} pntIds
	 * @param {Vector3} newPnt
	 * @param {Number} pntIdx
	 * @param {Number} maxPts
	 * @param {Number} ptMode
	 * @param {Number} numberOfNodes
	 */
	createChildNodes(
		points: vtkPoints,
		pntIds: number[],
		newPnt: Vector3,
		pntIdx: number,
		maxPts: number,
		ptMode: number,
		numberOfNodes: number
	): { success: boolean; numberOfNodes: number; pointIdx: number };

	/**
	 * This function is called after a successful point-insertion check and
	 * only applies to a leaf node. Prior to a call to this function, the
	 * octree should have been retrieved top-down to find the specific leaf
	 * node in which this new point (newPt) will be inserted. The actual index
	 * of the new point (to be inserted to points) is stored in pntId. Argument
	 * ptMode specifies whether the point is not inserted at all but instead only
	 * the point index is provided upon 0, the point is inserted via vtkPoints.
	 * insertPoint() upon 1, or it is inserted via vtkPoints.insertNextPoint()
	 * upon 2. For case 0, pntId needs to be specified. For cases 1 and 2, the
	 * actual point index is returned via pntId. Note that this function always
	 * returns 1 to indicate the success of point insertion.
	 * numberOfNodes is the number of nodes present in the tree at this time.
	 * it is used to assign an ID to each node which can be used to associate
	 * application specific information with each node. It is updated if new nodes
	 * are added to the tree.
	 *
	 * @param {Number} points
	 * @param {Number} newPnt
	 * @param {Number} maxPts
	 * @param {Number} pntId
	 * @param {Number} ptMode
	 * @param {Number} numberOfNodes
	 */
	insertPoint(
		points: number,
		newPnt: number,
		maxPts: number,
		pntId: number,
		ptMode: number,
		numberOfNodes: number
	): { numberOfNodes: number; pointIdx: number };

	/**
	 * Compute the minimum squared distance from a point to this node, with all
	 * six boundaries considered. The data bounding box is checked if checkData
	 * is non-zero. The closest on-boundary point is returned via closest.
	 *
	 * @param {Vector3} point
	 * @param {Vector3} closest
	 * @param {Boolean} innerOnly
	 * @param {vtkIncrementalOctreeNode} rootNode
	 * @param {Boolean} checkData
	 * @returns {Number}
	 */
	getDistance2ToBoundary(
		point: Vector3,
		closest: Vector3,
		innerOnly: boolean,
		rootNode: vtkIncrementalOctreeNode,
		checkData: boolean
	): number;

	/**
	 * Given a point inside this node, get the minimum squared distance to all
	 * inner boundaries. An inner boundary is a node's face that is shared by
	 * another non-root node.
	 *
	 * @param {Vector3} point
	 * @param {vtkIncrementalOctreeNode} rootNode
	 */
	getDistance2ToInnerBoundary(
		point: Vector3,
		rootNode: vtkIncrementalOctreeNode
	): number;
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

/**
 * Method use to decorate a given object (publicAPI+model) with vtkIncrementalOctreeNode characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {object} [initialValues] (default: {})
 */
export function extend(
	publicAPI: object,
	model: object,
	initialValues?: object
): void;

// ----------------------------------------------------------------------------

/**
 * Method use to create a new instance of vtkIncrementalOctreeNode
 * @param {IIncrementalOctreeNodeInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
	initialValues?: IIncrementalOctreeNodeInitialValues
): vtkIncrementalOctreeNode;

/**
 * vtkIncrementalOctreeNode
 */
export declare const vtkIncrementalOctreeNode: {
	newInstance: typeof newInstance;
	extend: typeof extend;
};

export default vtkIncrementalOctreeNode;
