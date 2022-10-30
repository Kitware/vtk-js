/**
 *
 */
export interface IEdgeLocatorInitialValues {
	oriented?: boolean;
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
	 * @return {key, edgeId, value} or null
	 */
	isInsertedEdge(pointId0: number, pointId1: number): { key: any; edgeId: number; value?: any } | null;

	/**
	 * Insert edge if it does not already exist.
	 * Returns the existing or newly inserted edge.
	 *
	 * @param {Number} pointId0 Edge first point id
	 * @param {Number} pointId1 Edge last point id
	 * @param {any} value Optional value option
	 * @return {key, edgeId, value}
	 * @see insertEdge()
	 * @see isInsertedEdge()
	 */
	insertUniqueEdge(
		pointId0: number,
		pointId1: number,
		value?: any
	): { key: any; edgeId: number; value?: any };

	/**
	 * Insert edge. If the edge already exists, it is overwritten by this
	 * new edge. You may verify that the edge did not previously exist with
	 * `isInsertedEdge()`.
	 * Returns the newly inserted edge.
	 * @param {Number} pointId0 Edge first point id
	 * @param {Number} pointId1 Edge last point id
	 * @param {any} value Optional value option
	 * @return {key, edgeId, value} or null
	 * @see isInsertedEdge
	 * @see insertUniqueEdge
	 */
	insertEdge(pointId0: number,
		pointId1: number,
		value?: any
	): { key: any; edgeId: number; value?: any };
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
