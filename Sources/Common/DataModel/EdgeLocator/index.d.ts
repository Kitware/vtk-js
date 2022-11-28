import { Nullable } from "../../../types";

/**
 *
 */
export interface IEdgeLocatorInitialValues {
	oriented?: boolean;
}

export interface IEdge<T = unknown> {
	key: number;
	edgeId: number;
	value?: T;
}

export interface vtkEdgeLocator {
	/**
	 * Remove all the edges previously added.
	 */
	 initialize(): void;

	/**
	 * Returns the inserted edge or null if no edge was inserted.
	 * @param {Number} pointId0 Edge first point id
	 * @param {Number} pointId1 Edge last point id
	 * @return {IEdge|null} an edge object ({ key, edgeId, value }) or null
	 */
	isInsertedEdge<T = unknown>(pointId0: number, pointId1: number): Nullable<IEdge<T>>;

	/**
	 * Insert edge if it does not already exist.
	 * Returns the existing or newly inserted edge.
	 *
	 * @param {Number} pointId0 Edge first point id
	 * @param {Number} pointId1 Edge last point id
	 * @param {unknown} value Optional value option
	 * @return {IEdge|null} an edge object ({ key, edgeId, value }) or null
	 * @see insertEdge()
	 * @see isInsertedEdge()
	 */
	insertUniqueEdge<T>(pointId0: number, pointId1: number, value?: T): IEdge<T>;

	/**
	 * Insert edge. If the edge already exists, it is overwritten by this
	 * new edge. You may verify that the edge did not previously exist with
	 * `isInsertedEdge()`.
	 * Returns the newly inserted edge.
	 * @param {Number} pointId0 Edge first point id
	 * @param {Number} pointId1 Edge last point id
	 * @param {unknown} value Optional value option
	 * @return {Edge|null} an edge object ({ key, edgeId, value }) or null
	 * @see isInsertedEdge
	 * @see insertUniqueEdge
	 */
	insertEdge<T>(pointId0: number, pointId1: number, value?: T): IEdge<T>;
}

// ----------------------------------------------------------------------------
// Static API
// ----------------------------------------------------------------------------

// ----------------------------------------------------------------------------

/**
 * Method use to create a new instance of vtkEdgeLocator
 * @param {IEdgeLocatorInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(
	initialValues?: IEdgeLocatorInitialValues
): vtkEdgeLocator;

/**
 * vtkEdgeLocator
 */
export declare const vtkEdgeLocator: {
	newInstance: typeof newInstance;
};

export default vtkEdgeLocator;
