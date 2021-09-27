import { vtkObject } from "../../../interfaces" ;
import { Bounds } from "../../../types";

export enum SelectionContent {
	GLOBALIDS,
	PEDIGREEIDS,
	VALUES,
	INDICES,
	FRUSTUM,
	LOCATIONS,
	THRESHOLDS,
	BLOCKS,
	QUERY,
}

export enum SelectionField {
	CELL,
	POINT,
	FIELD,
	VERTEX,
	EDGE,
	ROW,
}

export interface ISelectionNodeInitialValues {}

export interface vtkSelectionNode extends vtkObject {
	
	/**
	 * 
	 */
	getBounds(): Bounds;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkSelectionNode characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ISelectionNodeInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: ISelectionNodeInitialValues): void;

/**
 * Method used to create a new instance of vtkSelectionNode.
 * @param {ISelectionNodeInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: ISelectionNodeInitialValues): vtkSelectionNode;

/**
 * vtkSelectionNode represents a 2D n-sided polygon.
 * 
 * The polygons cannot have any internal holes, and cannot self-intersect.
 * Define the polygon with n-points ordered in the counter-clockwise direction.
 * Do not repeat the last point.
 */
export declare const vtkSelectionNode: {
	newInstance: typeof newInstance,
	extend: typeof extend;
};
export default vtkSelectionNode;
