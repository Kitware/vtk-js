import { vtkObject } from "../../../interfaces" ;

/**
 *
 */
export interface IPriorityQueueInitialValues {
	elements?: Array<any>;
}

export interface vtkPriorityQueue extends vtkObject {

	/**
	 * Push an element to the queue while defining a priority.
	 * @param {Number} priority The priority of the element.
	 * @param element 
	 */
	push(priority: number, element: any): void;

	/**
	 * 
	 */
	pop(): any | null;

	/**
	 * Delete an element from the queue by its ID.
	 * @param {Number} id The id of the element.
	 */
	deleteById(id: number): void;

	/**
	 * Get the length of the queue.
	 */
	length(): number;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkPriorityQueue characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {IPriorityQueueInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues?: IPriorityQueueInitialValues): void;

/**
 * Method used to create a new instance of vtkPriorityQueue
 * @param {IPriorityQueueInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues?: IPriorityQueueInitialValues): vtkPriorityQueue;


/**
 * vtkPriorityQueue is a general object for creating and manipulating lists of
 * object ids (e.g., point or cell ids). Object ids are sorted according to a
 * user-specified priority, where entries at the top of the queue have the
 * smallest values.
 */
export declare const vtkPriorityQueue: {
	newInstance: typeof newInstance;
	extend: typeof extend;
}
export default vtkPriorityQueue;
