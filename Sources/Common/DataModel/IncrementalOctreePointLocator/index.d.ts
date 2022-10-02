import { vtkObject } from "../../../interfaces";
import vtkPoints from "../../Core/Points";
import vtkIncrementalOctreeNode from "../IncrementalOctreeNode";
import { IAbstractPointLocatorInitialValues } from "../AbstractPointLocator";

/**
 *
 */
export interface IIncrementalOctreePointLocatorInitialValues
	extends IAbstractPointLocatorInitialValues {
	fudgeFactor: number;
	octreeMaxDimSize: number;
	buildCubicOctree: boolean;
	maxPointsPerLeaf: number;
	insertTolerance2: number;
	locatorPoints: vtkPoints;
	octreeRootNode: vtkIncrementalOctreeNode;
	numberOfNodes: number;
}

type vtkIncrementalOctreePointLocatorBase = vtkObject;

export interface vtkIncrementalOctreePointLocator
	extends vtkIncrementalOctreePointLocatorBase {}

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
