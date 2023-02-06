import { vtkObject } from "../../../interfaces";
import { Nullable } from "../../../types";

/**
 *
 */
export interface ICollectionInitialValues {
	collection?: vtkObject[];
}


export interface vtkCollection extends vtkObject {

	/**
	 * Add item (vtkObject) to the collection
	 * @param {vtkObject} item item to be added to the collection
	 */
  	addItem(item: vtkObject): void;

	/**
	 * Add item (vtkObject) to the collection _at_ the given index.
	 * This differs from VTK-C++ where insertItem inserts at position
	 * after the provided index value.
	 * @param {number} idx index where the new item should be inserted.
	 * @param {vtkObject} item item to be inserted
	 */
	insertItem(idx: number, item: vtkObject): void;

	/**
	 * Replace an existing item (vtkObject) with a new one
	 * @param {number} idx index of item to be replaced
	 * @param {vtkObject} item
	 */
	replaceItem(idx: number, item: vtkObject): void;

	/**
	 * Remove an existing item from the collection
	 * @param {number|vtkObject} inValue index or reference of an item to be removed
	 */
	removeItem(inValue: number|vtkObject): void;

	/**
	 * Remove all items from the collection
	 */
	removeAllItems(): void;

	/**
	 * Check if a provided item is already present in the collection
	 */
	isItemPresent(item: vtkObject): boolean;

	/**
	 * Get the total number of items in the collection
	 */
	getNumberOfItems(): number;

	/**
	 * Check if the collection is empty
	 */
	empty(): boolean;

	/**
	 * get the current item and provided index, returns null if index is out of bounds
	 */
	getItem(idx: number): Nullable<vtkObject>;

	/**
	 * Execute a passed function on every item in the collection
	 * @param callbackfn callback function to be executed on every item in the collection
	 */
	forEach<T>(callbackfn: (value: T, index: number, array: readonly T[]) => void): void;

	/**
	 * Execute a passed function on every item in the collection, in order to calculate an aggregated return value.
	 * @param callbackfn callback function to be used for aggregating a single value from each item in the collection
	 * @param initialValue starting value to calculate aggregation
	 */
	reduce<T>(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: readonly T[]) => T, initialValue: T): T;

	/**
	 * Similar to forEach, but returns an array of resulting values.
	 * @param callbackfn callback function to execute on each item in the collection, that returns a value.
	 */
	map<T>(callbackfn: (value: T, index: number, array: readonly T[]) => void): void;

	/**
	 * Check each element for modified time and update the collection's
	 * MTime to the latest timestamp from individual items in the collection.
	 */
	updateMTimeWithElements(): void;
}

/**
 * Method used to decorate a given object (publicAPI+model) with vtkCollection characteristics.
 *
 * @param publicAPI object on which methods will be bounds (public)
 * @param model object on which data structure will be bounds (protected)
 * @param {ICollectionInitialValues} [initialValues] (default: {})
 */
export function extend(publicAPI: object, model: object, initialValues? : ICollectionInitialValues): void;

/**
 * Method used to create a new instance of vtkCollection.
 * @param {ICollectionInitialValues} [initialValues] for pre-setting some of its content
 */
export function newInstance(initialValues? : ICollectionInitialValues): vtkCollection;

/**
 * vtkCollection is a container of multiple vtkObject items.
 * This can be useful for encapsulating multiple vtkObjects such as images
 * into a single vtkObject (vtkCollection instance) to be passed as input
 * to other filters and mappers as a single unit.
 */
export declare const vtkCollection: {
	newInstance: typeof newInstance;
	extend: typeof extend;
};
export default vtkCollection;
